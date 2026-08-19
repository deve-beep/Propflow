const Property = require('../models/Property');
const Favorite = require('../models/Favorite');
const Agent = require('../models/Agent');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { uploadBuffer, destroyAsset } = require('../config/cloudinary');
const { logActivity } = require('../services/activityService');
const { notify } = require('../services/notificationService');
const { ROLES, NOTIFICATION_TYPE } = require('../utils/constants');

/**
 * Builds a Mongo filter from query params for the public/staff property search.
 * Shared by listProperties and the map endpoint so filtering stays consistent.
 */
const buildPropertyFilter = (query, baseFilter = {}) => {
  const filter = { ...baseFilter };

  if (query.city) filter['location.city'] = new RegExp(`^${query.city}$`, 'i');
  if (query.locality) filter['location.locality'] = new RegExp(query.locality, 'i');
  if (query.propertyType) {
    filter.propertyType = Array.isArray(query.propertyType)
      ? { $in: query.propertyType }
      : query.propertyType;
  }
  if (query.listingType) filter.listingType = query.listingType;
  if (query.status) filter.status = query.status;
  if (query.developer) filter.developer = query.developer;
  if (query.bedrooms) filter.bedrooms = { $gte: Number(query.bedrooms) };
  if (query.bathrooms) filter.bathrooms = { $gte: Number(query.bathrooms) };
  if (query.furnishing) filter.furnishing = query.furnishing;

  if (query.priceMin || query.priceMax) {
    filter.price = {};
    if (query.priceMin) filter.price.$gte = Number(query.priceMin);
    if (query.priceMax) filter.price.$lte = Number(query.priceMax);
  }

  if (query.areaMin || query.areaMax) {
    filter['area.value'] = {};
    if (query.areaMin) filter['area.value'].$gte = Number(query.areaMin);
    if (query.areaMax) filter['area.value'].$lte = Number(query.areaMax);
  }

  if (query.amenities) {
    const amenities = Array.isArray(query.amenities) ? query.amenities : query.amenities.split(',');
    filter.amenities = { $all: amenities };
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
};

const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { publishedAt: -1, createdAt: -1 },
  area_desc: { 'area.value': -1 },
};

// ─────────────────────────────────────────────────────────────
// GET /api/properties  (public search/browse — customer-facing)
// ─────────────────────────────────────────────────────────────
const listProperties = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  // Public listing only ever shows published properties, regardless of caller.
  const filter = buildPropertyFilter(req.query, { status: 'PUBLISHED' });
  const sort = SORT_MAP[req.query.sort] || SORT_MAP.newest;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('agent', 'name avatar phone email')
      .populate('developer', 'name logo')
      .lean(),
    Property.countDocuments(filter),
  ]);

  // Personalize with favorite state if the caller is authenticated.
  let favoritedIds = new Set();
  if (req.user) {
    const favs = await Favorite.find({
      user: req.user._id,
      property: { $in: properties.map((p) => p._id) },
    }).lean();
    favoritedIds = new Set(favs.map((f) => f.property.toString()));
  }
  const withFavorites = properties.map((p) => ({ ...p, isFavorited: favoritedIds.has(p._id.toString()) }));

  sendResponse(res, 200, 'Properties fetched successfully.', withFavorites, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// GET /api/properties/:idOrSlug
// ─────────────────────────────────────────────────────────────
const getProperty = catchAsync(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);

  const property = await Property.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug })
    .populate('agent', 'name avatar phone email specialization')
    .populate('developer', 'name logo description')
    .populate('project', 'name slug amenities constructionStatus');

  if (!property) throw ApiError.notFound('Property not found.');

  // Staff can preview unpublished listings that belong to their own company; the public cannot.
  const isStaffOwner =
    req.user && req.user.company && property.company.toString() === req.user.company.toString();
  if (property.status !== 'PUBLISHED' && !isStaffOwner && req.user?.role !== ROLES.SUPER_ADMIN) {
    throw ApiError.notFound('Property not found.');
  }

  // Increment view count (fire and forget, not awaited to keep response fast)
  Property.updateOne({ _id: property._id }, { $inc: { viewsCount: 1 } }).catch(() => {});

  let isFavorited = false;
  if (req.user) {
    isFavorited = !!(await Favorite.exists({ user: req.user._id, property: property._id }));
  }

  sendResponse(res, 200, 'Property fetched successfully.', { ...property.toObject(), isFavorited });
});

// ─────────────────────────────────────────────────────────────
// GET /api/properties/map  (returns lightweight geo-filtered set for map view)
// ─────────────────────────────────────────────────────────────
const getPropertiesForMap = catchAsync(async (req, res) => {
  const filter = buildPropertyFilter(req.query, { status: 'PUBLISHED' });
  filter['location.geo.coordinates'] = { $ne: [0, 0] };

  const properties = await Property.find(filter)
    .select('title price location images bedrooms bathrooms area propertyType slug')
    .limit(500)
    .lean();

  sendResponse(res, 200, 'Map properties fetched.', properties);
});

// ─────────────────────────────────────────────────────────────
// GET /api/properties/staff  (company-scoped listing for staff dashboards — includes drafts)
// ─────────────────────────────────────────────────────────────
const listStaffProperties = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildPropertyFilter(req.query, { company: req.tenantId });

  if (req.user.role === ROLES.AGENT || req.user.role === ROLES.BROKER) {
    // Agents see only their own listings unless explicitly viewing "all"
    if (req.query.scope !== 'all') filter.agent = req.user._id;
  }

  const [properties, total] = await Promise.all([
    Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('agent', 'name avatar').lean(),
    Property.countDocuments(filter),
  ]);

  sendResponse(res, 200, 'Properties fetched successfully.', properties, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// POST /api/properties
// ─────────────────────────────────────────────────────────────
const createProperty = catchAsync(async (req, res) => {
  const property = await Property.create({
    ...req.body,
    company: req.tenantId,
    agent: req.body.agent || req.user._id,
  });

  await logActivity({
    company: req.tenantId,
    actor: req.user._id,
    action: 'PROPERTY_CREATED',
    description: `${req.user.name} created property "${property.title}"`,
    entityType: 'Property',
    entityId: property._id,
  });

  if (req.user.role === ROLES.AGENT || req.user.role === ROLES.BROKER) {
    await Agent.updateOne({ user: req.user._id }, { $inc: { 'stats.propertiesListed': 1 } });
  }

  sendResponse(res, 201, 'Property created successfully.', property);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/properties/:id
// ─────────────────────────────────────────────────────────────
const updateProperty = catchAsync(async (req, res) => {
  const property = await Property.findOne({ _id: req.params.id, company: req.tenantId });
  if (!property) throw ApiError.notFound('Property not found.');

  const isOwnerAgent = property.agent.toString() === req.user._id.toString();
  const isPrivileged = [ROLES.COMPANY_ADMIN, ROLES.PROPERTY_MANAGER, ROLES.SUPER_ADMIN].includes(req.user.role);
  if (!isOwnerAgent && !isPrivileged) {
    throw ApiError.forbidden('You can only edit properties assigned to you.');
  }

  const previousPrice = property.price;

  Object.assign(property, req.body);
  await property.save();

  if (req.body.price !== undefined && Number(req.body.price) !== previousPrice) {
    await logActivity({
      company: req.tenantId,
      actor: req.user._id,
      action: 'PROPERTY_PRICE_CHANGED',
      description: `Price changed from ${previousPrice} to ${property.price} for "${property.title}"`,
      entityType: 'Property',
      entityId: property._id,
    });

    // Notify customers who favorited this property
    const favs = await Favorite.find({ property: property._id }).select('user');
    const io = req.app.get('io');
    await Promise.all(
      favs.map((f) =>
        notify(io, {
          company: req.tenantId,
          recipient: f.user,
          type: NOTIFICATION_TYPE.PRICE_CHANGE,
          title: 'Price updated',
          message: `The price of "${property.title}" changed to ₹${property.price.toLocaleString('en-IN')}`,
          entityType: 'Property',
          entityId: property._id,
        })
      )
    );
  }

  sendResponse(res, 200, 'Property updated successfully.', property);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/properties/:id/status  (publish / unpublish / mark sold)
// ─────────────────────────────────────────────────────────────
const updatePropertyStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const property = await Property.findOne({ _id: req.params.id, company: req.tenantId });
  if (!property) throw ApiError.notFound('Property not found.');

  property.status = status;
  if (status === 'PUBLISHED' && !property.publishedAt) property.publishedAt = new Date();
  await property.save();

  if (status === 'SOLD' || status === 'RENTED') {
    const favs = await Favorite.find({ property: property._id }).select('user');
    const io = req.app.get('io');
    await Promise.all(
      favs.map((f) =>
        notify(io, {
          company: req.tenantId,
          recipient: f.user,
          type: NOTIFICATION_TYPE.PROPERTY_SOLD,
          title: status === 'SOLD' ? 'Property sold' : 'Property rented',
          message: `"${property.title}" is no longer available.`,
          entityType: 'Property',
          entityId: property._id,
        })
      )
    );
  }

  sendResponse(res, 200, 'Property status updated.', property);
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/properties/:id
// ─────────────────────────────────────────────────────────────
const deleteProperty = catchAsync(async (req, res) => {
  const property = await Property.findOneAndDelete({ _id: req.params.id, company: req.tenantId });
  if (!property) throw ApiError.notFound('Property not found.');

  // Best-effort Cloudinary cleanup; don't fail the delete if this errors.
  const allAssets = [...property.images, ...property.videos, ...property.floorPlans];
  await Promise.allSettled(
    allAssets
      .filter((a) => a.publicId)
      .map((a) => destroyAsset(a.publicId, a.url?.includes('/video/') ? 'video' : 'image'))
  );

  sendResponse(res, 200, 'Property deleted successfully.');
});

// ─────────────────────────────────────────────────────────────
// POST /api/properties/:id/images  (Cloudinary upload)
// ─────────────────────────────────────────────────────────────
const uploadPropertyImages = catchAsync(async (req, res) => {
  const property = await Property.findOne({ _id: req.params.id, company: req.tenantId });
  if (!property) throw ApiError.notFound('Property not found.');

  if (!req.files || req.files.length === 0) throw ApiError.badRequest('No images provided.');

  const uploaded = await Promise.all(
    req.files.map((file) =>
      uploadBuffer(file.buffer, { folder: `propflow/${req.tenantId}/properties/${property._id}` })
    )
  );

  const newImages = uploaded.map((r, i) => ({
    url: r.secure_url,
    publicId: r.public_id,
    isCover: property.images.length === 0 && i === 0,
  }));

  property.images.push(...newImages);
  await property.save();

  sendResponse(res, 201, 'Images uploaded successfully.', property.images);
});

// ─────────────────────────────────────────────────────────────
// POST /api/properties/:id/favorite  (toggle)
// ─────────────────────────────────────────────────────────────
const toggleFavorite = catchAsync(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw ApiError.notFound('Property not found.');

  const existing = await Favorite.findOne({ user: req.user._id, property: property._id });

  if (existing) {
    await existing.deleteOne();
    await Property.updateOne({ _id: property._id }, { $inc: { favoritesCount: -1 } });
    return sendResponse(res, 200, 'Removed from favorites.', { favorited: false });
  }

  await Favorite.create({ user: req.user._id, property: property._id, company: property.company });
  await Property.updateOne({ _id: property._id }, { $inc: { favoritesCount: 1 } });
  sendResponse(res, 201, 'Added to favorites.', { favorited: true });
});

// ─────────────────────────────────────────────────────────────
// GET /api/properties/favorites  (customer's saved properties)
// ─────────────────────────────────────────────────────────────
const listFavorites = catchAsync(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id })
    .populate({
      path: 'property',
      populate: { path: 'agent', select: 'name avatar' },
    })
    .sort({ createdAt: -1 });

  sendResponse(res, 200, 'Favorites fetched.', favorites.map((f) => f.property).filter(Boolean));
});

// ─────────────────────────────────────────────────────────────
// POST /api/properties/compare  (body: { ids: [...] })
// ─────────────────────────────────────────────────────────────
const compareProperties = catchAsync(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
    throw ApiError.badRequest('Provide between 2 and 4 property IDs to compare.');
  }

  const properties = await Property.find({ _id: { $in: ids }, status: 'PUBLISHED' })
    .populate('agent', 'name avatar')
    .lean();

  sendResponse(res, 200, 'Comparison data fetched.', properties);
});

module.exports = {
  listProperties,
  getProperty,
  getPropertiesForMap,
  listStaffProperties,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
  uploadPropertyImages,
  toggleFavorite,
  listFavorites,
  compareProperties,
};

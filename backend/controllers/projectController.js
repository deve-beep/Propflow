const Project = require('../models/Project');
const Building = require('../models/Building');
const Unit = require('../models/Unit');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

// ─────────────────────────────────────────────────────────────
// GET /api/projects
// ─────────────────────────────────────────────────────────────
const listProjects = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.tenantId ? { company: req.tenantId } : { isPublished: true };
  if (req.query.city) filter['location.city'] = new RegExp(`^${req.query.city}$`, 'i');
  if (req.query.developer) filter.developer = req.query.developer;
  if (req.query.constructionStatus) filter.constructionStatus = req.query.constructionStatus;

  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('developer', 'name logo').lean(),
    Project.countDocuments(filter),
  ]);

  sendResponse(res, 200, 'Projects fetched successfully.', projects, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:idOrSlug
// ─────────────────────────────────────────────────────────────
const getProject = catchAsync(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);

  const project = await Project.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }).populate(
    'developer',
    'name logo description website'
  );
  if (!project) throw ApiError.notFound('Project not found.');

  const buildings = await Building.find({ project: project._id });

  sendResponse(res, 200, 'Project fetched successfully.', { ...project.toObject(), buildings });
});

// ─────────────────────────────────────────────────────────────
// POST /api/projects
// ─────────────────────────────────────────────────────────────
const createProject = catchAsync(async (req, res) => {
  const project = await Project.create({ ...req.body, company: req.tenantId });
  sendResponse(res, 201, 'Project created successfully.', project);
});

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/buildings
// ─────────────────────────────────────────────────────────────
const addBuilding = catchAsync(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, company: req.tenantId });
  if (!project) throw ApiError.notFound('Project not found.');

  const building = await Building.create({
    ...req.body,
    project: project._id,
    company: req.tenantId,
  });

  project.totalBuildings += 1;
  await project.save();

  sendResponse(res, 201, 'Building added successfully.', building);
});

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/buildings/:buildingId/units
// ─────────────────────────────────────────────────────────────
const listUnits = catchAsync(async (req, res) => {
  const filter = { building: req.params.buildingId };
  if (req.query.status) filter.status = req.query.status;
  const units = await Unit.find(filter).sort({ floor: 1, unitNumber: 1 });
  sendResponse(res, 200, 'Units fetched successfully.', units);
});

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/buildings/:buildingId/units  (bulk create)
// ─────────────────────────────────────────────────────────────
const addUnits = catchAsync(async (req, res) => {
  const building = await Building.findOne({ _id: req.params.buildingId, project: req.params.id });
  if (!building) throw ApiError.notFound('Building not found.');

  const unitsInput = Array.isArray(req.body.units) ? req.body.units : [req.body];
  const units = await Unit.insertMany(
    unitsInput.map((u) => ({
      ...u,
      building: building._id,
      project: req.params.id,
      company: req.tenantId,
    }))
  );

  await Building.updateOne({ _id: building._id }, { $inc: { totalUnits: units.length } });
  await Project.updateOne(
    { _id: req.params.id },
    { $inc: { totalUnits: units.length, availableUnits: units.length } }
  );

  sendResponse(res, 201, 'Units added successfully.', units);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/units/:unitId/status
// ─────────────────────────────────────────────────────────────
const updateUnitStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const unit = await Unit.findOne({ _id: req.params.unitId, company: req.tenantId });
  if (!unit) throw ApiError.notFound('Unit not found.');

  const wasAvailable = unit.status === 'AVAILABLE';
  unit.status = status;
  if (status === 'RESERVED') {
    unit.reservedBy = req.body.reservedBy || req.user._id;
    unit.reservedAt = new Date();
  }
  await unit.save();

  if (wasAvailable && status !== 'AVAILABLE') {
    await Project.updateOne({ _id: unit.project }, { $inc: { availableUnits: -1 } });
  } else if (!wasAvailable && status === 'AVAILABLE') {
    await Project.updateOne({ _id: unit.project }, { $inc: { availableUnits: 1 } });
  }

  sendResponse(res, 200, 'Unit status updated.', unit);
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  addBuilding,
  listUnits,
  addUnits,
  updateUnitStatus,
};

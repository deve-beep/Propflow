const Company = require('../models/Company');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');

// ─────────────────────────────────────────────────────────────
// GET /api/companies  (SUPER_ADMIN — list all tenant companies)
// ─────────────────────────────────────────────────────────────
const listCompanies = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = {};
  if (req.query.subscriptionStatus) filter.subscriptionStatus = req.query.subscriptionStatus;
  if (req.query.q) filter.$text = { $search: req.query.q };

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);

  sendResponse(res, 200, 'Companies fetched successfully.', companies, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// GET /api/companies/me  (COMPANY_ADMIN's own workspace)
// ─────────────────────────────────────────────────────────────
const getMyCompany = catchAsync(async (req, res) => {
  const company = await Company.findById(req.user.company);
  if (!company) throw ApiError.notFound('Company not found.');
  sendResponse(res, 200, 'Company fetched successfully.', company);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/companies/me
// ─────────────────────────────────────────────────────────────
const updateMyCompany = catchAsync(async (req, res) => {
  const allowedFields = ['name', 'phone', 'website', 'address', 'settings'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const company = await Company.findByIdAndUpdate(req.user.company, updates, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, 'Company updated successfully.', company);
});

// ─────────────────────────────────────────────────────────────
// GET /api/companies/:id/staff  (COMPANY_ADMIN — list all staff in workspace)
// ─────────────────────────────────────────────────────────────
const listCompanyStaff = catchAsync(async (req, res) => {
  const staff = await User.find({
    company: req.tenantId,
    role: { $ne: ROLES.CUSTOMER },
  }).select('-refreshTokens');

  sendResponse(res, 200, 'Staff fetched successfully.', staff);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/companies/:id/status  (SUPER_ADMIN — activate/deactivate a tenant)
// ─────────────────────────────────────────────────────────────
const updateCompanyStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  const company = await Company.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!company) throw ApiError.notFound('Company not found.');
  sendResponse(res, 200, 'Company status updated.', company);
});

module.exports = { listCompanies, getMyCompany, updateMyCompany, listCompanyStaff, updateCompanyStatus };

const Agent = require('../models/Agent');
const User = require('../models/User');
const Property = require('../models/Property');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { ROLES } = require('../utils/constants');

// ─────────────────────────────────────────────────────────────
// GET /api/agents  (company-scoped staff list, or public agent directory)
// ─────────────────────────────────────────────────────────────
const listAgents = catchAsync(async (req, res) => {
  const filter = req.tenantId ? { company: req.tenantId, isActive: true } : { isActive: true };

  const agents = await Agent.find(filter)
    .populate('user', 'name email phone avatar bio')
    .sort({ 'stats.dealsClosed': -1 });

  sendResponse(res, 200, 'Agents fetched successfully.', agents);
});

// ─────────────────────────────────────────────────────────────
// GET /api/agents/:id
// ─────────────────────────────────────────────────────────────
const getAgent = catchAsync(async (req, res) => {
  const agent = await Agent.findById(req.params.id).populate('user', 'name email phone avatar bio specialization');
  if (!agent) throw ApiError.notFound('Agent not found.');

  const [activeListings, closedDeals] = await Promise.all([
    Property.countDocuments({ agent: agent.user._id, status: 'PUBLISHED' }),
    Deal.countDocuments({ agent: agent.user._id, stage: 'WON' }),
  ]);

  sendResponse(res, 200, 'Agent fetched successfully.', {
    ...agent.toObject(),
    activeListings,
    closedDeals,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/agents/:id/performance  (detailed analytics for one agent)
// ─────────────────────────────────────────────────────────────
const getAgentPerformance = catchAsync(async (req, res) => {
  const agent = await Agent.findById(req.params.id);
  if (!agent) throw ApiError.notFound('Agent not found.');

  const [leadsByStatus, dealsWon, revenue] = await Promise.all([
    Lead.aggregate([
      { $match: { assignedAgent: agent.user } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Deal.countDocuments({ agent: agent.user, stage: 'WON' }),
    Deal.aggregate([
      { $match: { agent: agent.user, stage: 'WON' } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
  ]);

  sendResponse(res, 200, 'Agent performance fetched.', {
    stats: agent.stats,
    rating: agent.rating,
    leadsByStatus,
    dealsWon,
    totalRevenue: revenue[0]?.total || 0,
  });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/agents/:id  (COMPANY_ADMIN edits agent profile)
// ─────────────────────────────────────────────────────────────
const updateAgent = catchAsync(async (req, res) => {
  const agent = await Agent.findOne({ _id: req.params.id, company: req.tenantId });
  if (!agent) throw ApiError.notFound('Agent not found.');

  const { specialization, territories, licenseNumber, experienceYears, isActive } = req.body;
  Object.assign(agent, {
    ...(specialization && { specialization }),
    ...(territories && { territories }),
    ...(licenseNumber && { licenseNumber }),
    ...(experienceYears !== undefined && { experienceYears }),
    ...(isActive !== undefined && { isActive }),
  });
  await agent.save();

  sendResponse(res, 200, 'Agent updated successfully.', agent);
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/agents/:id  (deactivate — never hard-delete staff accounts)
// ─────────────────────────────────────────────────────────────
const deactivateAgent = catchAsync(async (req, res) => {
  const agent = await Agent.findOne({ _id: req.params.id, company: req.tenantId });
  if (!agent) throw ApiError.notFound('Agent not found.');

  agent.isActive = false;
  await agent.save();
  await User.updateOne({ _id: agent.user }, { isActive: false });

  sendResponse(res, 200, 'Agent deactivated successfully.');
});

module.exports = { listAgents, getAgent, getAgentPerformance, updateAgent, deactivateAgent };

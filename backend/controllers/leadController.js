const Lead = require('../models/Lead');
const Agent = require('../models/Agent');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityService');
const { notify } = require('../services/notificationService');
const { LEAD_STATUS_ORDER, NOTIFICATION_TYPE, ROLES } = require('../utils/constants');

/**
 * Very simple, transparent lead scoring model: budget presence, engagement
 * signals (properties of interest), and how far along the pipeline they are
 * all add points. Real implementations would tune weights against outcome
 * data; this keeps the logic auditable rather than a black box.
 */
const computeLeadScore = (lead) => {
  let score = 0;
  if (lead.budgetMax) score += 20;
  if (lead.email) score += 10;
  if (lead.interestedProperties?.length) score += Math.min(20, lead.interestedProperties.length * 5);
  if (lead.preferredLocation?.length) score += 10;
  const stageIndex = LEAD_STATUS_ORDER.indexOf(lead.status);
  if (stageIndex > 0 && lead.status !== 'LOST') score += stageIndex * 8;
  return Math.min(100, score);
};

// ─────────────────────────────────────────────────────────────
// GET /api/leads
// ─────────────────────────────────────────────────────────────
const listLeads = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { company: req.tenantId, isArchived: false };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.user.role === ROLES.AGENT || req.user.role === ROLES.BROKER) {
    if (req.query.scope !== 'all') filter.assignedAgent = req.user._id;
  } else if (req.query.agent) {
    filter.assignedAgent = req.query.agent;
  }
  if (req.query.q) filter.$text = { $search: req.query.q };

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedAgent', 'name avatar')
      .populate('interestedProperties', 'title price images')
      .lean(),
    Lead.countDocuments(filter),
  ]);

  sendResponse(res, 200, 'Leads fetched successfully.', leads, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// GET /api/leads/pipeline  (grouped by status, for the kanban board)
// ─────────────────────────────────────────────────────────────
const getPipeline = catchAsync(async (req, res) => {
  const filter = { company: req.tenantId, isArchived: false };
  if (req.user.role === ROLES.AGENT || req.user.role === ROLES.BROKER) {
    if (req.query.scope !== 'all') filter.assignedAgent = req.user._id;
  }

  const leads = await Lead.find(filter)
    .sort({ updatedAt: -1 })
    .populate('assignedAgent', 'name avatar')
    .lean();

  const grouped = LEAD_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status);
    return acc;
  }, {});

  sendResponse(res, 200, 'Pipeline fetched successfully.', grouped);
});

// ─────────────────────────────────────────────────────────────
// GET /api/leads/:id
// ─────────────────────────────────────────────────────────────
const getLead = catchAsync(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, company: req.tenantId })
    .populate('assignedAgent', 'name avatar email phone')
    .populate('interestedProperties', 'title price images location')
    .populate('notes.createdBy', 'name avatar');

  if (!lead) throw ApiError.notFound('Lead not found.');
  sendResponse(res, 200, 'Lead fetched successfully.', lead);
});

// ─────────────────────────────────────────────────────────────
// POST /api/leads
// ─────────────────────────────────────────────────────────────
const createLead = catchAsync(async (req, res) => {
  const leadData = { ...req.body, company: req.tenantId };
  leadData.score = computeLeadScore(leadData);

  const lead = await Lead.create(leadData);

  await logActivity({
    company: req.tenantId,
    actor: req.user._id,
    action: 'LEAD_CREATED',
    description: `${req.user.name} created lead "${lead.name}"`,
    entityType: 'Lead',
    entityId: lead._id,
  });

  if (lead.assignedAgent) {
    await Agent.updateOne({ user: lead.assignedAgent }, { $inc: { 'stats.leadsAssigned': 1 } });
    const io = req.app.get('io');
    await notify(io, {
      company: req.tenantId,
      recipient: lead.assignedAgent,
      type: NOTIFICATION_TYPE.NEW_LEAD,
      title: 'New lead assigned',
      message: `${lead.name} has been assigned to you.`,
      entityType: 'Lead',
      entityId: lead._id,
    });
  }

  sendResponse(res, 201, 'Lead created successfully.', lead);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/leads/:id
// ─────────────────────────────────────────────────────────────
const updateLead = catchAsync(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, company: req.tenantId });
  if (!lead) throw ApiError.notFound('Lead not found.');

  const previousAgent = lead.assignedAgent?.toString();

  Object.assign(lead, req.body);
  lead.score = computeLeadScore(lead);
  await lead.save();

  if (req.body.assignedAgent && req.body.assignedAgent !== previousAgent) {
    await Agent.updateOne({ user: lead.assignedAgent }, { $inc: { 'stats.leadsAssigned': 1 } });
    const io = req.app.get('io');
    await notify(io, {
      company: req.tenantId,
      recipient: lead.assignedAgent,
      type: NOTIFICATION_TYPE.NEW_ASSIGNMENT,
      title: 'Lead assigned to you',
      message: `${lead.name} has been assigned to you.`,
      entityType: 'Lead',
      entityId: lead._id,
    });
  }

  sendResponse(res, 200, 'Lead updated successfully.', lead);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/leads/:id/status  (drag-and-drop pipeline move)
// ─────────────────────────────────────────────────────────────
const updateLeadStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!LEAD_STATUS_ORDER.includes(status)) throw ApiError.badRequest('Invalid lead status.');

  const lead = await Lead.findOne({ _id: req.params.id, company: req.tenantId });
  if (!lead) throw ApiError.notFound('Lead not found.');

  const previousStatus = lead.status;
  lead.status = status;
  lead.score = computeLeadScore(lead);
  await lead.save();

  await logActivity({
    company: req.tenantId,
    actor: req.user._id,
    action: 'LEAD_STATUS_CHANGED',
    description: `${req.user.name} moved "${lead.name}" from ${previousStatus} to ${status}`,
    entityType: 'Lead',
    entityId: lead._id,
    metadata: { previousStatus, newStatus: status },
  });

  sendResponse(res, 200, 'Lead status updated.', lead);
});

// ─────────────────────────────────────────────────────────────
// POST /api/leads/:id/notes
// ─────────────────────────────────────────────────────────────
const addNote = catchAsync(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw ApiError.badRequest('Note text is required.');

  const lead = await Lead.findOne({ _id: req.params.id, company: req.tenantId });
  if (!lead) throw ApiError.notFound('Lead not found.');

  lead.notes.push({ text, createdBy: req.user._id });
  await lead.save();

  await logActivity({
    company: req.tenantId,
    actor: req.user._id,
    action: 'NOTE_ADDED',
    description: `${req.user.name} added a note to "${lead.name}"`,
    entityType: 'Lead',
    entityId: lead._id,
  });

  sendResponse(res, 201, 'Note added successfully.', lead.notes[lead.notes.length - 1]);
});

// ─────────────────────────────────────────────────────────────
// GET /api/leads/:id/activity
// ─────────────────────────────────────────────────────────────
const getLeadActivity = catchAsync(async (req, res) => {
  const Activity = require('../models/Activity');
  const activities = await Activity.find({
    company: req.tenantId,
    'relatedEntity.entityType': 'Lead',
    'relatedEntity.entityId': req.params.id,
  })
    .sort({ createdAt: -1 })
    .populate('actor', 'name avatar');

  sendResponse(res, 200, 'Activity history fetched.', activities);
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/leads/:id  (archive, not hard-delete — preserves CRM history)
// ─────────────────────────────────────────────────────────────
const archiveLead = catchAsync(async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, company: req.tenantId },
    { isArchived: true },
    { new: true }
  );
  if (!lead) throw ApiError.notFound('Lead not found.');
  sendResponse(res, 200, 'Lead archived successfully.');
});

module.exports = {
  listLeads,
  getPipeline,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  addNote,
  getLeadActivity,
  archiveLead,
};

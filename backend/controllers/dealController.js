const Deal = require('../models/Deal');
const Agent = require('../models/Agent');
const Property = require('../models/Property');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityService');
const { ROLES } = require('../utils/constants');

// ─────────────────────────────────────────────────────────────
// GET /api/deals
// ─────────────────────────────────────────────────────────────
const listDeals = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = { company: req.tenantId };

  if (req.query.stage) filter.stage = req.query.stage;
  if (req.user.role === ROLES.AGENT || req.user.role === ROLES.BROKER) {
    if (req.query.scope !== 'all') filter.agent = req.user._id;
  }

  const [deals, total] = await Promise.all([
    Deal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('property', 'title images price')
      .populate('customer', 'name avatar')
      .populate('agent', 'name avatar')
      .lean(),
    Deal.countDocuments(filter),
  ]);

  sendResponse(res, 200, 'Deals fetched successfully.', deals, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// POST /api/deals
// ─────────────────────────────────────────────────────────────
const createDeal = catchAsync(async (req, res) => {
  const deal = await Deal.create({ ...req.body, company: req.tenantId });

  await logActivity({
    company: req.tenantId,
    actor: req.user._id,
    action: 'DEAL_CREATED',
    description: `${req.user.name} opened a deal worth ₹${deal.dealValue.toLocaleString('en-IN')}`,
    entityType: 'Deal',
    entityId: deal._id,
  });

  sendResponse(res, 201, 'Deal created successfully.', deal);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/deals/:id/stage  (WON / LOST / OPEN)
// ─────────────────────────────────────────────────────────────
const updateDealStage = catchAsync(async (req, res) => {
  const { stage, lostReason } = req.body;
  const deal = await Deal.findOne({ _id: req.params.id, company: req.tenantId });
  if (!deal) throw ApiError.notFound('Deal not found.');

  deal.stage = stage;
  if (stage === 'WON') {
    deal.closedAt = new Date();
  }
  if (stage === 'LOST') {
    deal.lostReason = lostReason;
  }
  await deal.save();

  if (stage === 'WON') {
    await Agent.updateOne(
      { user: deal.agent },
      { $inc: { 'stats.dealsClosed': 1, 'stats.revenueGenerated': deal.commissionAmount } }
    );

    await Transaction.create({
      company: req.tenantId,
      deal: deal._id,
      property: deal.property,
      type: 'COMMISSION',
      amount: deal.commissionAmount,
      paidTo: deal.agent,
      status: 'PENDING',
      transactionDate: new Date(),
    });

    await Property.updateOne({ _id: deal.property }, { status: 'SOLD' });
  }

  await logActivity({
    company: req.tenantId,
    actor: req.user._id,
    action: 'DEAL_STAGE_CHANGED',
    description: `Deal moved to ${stage}`,
    entityType: 'Deal',
    entityId: deal._id,
  });

  sendResponse(res, 200, 'Deal updated successfully.', deal);
});

module.exports = { listDeals, createDeal, updateDealStage };

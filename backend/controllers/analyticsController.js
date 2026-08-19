const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Property = require('../models/Property');
const Appointment = require('../models/Appointment');
const Deal = require('../models/Deal');
const Agent = require('../models/Agent');
const User = require('../models/User');
const Company = require('../models/Company');
const catchAsync = require('../utils/catchAsync');
const { sendResponse } = require('../utils/ApiResponse');

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/dashboard  (CRM dashboard for a company)
// ─────────────────────────────────────────────────────────────
const getCrmDashboard = catchAsync(async (req, res) => {
  const companyFilter = { company: req.tenantId };
  const companyObjectId = new mongoose.Types.ObjectId(req.tenantId);

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    totalVisits,
    completedVisits,
    activeDeals,
    closedDeals,
    revenueAgg,
    expectedRevenueAgg,
    totalClosableLeads,
  ] = await Promise.all([
    Lead.countDocuments({ ...companyFilter, isArchived: false }),
    Lead.countDocuments({ ...companyFilter, status: 'NEW', isArchived: false }),
    Lead.countDocuments({ ...companyFilter, status: 'QUALIFIED', isArchived: false }),
    Appointment.countDocuments(companyFilter),
    Appointment.countDocuments({ ...companyFilter, status: 'COMPLETED' }),
    Deal.countDocuments({ ...companyFilter, stage: 'OPEN' }),
    Deal.countDocuments({ ...companyFilter, stage: 'WON' }),
    Deal.aggregate([
      { $match: { company: companyObjectId, stage: 'WON' } },
      { $group: { _id: null, total: { $sum: '$dealValue' } } },
    ]),
    Deal.aggregate([
      { $match: { company: companyObjectId, stage: 'OPEN' } },
      { $group: { _id: null, total: { $sum: '$dealValue' } } },
    ]),
    Lead.countDocuments({ ...companyFilter, status: { $in: ['CLOSED', 'LOST'] }, isArchived: false }),
  ]);

  const conversionRate = totalClosableLeads > 0 ? Math.round((closedDeals / totalClosableLeads) * 1000) / 10 : 0;

  sendResponse(res, 200, 'CRM dashboard metrics fetched.', {
    totalLeads,
    newLeads,
    qualifiedLeads,
    propertyVisits: totalVisits,
    completedVisits,
    activeDeals,
    closedDeals,
    conversionRate,
    revenueGenerated: revenueAgg[0]?.total || 0,
    expectedRevenue: expectedRevenueAgg[0]?.total || 0,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/company  (revenue trend, lead conversion, top locations/properties)
// ─────────────────────────────────────────────────────────────
const getCompanyAnalytics = catchAsync(async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.tenantId);

  const [salesTrend, topLocations, agentPerformance, leadSourceBreakdown] = await Promise.all([
    Deal.aggregate([
      { $match: { company: companyId, stage: 'WON' } },
      {
        $group: {
          _id: { year: { $year: '$closedAt' }, month: { $month: '$closedAt' } },
          totalRevenue: { $sum: '$dealValue' },
          dealCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Property.aggregate([
      { $match: { company: companyId, status: 'PUBLISHED' } },
      { $group: { _id: '$location.city', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Agent.find({ company: companyId, isActive: true })
      .populate('user', 'name avatar')
      .sort({ 'stats.dealsClosed': -1 })
      .limit(10),
    Lead.aggregate([
      { $match: { company: companyId, isArchived: false } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]),
  ]);

  sendResponse(res, 200, 'Company analytics fetched.', {
    salesTrend,
    topLocations,
    agentPerformance,
    leadSourceBreakdown,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/platform  (SUPER_ADMIN only — cross-tenant platform metrics)
// ─────────────────────────────────────────────────────────────
const getPlatformAnalytics = catchAsync(async (req, res) => {
  const [totalUsers, totalCompanies, totalProperties, totalAgents, totalLeads, totalDeals, revenueAgg] =
    await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Property.countDocuments(),
      Agent.countDocuments(),
      Lead.countDocuments(),
      Deal.countDocuments({ stage: 'WON' }),
      Deal.aggregate([{ $match: { stage: 'WON' } }, { $group: { _id: null, total: { $sum: '$dealValue' } } }]),
    ]);

  const [companiesByPlan, propertiesByCity, usersByRole] = await Promise.all([
    Company.aggregate([{ $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }]),
    Property.aggregate([
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  sendResponse(res, 200, 'Platform analytics fetched.', {
    totals: {
      users: totalUsers,
      companies: totalCompanies,
      properties: totalProperties,
      agents: totalAgents,
      leads: totalLeads,
      dealsClosed: totalDeals,
      totalRevenue: revenueAgg[0]?.total || 0,
    },
    companiesByPlan,
    propertiesByCity,
    usersByRole,
  });
});

module.exports = { getCrmDashboard, getCompanyAnalytics, getPlatformAnalytics };

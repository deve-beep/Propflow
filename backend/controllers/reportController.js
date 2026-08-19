const Property = require('../models/Property');
const Lead = require('../models/Lead');
const Agent = require('../models/Agent');
const Deal = require('../models/Deal');
const Appointment = require('../models/Appointment');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { toCSV, streamPdfReport } = require('../services/reportService');

const REPORT_DEFINITIONS = {
  properties: {
    title: 'Property Report',
    columns: ['title', 'propertyType', 'listingType', 'status', 'price', 'city', 'bedrooms', 'createdAt'],
    fetch: async (tenantId) => {
      const docs = await Property.find({ company: tenantId }).lean();
      return docs.map((d) => ({
        title: d.title,
        propertyType: d.propertyType,
        listingType: d.listingType,
        status: d.status,
        price: d.price,
        city: d.location?.city,
        bedrooms: d.bedrooms,
        createdAt: d.createdAt.toISOString().slice(0, 10),
      }));
    },
  },
  leads: {
    title: 'Lead Report',
    columns: ['name', 'phone', 'email', 'source', 'status', 'score', 'createdAt'],
    fetch: async (tenantId) => {
      const docs = await Lead.find({ company: tenantId, isArchived: false }).lean();
      return docs.map((d) => ({
        name: d.name,
        phone: d.phone,
        email: d.email,
        source: d.source,
        status: d.status,
        score: d.score,
        createdAt: d.createdAt.toISOString().slice(0, 10),
      }));
    },
  },
  agents: {
    title: 'Agent Report',
    columns: ['name', 'propertiesListed', 'leadsAssigned', 'visitsCompleted', 'dealsClosed', 'revenueGenerated'],
    fetch: async (tenantId) => {
      const docs = await Agent.find({ company: tenantId }).populate('user', 'name').lean();
      return docs.map((d) => ({
        name: d.user?.name,
        propertiesListed: d.stats.propertiesListed,
        leadsAssigned: d.stats.leadsAssigned,
        visitsCompleted: d.stats.visitsCompleted,
        dealsClosed: d.stats.dealsClosed,
        revenueGenerated: d.stats.revenueGenerated,
      }));
    },
  },
  sales: {
    title: 'Sales Report',
    columns: ['property', 'agent', 'dealValue', 'commissionAmount', 'stage', 'closedAt'],
    fetch: async (tenantId) => {
      const docs = await Deal.find({ company: tenantId })
        .populate('property', 'title')
        .populate('agent', 'name')
        .lean();
      return docs.map((d) => ({
        property: d.property?.title,
        agent: d.agent?.name,
        dealValue: d.dealValue,
        commissionAmount: d.commissionAmount,
        stage: d.stage,
        closedAt: d.closedAt ? d.closedAt.toISOString().slice(0, 10) : '',
      }));
    },
  },
  revenue: {
    title: 'Revenue Report',
    columns: ['property', 'agent', 'dealValue', 'commissionAmount', 'closedAt'],
    fetch: async (tenantId) => {
      const docs = await Deal.find({ company: tenantId, stage: 'WON' })
        .populate('property', 'title')
        .populate('agent', 'name')
        .lean();
      return docs.map((d) => ({
        property: d.property?.title,
        agent: d.agent?.name,
        dealValue: d.dealValue,
        commissionAmount: d.commissionAmount,
        closedAt: d.closedAt ? d.closedAt.toISOString().slice(0, 10) : '',
      }));
    },
  },
  appointments: {
    title: 'Appointment Report',
    columns: ['property', 'customer', 'agent', 'scheduledDate', 'scheduledTime', 'status'],
    fetch: async (tenantId) => {
      const docs = await Appointment.find({ company: tenantId })
        .populate('property', 'title')
        .populate('customer', 'name')
        .populate('agent', 'name')
        .lean();
      return docs.map((d) => ({
        property: d.property?.title,
        customer: d.customer?.name,
        agent: d.agent?.name,
        scheduledDate: d.scheduledDate.toISOString().slice(0, 10),
        scheduledTime: d.scheduledTime,
        status: d.status,
      }));
    },
  },
};

// ─────────────────────────────────────────────────────────────
// GET /api/reports/:reportType?format=pdf|csv
// ─────────────────────────────────────────────────────────────
const generateReport = catchAsync(async (req, res) => {
  const { reportType } = req.params;
  const format = req.query.format === 'pdf' ? 'pdf' : 'csv';

  const definition = REPORT_DEFINITIONS[reportType];
  if (!definition) throw ApiError.badRequest(`Unknown report type: ${reportType}`);

  const rows = await definition.fetch(req.tenantId);

  if (format === 'csv') {
    const csv = toCSV(rows, definition.columns);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
    return res.send(csv);
  }

  streamPdfReport(res, {
    title: definition.title,
    columns: definition.columns,
    rows,
    filename: `${reportType}-report.pdf`,
  });
});

module.exports = { generateReport };

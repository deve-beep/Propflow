const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const Agent = require('../models/Agent');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notify } = require('../services/notificationService');
const { NOTIFICATION_TYPE, ROLES } = require('../utils/constants');

// ─────────────────────────────────────────────────────────────
// POST /api/appointments  (customer requests a visit)
// ─────────────────────────────────────────────────────────────
const requestAppointment = catchAsync(async (req, res) => {
  const { property: propertyId, scheduledDate, scheduledTime, customerNotes, leadId } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) throw ApiError.notFound('Property not found.');

  const appointment = await Appointment.create({
    company: property.company,
    property: property._id,
    customer: req.user._id,
    agent: property.agent,
    lead: leadId || null,
    scheduledDate,
    scheduledTime,
    customerNotes,
  });

  const io = req.app.get('io');
  await notify(io, {
    company: property.company,
    recipient: property.agent,
    type: NOTIFICATION_TYPE.APPOINTMENT_REQUESTED,
    title: 'New visit request',
    message: `${req.user.name} requested a visit for "${property.title}"`,
    entityType: 'Appointment',
    entityId: appointment._id,
  });

  sendResponse(res, 201, 'Visit requested successfully. The agent will confirm shortly.', appointment);
});

// ─────────────────────────────────────────────────────────────
// GET /api/appointments  (staff: company-scoped; customer: their own)
// ─────────────────────────────────────────────────────────────
const listAppointments = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const filter = {};

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customer = req.user._id;
  } else {
    filter.company = req.tenantId;
    if (req.user.role === ROLES.AGENT || req.user.role === ROLES.BROKER) {
      if (req.query.scope !== 'all') filter.agent = req.user._id;
    }
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.scheduledDate = {};
    if (req.query.from) filter.scheduledDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.scheduledDate.$lte = new Date(req.query.to);
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('property', 'title images location price')
      .populate('customer', 'name avatar phone email')
      .populate('agent', 'name avatar phone email')
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  sendResponse(res, 200, 'Appointments fetched successfully.', appointments, buildMeta(page, limit, total));
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/status
// ─────────────────────────────────────────────────────────────
const updateAppointmentStatus = catchAsync(async (req, res) => {
  const { status, agentNotes, cancellationReason } = req.body;

  const filter =
    req.user.role === ROLES.CUSTOMER
      ? { _id: req.params.id, customer: req.user._id }
      : { _id: req.params.id, company: req.tenantId };

  const appointment = await Appointment.findOne(filter);
  if (!appointment) throw ApiError.notFound('Appointment not found.');

  // Customers may only cancel; agents/admins can confirm/complete/cancel.
  if (req.user.role === ROLES.CUSTOMER && status !== 'CANCELLED') {
    throw ApiError.forbidden('You can only cancel your own appointments.');
  }

  appointment.status = status;
  if (agentNotes) appointment.agentNotes = agentNotes;
  if (cancellationReason) appointment.cancellationReason = cancellationReason;
  if (status === 'COMPLETED') appointment.completedAt = new Date();
  await appointment.save();

  if (status === 'COMPLETED') {
    await Agent.updateOne({ user: appointment.agent }, { $inc: { 'stats.visitsCompleted': 1 } });
  }

  const io = req.app.get('io');
  const notifyRecipient = req.user.role === ROLES.CUSTOMER ? appointment.agent : appointment.customer;
  if (status === 'CONFIRMED') {
    await notify(io, {
      company: appointment.company,
      recipient: appointment.customer,
      type: NOTIFICATION_TYPE.APPOINTMENT_CONFIRMED,
      title: 'Visit confirmed',
      message: `Your visit on ${new Date(appointment.scheduledDate).toDateString()} at ${appointment.scheduledTime} has been confirmed.`,
      entityType: 'Appointment',
      entityId: appointment._id,
    });
  } else if (status === 'CANCELLED') {
    await notify(io, {
      company: appointment.company,
      recipient: notifyRecipient,
      type: NOTIFICATION_TYPE.APPOINTMENT_REQUESTED,
      title: 'Visit cancelled',
      message: `The scheduled visit on ${new Date(appointment.scheduledDate).toDateString()} was cancelled.`,
      entityType: 'Appointment',
      entityId: appointment._id,
    });
  }

  sendResponse(res, 200, 'Appointment updated successfully.', appointment);
});

module.exports = { requestAppointment, listAppointments, updateAppointmentStatus };

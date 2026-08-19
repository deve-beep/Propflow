const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../utils/constants');

const appointmentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },

    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true }, // "14:30"
    durationMinutes: { type: Number, default: 30 },

    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: 'REQUESTED',
      index: true,
    },

    customerNotes: String,
    agentNotes: String,
    cancellationReason: String,

    completedAt: Date,
  },
  { timestamps: true }
);

appointmentSchema.index({ agent: 1, scheduledDate: 1 });
appointmentSchema.index({ company: 1, status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

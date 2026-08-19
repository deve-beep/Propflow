const mongoose = require('mongoose');
const { LEAD_STATUS, LEAD_SOURCE } = require('../utils/constants');

const leadSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },

    source: { type: String, enum: Object.values(LEAD_SOURCE), default: 'WEBSITE' },

    budgetMin: Number,
    budgetMax: Number,
    preferredLocation: [String],
    propertyType: [String],

    interestedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],

    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    linkedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    score: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: Object.values(LEAD_STATUS), default: 'NEW', index: true },

    notes: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    followUpDate: Date,

    expectedRevenue: { type: Number, default: 0 },

    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leadSchema.index({ company: 1, status: 1, assignedAgent: 1 });
leadSchema.index({ company: 1, followUpDate: 1 });
leadSchema.index({ name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Lead', leadSchema);

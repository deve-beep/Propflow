const mongoose = require('mongoose');
const { DEAL_STAGE } = require('../utils/constants');

const dealSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    dealValue: { type: Number, required: true },
    commissionPercent: { type: Number, default: 2 },
    commissionAmount: { type: Number, default: 0 },

    stage: { type: String, enum: Object.values(DEAL_STAGE), default: 'OPEN', index: true },

    closedAt: Date,
    lostReason: String,
  },
  { timestamps: true }
);

dealSchema.pre('save', function (next) {
  if (this.isModified('dealValue') || this.isModified('commissionPercent')) {
    this.commissionAmount = Math.round((this.dealValue * this.commissionPercent) / 100);
  }
  next();
});

dealSchema.index({ company: 1, stage: 1, agent: 1 });

module.exports = mongoose.model('Deal', dealSchema);

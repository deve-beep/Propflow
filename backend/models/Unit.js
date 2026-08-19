const mongoose = require('mongoose');
const { UNIT_STATUS } = require('../utils/constants');

const unitSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },

    unitNumber: { type: String, required: true }, // e.g. "A-1204"
    floor: { type: Number, required: true },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: {
      value: Number,
      unit: { type: String, enum: ['SQFT', 'SQM'], default: 'SQFT' },
    },
    facing: String, // e.g. "North-East"
    price: { type: Number, required: true },

    status: { type: String, enum: Object.values(UNIT_STATUS), default: 'AVAILABLE', index: true },

    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reservedAt: Date,

    linkedProperty: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
  },
  { timestamps: true }
);

unitSchema.index({ building: 1, unitNumber: 1 }, { unique: true });
unitSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Unit', unitSchema);

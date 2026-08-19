const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },

    name: { type: String, required: true, trim: true }, // e.g. "Tower A"
    totalFloors: { type: Number, required: true },
    unitsPerFloor: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

buildingSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Building', buildingSchema);

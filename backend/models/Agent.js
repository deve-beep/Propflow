const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    specialization: [{ type: String }], // e.g. ['Residential', 'Luxury', 'Commercial']
    licenseNumber: String,
    experienceYears: { type: Number, default: 0 },

    territories: [{ type: String }], // cities/localities they operate in

    stats: {
      propertiesListed: { type: Number, default: 0 },
      leadsAssigned: { type: Number, default: 0 },
      visitsCompleted: { type: Number, default: 0 },
      dealsClosed: { type: Number, default: 0 },
      revenueGenerated: { type: Number, default: 0 },
    },

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

agentSchema.index({ company: 1, 'stats.dealsClosed': -1 });

module.exports = mongoose.model('Agent', agentSchema);

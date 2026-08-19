const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // A customer can engage with multiple companies over time; we track the primary/most recent one
    // for tenant-scoped queries, but favorites/enquiries reference company per-item.
    primaryCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

    preferences: {
      budgetMin: Number,
      budgetMax: Number,
      preferredCities: [String],
      preferredLocalities: [String],
      propertyTypes: [String],
      bedrooms: Number,
    },

    kycVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);

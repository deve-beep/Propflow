const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true }, // user-facing label, e.g. "3BHK Mohali under 1.2Cr"
    filters: {
      city: String,
      locality: String,
      priceMin: Number,
      priceMax: Number,
      propertyType: [String],
      listingType: String,
      bedrooms: Number,
      bathrooms: Number,
      furnishing: String,
      amenities: [String],
    },
    alertsEnabled: { type: Boolean, default: true },
    lastNotifiedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedSearch', savedSearchSchema);

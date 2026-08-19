const mongoose = require('mongoose');
const slugify = require('slugify');
const { PROPERTY_STATUS, PROPERTY_TYPE, LISTING_TYPE, FURNISHING } = require('../utils/constants');

const propertySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    title: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    description: { type: String, required: true },

    listingType: { type: String, enum: Object.values(LISTING_TYPE), required: true },
    propertyType: { type: String, enum: Object.values(PROPERTY_TYPE), required: true },
    status: { type: String, enum: Object.values(PROPERTY_STATUS), default: 'DRAFT', index: true },

    price: { type: Number, required: true, min: 0 },
    priceNegotiable: { type: Boolean, default: false },
    maintenanceCharge: { type: Number, default: 0 },

    location: {
      address: String,
      city: { type: String, required: true, index: true },
      locality: { type: String, index: true },
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
    },

    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    balconies: { type: Number, default: 0 },
    area: {
      value: { type: Number, required: true },
      unit: { type: String, enum: ['SQFT', 'SQM', 'ACRE'], default: 'SQFT' },
    },
    floor: { type: Number },
    totalFloors: { type: Number },
    furnishing: { type: String, enum: Object.values(FURNISHING), default: 'UNFURNISHED' },
    ageOfProperty: { type: Number }, // years

    amenities: [{ type: String }],

    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        isCover: { type: Boolean, default: false },
      },
    ],
    videos: [
      {
        url: String,
        publicId: String,
      },
    ],
    floorPlans: [
      {
        url: String,
        publicId: String,
        label: String,
      },
    ],

    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },

    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    investment: {
      expectedRentalYield: Number, // percentage
      expectedAppreciation: Number, // percentage per year
      monthlyRent: Number,
    },

    viewsCount: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    enquiriesCount: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    publishedAt: Date,

    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  { timestamps: true }
);

propertySchema.pre('validate', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(`${this.title}-${this._id || Date.now().toString(36)}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

// Text search across title/description/location
propertySchema.index({ title: 'text', description: 'text', 'location.city': 'text', 'location.locality': 'text' });
// Geo search
propertySchema.index({ 'location.geo': '2dsphere' });
// Common filter combinations
propertySchema.index({ company: 1, status: 1, propertyType: 1, price: 1 });
propertySchema.index({ company: 1, 'location.city': 1, status: 1 });
propertySchema.index({ company: 1, bedrooms: 1, price: 1 });

module.exports = mongoose.model('Property', propertySchema);

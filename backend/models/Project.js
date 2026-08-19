const mongoose = require('mongoose');
const slugify = require('slugify');
const { CONSTRUCTION_STATUS } = require('../utils/constants');

const projectSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    developer: { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', required: true, index: true },

    name: { type: String, required: true, trim: true },
    slug: String,
    description: String,

    location: {
      address: String,
      city: { type: String, required: true, index: true },
      locality: String,
      state: String,
      pincode: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },

    amenities: [{ type: String }],
    constructionStatus: {
      type: String,
      enum: Object.values(CONSTRUCTION_STATUS),
      default: 'PRE_LAUNCH',
    },
    completionDate: Date,
    launchDate: Date,

    priceRange: {
      min: Number,
      max: Number,
    },

    images: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],
    floorPlans: [
      {
        url: String,
        publicId: String,
        label: String,
      },
    ],

    totalBuildings: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 0 },
    availableUnits: { type: Number, default: 0 },

    reraId: String,
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(`${this.name}-${this._id || Date.now().toString(36)}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

projectSchema.index({ 'location.geo': '2dsphere' });
projectSchema.index({ company: 1, 'location.city': 1 });

module.exports = mongoose.model('Project', projectSchema);

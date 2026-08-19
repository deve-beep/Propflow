const mongoose = require('mongoose');
const slugify = require('slugify');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    logo: {
      url: String,
      publicId: String,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    website: String,
    address: {
      line1: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },
    subscriptionPlan: {
      type: String,
      enum: ['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'TRIAL',
    },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING'],
      default: 'TRIALING',
    },
    trialEndsAt: Date,
    isActive: { type: Boolean, default: true },
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

companySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(`${this.name}-${Date.now().toString(36)}`, { lower: true, strict: true });
  }
  next();
});

companySchema.index({ name: 'text' });

module.exports = mongoose.model('Company', companySchema);

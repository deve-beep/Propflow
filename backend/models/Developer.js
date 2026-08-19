const mongoose = require('mongoose');

const developerSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // login account, if any

    name: { type: String, required: true, trim: true },
    logo: {
      url: String,
      publicId: String,
    },
    description: String,
    establishedYear: Number,
    website: String,
    headquarters: String,

    totalProjects: { type: Number, default: 0 },
    reraId: String,

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

developerSchema.index({ company: 1, name: 1 });

module.exports = mongoose.model('Developer', developerSchema);

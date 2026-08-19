const mongoose = require('mongoose');
const { DOCUMENT_TYPE } = require('../utils/constants');

const documentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    type: { type: String, enum: Object.values(DOCUMENT_TYPE), required: true },

    title: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: String,
    sizeBytes: Number,

    // What this document is attached to
    relatedEntity: {
      entityType: String, // 'Property' | 'Deal' | 'User' | 'Project'
      entityId: mongoose.Schema.Types.ObjectId,
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

documentSchema.index({ company: 1, 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

module.exports = mongoose.model('Document', documentSchema);

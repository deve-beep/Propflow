const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    action: { type: String, required: true }, // e.g. 'LEAD_STATUS_CHANGED', 'NOTE_ADDED', 'PROPERTY_CREATED'
    description: { type: String, required: true },

    relatedEntity: {
      entityType: String, // 'Lead' | 'Property' | 'Deal' | 'Appointment'
      entityId: mongoose.Schema.Types.ObjectId,
    },

    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

activitySchema.index({ company: 1, 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

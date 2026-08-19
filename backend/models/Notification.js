const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },

    // Polymorphic-ish reference to whatever triggered the notification (lead, property, appointment...)
    relatedEntity: {
      entityType: String, // 'Lead' | 'Property' | 'Appointment' | 'Message' | 'Deal'
      entityId: mongoose.Schema.Types.ObjectId,
    },

    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

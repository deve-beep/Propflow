const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },

    lastMessage: {
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: Date,
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ company: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

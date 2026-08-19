const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

    type: { type: String, enum: ['SALE', 'RENT', 'COMMISSION'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING' },

    transactionDate: { type: Date, default: Date.now },
    reference: String,
    notes: String,
  },
  { timestamps: true }
);

transactionSchema.index({ company: 1, transactionDate: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reason: { type: String, trim: true, maxlength: 500, default: '' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  previousBalance: { type: Number, default: null },
  newBalance: { type: Number, default: null },
  reference: { type: String, trim: true, default: '' },
  date: {
    type: Date,
    default: Date.now,
  },
});

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 10, // give 10 credits by default to allow initial swaps
      min: [0, 'Balance cannot be negative'],
    },
    transactions: [TransactionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wallet', WalletSchema);

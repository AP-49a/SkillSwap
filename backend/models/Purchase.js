const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      min: [1, 'Purchase credits must be at least 1'],
    },
    status: {
      type: String,
      enum: ['completed'],
      default: 'completed',
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);

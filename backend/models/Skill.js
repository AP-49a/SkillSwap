const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a skill title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Technology',
        'Language',
        'Design',
        'Music',
        'Marketing',
        'Business',
        'Academics',
        'Other',
      ],
    },
    credits: {
      type: Number,
      required: [true, 'Please set credit cost'],
      min: [1, 'Credits must be at least 1'],
    },
    duration: {
      type: Number,
      default: 60, // duration in minutes
      min: [15, 'Duration must be at least 15 minutes'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Skill', SkillSchema);

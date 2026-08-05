const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
    },
    skillLearned: {
      type: String,
      required: true,
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 160,
      default: '',
    },
    about: {
      type: String,
      default: '',
    },
    skillsOffered: [
      {
        skill: { type: String, required: true },
        level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Intermediate' },
      },
    ],
    skillsWanted: [
      {
        skill: { type: String, required: true },
        priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
      },
    ],
    experienceLevel: {
      type: String,
      enum: ['Student', 'Junior Professional', 'Senior Professional', 'Veteran Educator', 'Hobbies Specialist'],
      default: 'Junior Professional',
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    location: {
      type: String,
      default: '',
    },
    collegeOrCompany: {
      type: String,
      default: '',
    },
    portfolioLinks: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    availabilityCalendar: {
      type: [String],
      default: [],
    },
    preferredLearningMode: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Online',
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    totalRatingsCount: {
      type: Number,
      default: 0,
    },
    completedSwapsCount: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    projects: [
      {
        title: { type: String, required: true },
        description: String,
        link: String,
      },
    ],
    certificates: [
      {
        title: { type: String, required: true },
        issuer: String,
        year: String,
      },
    ],
    achievements: {
      type: [String],
      default: ['welcome_badge'],
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);

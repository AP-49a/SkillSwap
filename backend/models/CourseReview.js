const mongoose = require('mongoose');

const CourseReviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      trim: true,
      maxlength: [2000, 'Comment cannot be more than 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per student per course — enforced at DB level
CourseReviewSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseReview', CourseReviewSchema);

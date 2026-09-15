const mongoose = require('mongoose');

const CourseVideoSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a video title'],
      trim: true,
      maxlength: [150, 'Video title cannot be more than 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Video description cannot be more than 5000 characters'],
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Video order cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

CourseVideoSchema.index({ course: 1, order: 1, createdAt: 1 });

module.exports = mongoose.model('CourseVideo', CourseVideoSchema);

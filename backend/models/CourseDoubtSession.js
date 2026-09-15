const mongoose = require('mongoose');

const CourseDoubtSessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide a message describing your doubt'],
      trim: true,
      maxlength: [500, 'Message cannot be more than 500 characters'],
    },
    date: {
      type: Date,
      default: null,
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'cancelled', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

CourseDoubtSessionSchema.index({ course: 1, student: 1, status: 1 });
CourseDoubtSessionSchema.index({ student: 1, status: 1 });
CourseDoubtSessionSchema.index({ teacher: 1, status: 1 });

module.exports = mongoose.model('CourseDoubtSession', CourseDoubtSessionSchema);

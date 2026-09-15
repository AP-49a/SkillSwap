const Course = require('../models/Course');
const CourseReview = require('../models/CourseReview');
const Purchase = require('../models/Purchase');

const publicStudentFields = 'username profile.avatar';

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Recalculates averageRating and reviewsCount on the Course document
 * by aggregating all existing CourseReview records for that course.
 * This is always accurate regardless of how reviews were written.
 */
const syncCourseAggregates = async (courseId) => {
  const [agg] = await CourseReview.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const averageRating = agg ? Math.round(agg.avgRating * 10) / 10 : 0;
  const reviewsCount = agg ? agg.count : 0;

  await Course.findByIdAndUpdate(courseId, { averageRating, reviewsCount });
};

const toReviewResponse = (review) => ({
  id: review._id,
  rating: review.rating,
  comment: review.comment,
  student: review.student
    ? {
        username: review.student.username,
        avatar: review.student.profile?.avatar || null,
      }
    : null,
  createdAt: review.createdAt,
});

// @desc    Create a course review (completed purchasers only)
// @route   POST /api/courses/:id/reviews
// @access  Private
exports.createCourseReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    // --- Validate inputs early so we don't hit DB unnecessarily ---
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    if (!trimmedComment) {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }
    if (trimmedComment.length > 2000) {
      return res.status(400).json({ success: false, message: 'Comment cannot be more than 2000 characters' });
    }

    // --- Load course (must be published) ---
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
    }).select('_id teacher');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Published course not found' });
    }

    const studentId = req.user.id;
    const teacherId = course.teacher.toString();

    // --- Teachers cannot review their own course ---
    if (teacherId === studentId) {
      return res.status(400).json({ success: false, message: 'Course teachers cannot review their own course' });
    }

    // --- Must have a completed purchase with completedAt set ---
    const purchase = await Purchase.findOne({
      student: studentId,
      course: course._id,
      status: 'completed',
    }).select('completedAt');

    if (!purchase) {
      return res.status(403).json({ success: false, message: 'You must have purchased this course to review it' });
    }

    if (!purchase.completedAt) {
      return res.status(403).json({ success: false, message: 'You must complete the course before reviewing it' });
    }

    // --- Application-level duplicate check (DB index is the final guard) ---
    const existing = await CourseReview.exists({ student: studentId, course: course._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this course' });
    }

    // --- Create review — teacher derived from course, not request body ---
    const review = await CourseReview.create({
      student: studentId,
      course: course._id,
      teacher: course.teacher,
      rating: parsedRating,
      comment: trimmedComment,
    });

    // --- Recalculate course aggregates ---
    await syncCourseAggregates(course._id);

    const populated = await CourseReview.findById(review._id)
      .populate('student', publicStudentFields);

    return res.status(201).json({
      success: true,
      data: toReviewResponse(populated),
    });
  } catch (error) {
    // DB-level duplicate guard
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this course' });
    }
    next(error);
  }
};

// @desc    Get reviews for a published course
// @route   GET /api/courses/:id/reviews
// @access  Public
exports.getCourseReviews = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
    }).select('_id');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Published course not found' });
    }

    const reviews = await CourseReview.find({ course: course._id })
      .populate('student', publicStudentFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews.map(toReviewResponse),
    });
  } catch (error) {
    next(error);
  }
};

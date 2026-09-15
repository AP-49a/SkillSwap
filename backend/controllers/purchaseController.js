const mongoose = require('mongoose');
const Course = require('../models/Course');
const Purchase = require('../models/Purchase');
const Wallet = require('../models/Wallet');

const publicTeacherFields = 'username profile.avatar profile.about profile.location';

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isTransactionUnsupported = (error) => (
  error?.code === 20 ||
  error?.codeName === 'IllegalOperation' ||
  error?.message?.includes('Transaction numbers are only allowed')
);

const hasCoursePurchase = async (studentId, courseId, session) => {
  const query = Purchase.exists({ student: studentId, course: courseId });
  if (session) query.session(session);
  return query;
};

// @desc    Purchase a published course
// @route   POST /api/courses/:id/purchase
// @access  Private
exports.purchaseCourse = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let purchase;

    await session.withTransaction(async () => {
      const course = await Course.findOne({
        _id: req.params.id,
        status: 'published',
      }).session(session);

      if (!course) {
        throw httpError(404, 'Published course not found');
      }

      const studentId = req.user.id;
      const teacherId = course.teacher.toString();

      if (teacherId === studentId) {
        throw httpError(400, 'You cannot purchase your own course');
      }

      if (await hasCoursePurchase(studentId, course._id, session)) {
        throw httpError(409, 'You already own this course');
      }

      const studentWallet = await Wallet.findOneAndUpdate(
        {
          user: studentId,
          balance: { $gte: course.credits },
        },
        {
          $inc: { balance: -course.credits },
          $push: {
            transactions: {
              amount: course.credits,
              type: 'debit',
              description: `Purchased course: "${course.title}"`,
            },
          },
        },
        { new: true, session, runValidators: true }
      );

      if (!studentWallet) {
        throw httpError(400, 'Insufficient credits to purchase this course');
      }

      const teacherWallet = await Wallet.findOneAndUpdate(
        { user: course.teacher },
        {
          $inc: { balance: course.credits },
          $push: {
            transactions: {
              amount: course.credits,
              type: 'credit',
              description: `Earned from course: "${course.title}"`,
            },
          },
        },
        { new: true, session, runValidators: true }
      );

      if (!teacherWallet) {
        throw httpError(500, 'Teacher wallet not found');
      }

      const purchases = await Purchase.create(
        [{
          student: studentId,
          course: course._id,
          teacher: course.teacher,
          credits: course.credits,
          status: 'completed',
        }],
        { session }
      );

      purchase = purchases[0];
    });

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate({
        path: 'course',
        select: 'title description category credits thumbnail status teacher',
        populate: { path: 'teacher', select: publicTeacherFields },
      });

    res.status(201).json({
      success: true,
      data: populatedPurchase,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already own this course' });
    }

    if (isTransactionUnsupported(error)) {
      return res.status(503).json({
        success: false,
        message: 'Course purchases require MongoDB transaction support',
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

// @desc    Get courses purchased by the authenticated student
// @route   GET /api/courses/purchased
// @access  Private
exports.getPurchasedCourses = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ student: req.user.id })
      .populate({
        path: 'course',
        select: 'title description category credits thumbnail status teacher',
        populate: { path: 'teacher', select: publicTeacherFields },
      })
      .sort({ purchasedAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check whether the authenticated student owns a course
// @route   GET /api/courses/:id/purchase
// @access  Private
exports.getCoursePurchase = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).select('_id');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const purchased = Boolean(await hasCoursePurchase(req.user.id, course._id));

    res.status(200).json({
      success: true,
      data: { purchased },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a purchased course as completed
// @route   POST /api/courses/:id/complete
// @access  Private
exports.completeCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
    }).select('_id teacher');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Published course not found' });
    }

    if (course.teacher.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Course teachers cannot complete their own course' });
    }

    const purchase = await Purchase.findOne({
      student: req.user.id,
      course: course._id,
      status: 'completed',
    });

    if (!purchase) {
      return res.status(403).json({ success: false, message: 'Completed course purchase required' });
    }

    if (!purchase.completedAt) {
      purchase.completedAt = new Date();
      await purchase.save();
    }

    res.status(200).json({
      success: true,
      data: {
        completed: true,
        completedAt: purchase.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated student's course completion status
// @route   GET /api/courses/:id/completion
// @access  Private
exports.getCourseCompletion = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
    }).select('_id teacher');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Published course not found' });
    }

    if (course.teacher.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Course teachers do not have student completion status' });
    }

    const purchase = await Purchase.findOne({
      student: req.user.id,
      course: course._id,
      status: 'completed',
    }).select('completedAt');

    if (!purchase) {
      return res.status(403).json({ success: false, message: 'Completed course purchase required' });
    }

    res.status(200).json({
      success: true,
      data: {
        completed: Boolean(purchase.completedAt),
        completedAt: purchase.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.hasCoursePurchase = hasCoursePurchase;

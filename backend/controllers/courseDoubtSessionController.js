const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseDoubtSession = require('../models/CourseDoubtSession');
const Purchase = require('../models/Purchase');
const { isValidGoogleMeetLink } = require('../utils/meetingLink');

const publicUserFields = 'username profile.avatar';

const isValidId = (value) => mongoose.isValidObjectId(value);

const toDoubtSessionResponse = (session) => ({
  id: session._id,
  course: session.course?._id || session.course,
  student:
    session.student && typeof session.student === 'object' && session.student.username
      ? {
          id: session.student._id,
          username: session.student.username,
          avatar: session.student.profile?.avatar || null,
        }
      : session.student,
  teacher:
    session.teacher && typeof session.teacher === 'object' && session.teacher.username
      ? {
          id: session.teacher._id,
          username: session.teacher.username,
          avatar: session.teacher.profile?.avatar || null,
        }
      : session.teacher,
  message: session.message,
  date: session.date,
  meetingLink: session.meetingLink || '',
  status: session.status,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

// @desc    Create a course doubt session request (purchased students only)
// @route   POST /api/courses/:id/doubt-sessions
// @access  Private
exports.createCourseDoubtSession = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
    }).select('_id teacher');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Published course not found' });
    }

    const studentId = req.user.id;
    const teacherId = course.teacher.toString();

    if (teacherId === studentId) {
      return res.status(400).json({
        success: false,
        message: 'Course teachers cannot request doubt sessions for their own course',
      });
    }

    // Must have a completed purchase
    const purchase = await Purchase.findOne({
      student: studentId,
      course: course._id,
      status: 'completed',
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'You must have purchased this course to request a doubt session',
      });
    }

    // Reject if a pending doubt session already exists for this student + course
    const existingPending = await CourseDoubtSession.exists({
      student: studentId,
      course: course._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending doubt session for this course',
      });
    }

    const { message, date } = req.body;
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message describing your doubt',
      });
    }

    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be more than 500 characters',
      });
    }

    let parsedDate = null;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const doubtSession = await CourseDoubtSession.create({
      course: course._id,
      student: studentId,
      teacher: course.teacher,
      message: trimmedMessage,
      date: parsedDate,
      status: 'pending',
      meetingLink: '',
    });

    const populated = await CourseDoubtSession.findById(doubtSession._id)
      .populate('student', publicUserFields)
      .populate('teacher', publicUserFields);

    return res.status(201).json({
      success: true,
      data: toDoubtSessionResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List doubt sessions for a course (teacher sees all, student sees their own)
// @route   GET /api/courses/:id/doubt-sessions
// @access  Private
exports.getCourseDoubtSessions = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = await Course.findById(req.params.id).select('_id teacher');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const userId = req.user.id;
    const isTeacher = course.teacher.toString() === userId;

    if (!isTeacher) {
      const hasPurchased = await Purchase.exists({
        student: userId,
        course: course._id,
        status: 'completed',
      });

      if (!hasPurchased) {
        return res.status(403).json({
          success: false,
          message: 'Purchase required to view doubt sessions for this course',
        });
      }
    }

    const query = { course: course._id };
    if (!isTeacher) {
      query.student = userId;
    }

    const sessions = await CourseDoubtSession.find(query)
      .populate('student', publicUserFields)
      .populate('teacher', publicUserFields)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions.map(toDoubtSessionResponse),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific doubt session
// @route   GET /api/courses/:courseId/doubt-sessions/:sessionId
// @access  Private (student or teacher only)
exports.getCourseDoubtSessionById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.courseId) || !isValidId(req.params.sessionId)) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const session = await CourseDoubtSession.findOne({
      _id: req.params.sessionId,
      course: req.params.courseId,
    })
      .populate('student', publicUserFields)
      .populate('teacher', publicUserFields);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const userId = req.user.id;
    const isStudent = session.student._id.toString() === userId;
    const isTeacher = session.teacher._id.toString() === userId;

    if (!isStudent && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this doubt session',
      });
    }

    return res.status(200).json({
      success: true,
      data: toDoubtSessionResponse(session),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept doubt session request and set Google Meet link (teacher only)
// @route   PUT /api/courses/:courseId/doubt-sessions/:sessionId/accept
// @access  Private (course teacher only)
exports.acceptCourseDoubtSession = async (req, res, next) => {
  try {
    if (!isValidId(req.params.courseId) || !isValidId(req.params.sessionId)) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const session = await CourseDoubtSession.findOne({
      _id: req.params.sessionId,
      course: req.params.courseId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    if (session.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the course teacher can accept this doubt session',
      });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a doubt session with status '${session.status}'`,
      });
    }

    const { meetingLink } = req.body;
    const cleanedLink = typeof meetingLink === 'string' ? meetingLink.trim() : '';

    if (!cleanedLink || !isValidGoogleMeetLink(cleanedLink)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Google Meet link is required to accept this session',
      });
    }

    session.status = 'accepted';
    session.meetingLink = cleanedLink;
    await session.save();

    const populated = await CourseDoubtSession.findById(session._id)
      .populate('student', publicUserFields)
      .populate('teacher', publicUserFields);

    return res.status(200).json({
      success: true,
      message: 'Doubt session accepted successfully',
      data: toDoubtSessionResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get join link for accepted doubt session
// @route   GET /api/courses/:courseId/doubt-sessions/:sessionId/join
// @access  Private (student or teacher only)
exports.getCourseDoubtSessionJoinLink = async (req, res, next) => {
  try {
    if (!isValidId(req.params.courseId) || !isValidId(req.params.sessionId)) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const session = await CourseDoubtSession.findOne({
      _id: req.params.sessionId,
      course: req.params.courseId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const userId = req.user.id;
    const isStudent = session.student.toString() === userId;
    const isTeacher = session.teacher.toString() === userId;

    if (!isStudent && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this meeting link',
      });
    }

    if (session.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Meeting link is only available for accepted sessions',
      });
    }

    if (!session.meetingLink || !isValidGoogleMeetLink(session.meetingLink)) {
      return res.status(400).json({
        success: false,
        message: 'No valid meeting link found for this session',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        joinLink: session.meetingLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark accepted doubt session as completed
// @route   PUT /api/courses/:courseId/doubt-sessions/:sessionId/complete
// @access  Private (student or teacher)
exports.completeCourseDoubtSession = async (req, res, next) => {
  try {
    if (!isValidId(req.params.courseId) || !isValidId(req.params.sessionId)) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const session = await CourseDoubtSession.findOne({
      _id: req.params.sessionId,
      course: req.params.courseId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const userId = req.user.id;
    const isStudent = session.student.toString() === userId;
    const isTeacher = session.teacher.toString() === userId;

    if (!isStudent && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this doubt session',
      });
    }

    if (session.status === 'completed') {
      const populated = await CourseDoubtSession.findById(session._id)
        .populate('student', publicUserFields)
        .populate('teacher', publicUserFields);

      return res.status(200).json({
        success: true,
        message: 'Doubt session is already completed',
        data: toDoubtSessionResponse(populated),
      });
    }

    if (session.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Only accepted doubt sessions can be completed (current status: '${session.status}')`,
      });
    }

    session.status = 'completed';
    await session.save();

    const populated = await CourseDoubtSession.findById(session._id)
      .populate('student', publicUserFields)
      .populate('teacher', publicUserFields);

    return res.status(200).json({
      success: true,
      message: 'Doubt session marked as completed',
      data: toDoubtSessionResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending or accepted doubt session
// @route   PUT /api/courses/:courseId/doubt-sessions/:sessionId/cancel
// @access  Private (student or teacher)
exports.cancelCourseDoubtSession = async (req, res, next) => {
  try {
    if (!isValidId(req.params.courseId) || !isValidId(req.params.sessionId)) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const session = await CourseDoubtSession.findOne({
      _id: req.params.sessionId,
      course: req.params.courseId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found' });
    }

    const userId = req.user.id;
    const isStudent = session.student.toString() === userId;
    const isTeacher = session.teacher.toString() === userId;

    if (!isStudent && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this doubt session',
      });
    }

    if (session.status === 'cancelled') {
      const populated = await CourseDoubtSession.findById(session._id)
        .populate('student', publicUserFields)
        .populate('teacher', publicUserFields);

      return res.status(200).json({
        success: true,
        message: 'Doubt session is already cancelled',
        data: toDoubtSessionResponse(populated),
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an already completed doubt session',
      });
    }

    if (session.status !== 'pending' && session.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel doubt session with status '${session.status}'`,
      });
    }

    session.status = 'cancelled';
    await session.save();

    const populated = await CourseDoubtSession.findById(session._id)
      .populate('student', publicUserFields)
      .populate('teacher', publicUserFields);

    return res.status(200).json({
      success: true,
      message: 'Doubt session cancelled successfully',
      data: toDoubtSessionResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

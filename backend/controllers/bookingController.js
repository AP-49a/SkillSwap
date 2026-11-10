const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { isValidGoogleMeetLink } = require('../utils/meetingLink');

const isTransactionUnsupported = (error) => (
  error?.code === 20 ||
  error?.codeName === 'IllegalOperation' ||
  error?.message?.includes('Transaction numbers are only allowed')
);

const transactionRequiredError = () => {
  const error = new Error('Booking credit transfers require MongoDB transaction support.');
  error.statusCode = 503;
  return error;
};

// @desc    Book a new session
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  let session;
  try {
    const { skillId, date, timeSlot, notes } = req.body;
    const learnerId = req.user.id;

    // Find the skill
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill listing not found' });
    }

    const instructorId = skill.creator.toString();

    // Prevent booking own skill
    if (instructorId === learnerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own skill listing',
      });
    }

    session = await mongoose.startSession();
    let booking;
    await session.withTransaction(async () => {
      const learnerWallet = await Wallet.findOneAndUpdate(
        { user: learnerId, balance: { $gte: skill.credits } },
        {
          $inc: { balance: -skill.credits },
          $push: { transactions: { amount: skill.credits, type: 'debit', description: `Booked session: "${skill.title}"` } },
        },
        { new: true, session, runValidators: true }
      );
      if (!learnerWallet) {
        const error = new Error('Insufficient credits to book this session.');
        error.statusCode = 400;
        throw error;
      }

      [booking] = await Booking.create([{
        skill: skillId,
        instructor: instructorId,
        learner: learnerId,
        date,
        timeSlot,
        notes,
        credits: skill.credits,
        status: 'upcoming',
      }], { session });

      await Notification.create([
        {
          user: instructorId,
          message: `${req.user.username} has booked a session for your skill "${skill.title}" on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
          type: 'booking_update',
        },
        {
          user: learnerId,
          message: `You successfully booked "${skill.title}" with Instructor. ${skill.credits} credits have been locked.`,
          type: 'booking_update',
        },
      ], { session });
    });

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      data: booking,
    });
  } catch (error) {
    if (isTransactionUnsupported(error)) return next(transactionRequiredError());
    next(error);
  } finally {
    if (session) await session.endSession();
  }
};

// @desc    Get user bookings (both upcoming and past)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // 'upcoming', 'completed', 'cancelled'

    const query = {
      $or: [{ instructor: userId }, { learner: userId }],
    };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('skill', 'title category duration credits')
      .populate('instructor', 'username profile.avatar')
      .populate('learner', 'username profile.avatar')
      .sort({ date: 1, timeSlot: 1 });

    // For each booking, check if it has already been reviewed by the current user
    const bookingIds = bookings.map(b => b._id);
    const reviews = await Review.find({
      booking: { $in: bookingIds },
      reviewer: userId
    });

    const reviewsMap = {};
    reviews.forEach(r => {
      reviewsMap[r.booking.toString()] = true;
    });

    const data = bookings.map(b => {
      const bObj = b.toObject();
      bObj.hasReviewed = !!reviewsMap[b._id.toString()];
      return bObj;
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (Complete or Cancel)
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
  let session;
  try {
    const { status } = req.body; // 'completed' or 'cancelled'
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const currentBooking = await Booking.findById(req.params.id).select('learner instructor status');
    if (!currentBooking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const userId = req.user.id.toString();
    const isLearner = currentBooking.learner.toString() === userId;
    const isInstructor = currentBooking.instructor.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    if (!isLearner && !isInstructor && !(status === 'cancelled' && isAdmin)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this booking' });
    }

    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      const booking = await Booking.findOne({ _id: req.params.id, status: 'upcoming' })
        .populate('skill', 'title')
        .session(session);
      if (!booking) {
        const current = await Booking.findById(req.params.id).select('status').session(session);
        const error = new Error(current ? `Booking has already been ${current.status}` : 'Booking not found');
        error.statusCode = current ? 409 : 404;
        throw error;
      }
      const title = booking.skill?.title || 'skill session';

      if (status === 'completed') {
        const confirmationField = isLearner ? 'learnerCompletedAt' : 'instructorCompletedAt';
        if (!booking[confirmationField]) booking[confirmationField] = new Date();
        const bothConfirmed = Boolean(booking.learnerCompletedAt && booking.instructorCompletedAt);

        if (bothConfirmed) {
          booking.status = 'completed';
          await booking.save({ session });

          const instructorWallet = await Wallet.findOneAndUpdate(
            { user: booking.instructor },
            {
              $inc: { balance: booking.credits },
              $push: { transactions: { amount: booking.credits, type: 'credit', description: `Earned from teaching: "${title}"` } },
            },
            { new: true, session, runValidators: true }
          );
          if (!instructorWallet) throw new Error('Instructor wallet not found');

          await Notification.create([
            { user: booking.instructor, message: `Both participants confirmed completion. You earned ${booking.credits} credits for "${title}".`, type: 'credit_earned' },
            { user: booking.learner, message: `Both participants confirmed "${title}" as complete. You can now leave a review.`, type: 'booking_update' },
          ], { session });
          result = { booking, completed: true };
        } else {
          await booking.save({ session });
          result = { booking, completed: false };
        }
      } else {
        booking.status = 'cancelled';
        await booking.save({ session });
        const learnerWallet = await Wallet.findOneAndUpdate(
          { user: booking.learner },
          {
            $inc: { balance: booking.credits },
            $push: { transactions: { amount: booking.credits, type: 'credit', description: `Refund: Cancelled session "${title}"` } },
          },
          { new: true, session, runValidators: true }
        );
        if (!learnerWallet) throw new Error('Learner wallet not found');
        await Notification.create([
          { user: booking.learner, message: `The session for "${title}" was cancelled. ${booking.credits} credits have been refunded.`, type: 'booking_update' },
          { user: booking.instructor, message: `The session for "${title}" was cancelled.`, type: 'booking_update' },
        ], { session });
        result = { booking, completed: false, cancelled: true };
      }
    });

    const message = result.cancelled
      ? 'Booking cancelled and credits refunded.'
      : result.completed
        ? 'Both participants confirmed. Credits have been transferred.'
        : 'Your confirmation was recorded. The exchange completes after the other participant confirms.';
    res.status(200).json({ success: true, message, data: result.booking });
  } catch (error) {
    if (isTransactionUnsupported(error)) return next(transactionRequiredError());
    next(error);
  } finally {
    if (session) await session.endSession();
  }
};

// @desc    Reschedule a session booking
// @route   PUT /api/bookings/:id/reschedule
// @access  Private
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { date, timeSlot, meetingLink } = req.body;
    const booking = await Booking.findById(req.params.id).populate('skill', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // User must be instructor or learner
    const isLearner = booking.learner.toString() === req.user.id;
    const isInstructor = booking.instructor.toString() === req.user.id;

    if (!isLearner && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reschedule this session',
      });
    }

    if (booking.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Can only reschedule upcoming sessions',
      });
    }

    const oldDate = new Date(booking.date).toLocaleDateString();
    const oldTimeSlot = booking.timeSlot;

    if (date) booking.date = date;
    if (timeSlot) booking.timeSlot = timeSlot;
    if (meetingLink !== undefined) {
      const cleanedMeetingLink = typeof meetingLink === 'string' ? meetingLink.trim() : '';
      if (cleanedMeetingLink && !isValidGoogleMeetLink(cleanedMeetingLink)) {
        return res.status(400).json({
          success: false,
          message: 'Meeting link must be a valid Google Meet URL.',
        });
      }
      booking.meetingLink = cleanedMeetingLink;
    }
    booking.rescheduled = true;
    await booking.save();

    // Notify other party
    const targetUserId = isLearner ? booking.instructor : booking.learner;
    const senderName = req.user.username;

    await Notification.create({
      user: targetUserId,
      message: `${senderName} has rescheduled the session for "${booking.skill.title}" from ${oldDate} at ${oldTimeSlot} to ${new Date(booking.date).toLocaleDateString()} at ${booking.timeSlot}.`,
      type: 'booking_update',
    });

    // Notify sender as confirmation
    await Notification.create({
      user: req.user.id,
      message: `You rescheduled the session for "${booking.skill.title}" to ${new Date(booking.date).toLocaleDateString()} at ${booking.timeSlot}.`,
      type: 'booking_update',
    });

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingJoinLink = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('skill', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isLearner = booking.learner.toString() === req.user.id;
    const isInstructor = booking.instructor.toString() === req.user.id;

    if (!isLearner && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this meeting link',
      });
    }

    if (booking.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'This session is not available to join yet.',
      });
    }

    if (!booking.meetingLink || !isValidGoogleMeetLink(booking.meetingLink)) {
      return res.status(400).json({
        success: false,
        message: 'The instructor has not added a valid Google Meet link for this session yet.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        joinLink: booking.meetingLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

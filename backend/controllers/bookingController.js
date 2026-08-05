const Booking = require('../models/Booking');
const Skill = require('../models/Skill');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const Review = require('../models/Review');

// @desc    Book a new session
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
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

    // Get learner wallet
    const learnerWallet = await Wallet.findOne({ user: learnerId });
    if (!learnerWallet || learnerWallet.balance < skill.credits) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You need ${skill.credits} credits to book this session, but only have ${learnerWallet ? learnerWallet.balance : 0}.`,
      });
    }

    // Deduct credits from learner immediately
    learnerWallet.balance -= skill.credits;
    learnerWallet.transactions.push({
      amount: skill.credits,
      type: 'debit',
      description: `Booked session: "${skill.title}"`,
    });
    await learnerWallet.save();

    // Create the booking
    const booking = await Booking.create({
      skill: skillId,
      instructor: instructorId,
      learner: learnerId,
      date,
      timeSlot,
      notes,
      credits: skill.credits,
      status: 'upcoming',
    });

    // Send notification to Instructor
    await Notification.create({
      user: instructorId,
      message: `${req.user.username} has booked a session for your skill "${skill.title}" on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      type: 'booking_update',
    });

    // Send notification to Learner
    await Notification.create({
      user: learnerId,
      message: `You successfully booked "${skill.title}" with Instructor. ${skill.credits} credits have been locked.`,
      type: 'booking_update',
    });

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
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
  try {
    const { status } = req.body; // 'completed' or 'cancelled'
    const booking = await Booking.findById(req.params.id).populate('skill', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization check: User must be learner or instructor
    const isLearner = booking.learner.toString() === req.user.id;
    const isInstructor = booking.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isLearner && !isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this booking',
      });
    }

    // Prevent modifying already final states
    if (booking.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: `Booking has already been ${booking.status}`,
      });
    }

    if (status === 'completed') {
      // Mark as completed
      booking.status = 'completed';
      await booking.save();

      // Release credits to Instructor wallet
      const instructorWallet = await Wallet.findOne({ user: booking.instructor });
      if (instructorWallet) {
        instructorWallet.balance += booking.credits;
        instructorWallet.transactions.push({
          amount: booking.credits,
          type: 'credit',
          description: `Earned from teaching: "${booking.skill.title}"`,
        });
        await instructorWallet.save();
      }

      // Notify instructor of credit earnings
      await Notification.create({
        user: booking.instructor,
        message: `Congratulations! You earned ${booking.credits} credits for completing the session "${booking.skill.title}".`,
        type: 'credit_earned',
      });

      // Notify learner of completion
      await Notification.create({
        user: booking.learner,
        message: `Your session for "${booking.skill.title}" has been completed. Don't forget to leave a review!`,
        type: 'booking_update',
      });

    } else if (status === 'cancelled') {
      // Mark as cancelled
      booking.status = 'cancelled';
      await booking.save();

      // Refund credits back to learner wallet
      const learnerWallet = await Wallet.findOne({ user: booking.learner });
      if (learnerWallet) {
        learnerWallet.balance += booking.credits;
        learnerWallet.transactions.push({
          amount: booking.credits,
          type: 'credit',
          description: `Refund: Cancelled session "${booking.skill.title}"`,
        });
        await learnerWallet.save();
      }

      // Notify learner of refund
      await Notification.create({
        user: booking.learner,
        message: `Your session for "${booking.skill.title}" was cancelled. ${booking.credits} credits have been refunded.`,
        type: 'booking_update',
      });

      // Notify instructor of cancellation
      await Notification.create({
        user: booking.instructor,
        message: `The session for "${booking.skill.title}" scheduled for ${new Date(booking.date).toLocaleDateString()} has been cancelled.`,
        type: 'booking_update',
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    res.status(200).json({
      success: true,
      message: `Booking successfully marked as ${status}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule a session booking
// @route   PUT /api/bookings/:id/reschedule
// @access  Private
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.body;
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

    booking.date = date;
    booking.timeSlot = timeSlot;
    booking.rescheduled = true;
    await booking.save();

    // Notify other party
    const targetUserId = isLearner ? booking.instructor : booking.learner;
    const senderName = req.user.username;

    await Notification.create({
      user: targetUserId,
      message: `${senderName} has rescheduled the session for "${booking.skill.title}" from ${oldDate} at ${oldTimeSlot} to ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      type: 'booking_update',
    });

    // Notify sender as confirmation
    await Notification.create({
      user: req.user.id,
      message: `You rescheduled the session for "${booking.skill.title}" to ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
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

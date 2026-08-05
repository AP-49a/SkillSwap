const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Create review for a completed session
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is the learner
    if (booking.learner.toString() !== reviewerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the learner can review this session',
      });
    }

    // Check if session is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed sessions',
      });
    }

    // Check if review already exists
    const reviewExists = await Review.findOne({ booking: bookingId });
    if (reviewExists) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this session',
      });
    }

    // Create the review
    const review = await Review.create({
      skill: booking.skill,
      booking: bookingId,
      reviewer: reviewerId,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

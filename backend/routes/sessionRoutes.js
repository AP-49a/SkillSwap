const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');

// All session routes are protected
router.use(protect);

// GET /api/sessions — alias for bookings (maps to existing booking system)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({
      $or: [{ instructor: userId }, { learner: userId }],
    })
      .populate('skill', 'title category duration credits')
      .populate('instructor', 'username profile.avatar')
      .populate('learner', 'username profile.avatar')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/sessions/my — alias for user's bookings
router.get('/my', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const query = { $or: [{ instructor: userId }, { learner: userId }] };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('skill', 'title category duration credits')
      .populate('instructor', 'username profile.avatar')
      .populate('learner', 'username profile.avatar')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

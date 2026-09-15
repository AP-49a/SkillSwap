const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, rescheduleBooking, getBookingJoinLink } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { bookingValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .post(bookingValidation, createBooking)
  .get(getBookings);

router.put('/:id/status', updateBookingStatus);
router.put('/:id/reschedule', rescheduleBooking);
router.get('/:id/join', getBookingJoinLink);

module.exports = router;

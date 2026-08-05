const express = require('express');
const router = express.Router();
const { getStats, getUsers, getSkills, getBookings } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection and admin authorization to all routes below
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/skills', getSkills);
router.get('/bookings', getBookings);

module.exports = router;

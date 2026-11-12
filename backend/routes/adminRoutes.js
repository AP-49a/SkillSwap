const express = require('express');
const router = express.Router();
const {
  getStats, getDashboard, getUsers, getSkills, getBookings, deleteUser,
  updateUserStatus, getCourses, updateCourseStatus, getTransactions,
  adjustCredits, getActivityLogs, getReviews, deleteReview, getAnalytics, getReports, updateReport,
  getSettings, updateSettings,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { adminMutationLimiter } = require('../middleware/rateLimiter');

// Apply protection and admin authorization to all routes below
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.delete('/users/:id', adminMutationLimiter, deleteUser);
router.patch('/users/:id/status', adminMutationLimiter, updateUserStatus);
router.get('/courses', getCourses);
router.patch('/courses/:id/status', adminMutationLimiter, updateCourseStatus);
router.get('/transactions', getTransactions);
router.post('/credits/adjust', adminMutationLimiter, adjustCredits);
router.get('/reviews', getReviews);
router.delete('/reviews/:id', adminMutationLimiter, deleteReview);
router.get('/activity-logs', getActivityLogs);
router.get('/reports', getReports);
router.patch('/reports/:id', adminMutationLimiter, updateReport);
router.get('/settings', getSettings);
router.patch('/settings', adminMutationLimiter, updateSettings);
router.get('/skills', getSkills);
router.get('/bookings', getBookings);

module.exports = router;

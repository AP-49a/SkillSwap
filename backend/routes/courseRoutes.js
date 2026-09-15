const express = require('express');
const router = express.Router();
const {
  createCourse,
  getPublishedCourses,
  getCourseById,
  getMyCourses,
  updateCourse,
  deleteCourse,
  publishCourse,
} = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const { courseValidation, courseUpdateValidation } = require('../middleware/validation');
const {
  purchaseCourse,
  getPurchasedCourses,
  getCoursePurchase,
  completeCourse,
  getCourseCompletion,
} = require('../controllers/purchaseController');
const {
  createCourseVideo,
  getCourseVideos,
  getCourseVideo,
  streamCourseVideo,
  updateCourseVideo,
  deleteCourseVideo,
} = require('../controllers/courseVideoController');
const { uploadCourseVideo } = require('../middleware/videoUpload');
const {
  createCourseReview,
  getCourseReviews,
} = require('../controllers/courseReviewController');
const {
  createCourseDoubtSession,
  getCourseDoubtSessions,
  getCourseDoubtSessionById,
  acceptCourseDoubtSession,
  getCourseDoubtSessionJoinLink,
  completeCourseDoubtSession,
  cancelCourseDoubtSession,
} = require('../controllers/courseDoubtSessionController');

router.get('/', getPublishedCourses);
router.get('/mine', protect, getMyCourses);
router.get('/purchased', protect, getPurchasedCourses);
router.post('/', protect, courseValidation, createCourse);
router.post('/:id/purchase', protect, purchaseCourse);
router.get('/:id/purchase', protect, getCoursePurchase);
router.post('/:id/complete', protect, completeCourse);
router.get('/:id/completion', protect, getCourseCompletion);
router.post('/:id/videos', protect, uploadCourseVideo, createCourseVideo);
router.get('/:id/videos', protect, getCourseVideos);
router.get('/:courseId/videos/:videoId/stream', protect, streamCourseVideo);
router.get('/:courseId/videos/:videoId', protect, getCourseVideo);
router.put('/:courseId/videos/:videoId', protect, updateCourseVideo);
router.delete('/:courseId/videos/:videoId', protect, deleteCourseVideo);
router.post('/:id/reviews', protect, createCourseReview);
router.get('/:id/reviews', getCourseReviews);
router.post('/:id/doubt-sessions', protect, createCourseDoubtSession);
router.get('/:id/doubt-sessions', protect, getCourseDoubtSessions);
router.get('/:courseId/doubt-sessions/:sessionId/join', protect, getCourseDoubtSessionJoinLink);
router.put('/:courseId/doubt-sessions/:sessionId/accept', protect, acceptCourseDoubtSession);
router.put('/:courseId/doubt-sessions/:sessionId/complete', protect, completeCourseDoubtSession);
router.put('/:courseId/doubt-sessions/:sessionId/cancel', protect, cancelCourseDoubtSession);
router.get('/:courseId/doubt-sessions/:sessionId', protect, getCourseDoubtSessionById);
router.get('/:id', getCourseById);
router.put('/:id', protect, courseUpdateValidation, updateCourse);
router.delete('/:id', protect, deleteCourse);
router.post('/:id/publish', protect, publishCourse);

module.exports = router;
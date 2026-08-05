const express = require('express');
const router = express.Router();
const { createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validation');

router.post('/', protect, reviewValidation, createReview);

module.exports = router;

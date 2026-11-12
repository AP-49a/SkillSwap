const express = require('express');
const { createReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(protect);
router.post('/', reportLimiter, createReport);

module.exports = router;

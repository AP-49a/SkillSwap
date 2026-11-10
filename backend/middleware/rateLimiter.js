const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 12,
  keyGenerator: (req) => req.user.id.toString(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Try again tomorrow.' },
});

const videoUploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user.id.toString(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Daily video upload limit reached. Try again tomorrow.' },
});

const limitOnlyUploads = (limiter) => (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  return limiter(req, res, next);
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Strict rate limiter for authentication routes (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  videoUploadLimiter,
  limitOnlyUploads,
};

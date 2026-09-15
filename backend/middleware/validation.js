const { body, validationResult } = require('express-validator');

// Helper middleware to handle validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

// Signup validation
const signupValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please include a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validateResults,
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please include a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateResults,
];

// Skill listing validation
const skillValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot be more than 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Technology',
      'Language',
      'Design',
      'Music',
      'Marketing',
      'Business',
      'Academics',
      'Other',
    ])
    .withMessage('Invalid skill category'),
  body('credits')
    .notEmpty()
    .withMessage('Credits count is required')
    .isInt({ min: 1 })
    .withMessage('Credits must be an integer of at least 1'),
  body('duration')
    .optional()
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),
  validateResults,
];

// Booking validation
const bookingValidation = [
  body('skillId').notEmpty().withMessage('Skill ID is required').isMongoId().withMessage('Invalid Skill ID'),
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be in valid format (YYYY-MM-DD)'),
  body('timeSlot').trim().notEmpty().withMessage('Time slot is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  validateResults,
];

// Review validation
const reviewValidation = [
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Invalid Booking ID'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  validateResults,
];

// Course validation
const courseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 150 })
    .withMessage('Course title cannot be more than 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ max: 5000 })
    .withMessage('Course description cannot be more than 5000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Course category is required')
    .isLength({ max: 100 })
    .withMessage('Course category cannot be more than 100 characters'),
  body('credits')
    .notEmpty()
    .withMessage('Course credits are required')
    .isFloat({ min: 1 })
    .withMessage('Course credits must be at least 1'),
  body('thumbnail')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Thumbnail must be a string'),
  validateResults,
];

const courseUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Course title cannot be more than 150 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course description cannot be empty')
    .isLength({ max: 5000 })
    .withMessage('Course description cannot be more than 5000 characters'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course category cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Course category cannot be more than 100 characters'),
  body('credits')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Course credits must be at least 1'),
  body('thumbnail')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Thumbnail must be a string'),
  validateResults,
];

module.exports = {
  signupValidation,
  loginValidation,
  skillValidation,
  bookingValidation,
  reviewValidation,
  courseValidation,
  courseUpdateValidation,
};

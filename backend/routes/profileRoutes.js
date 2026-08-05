const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/profile/:id — public profile by user ID
router.get('/:id', getProfile);

// PUT /api/profile — update own profile (protected)
router.put('/', protect, upload.single('avatar'), updateProfile);

module.exports = router;

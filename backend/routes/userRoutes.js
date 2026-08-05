const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getDashboard, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/dashboard', protect, getDashboard);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.delete('/account', protect, deleteAccount);
router.get('/:id/profile', getProfile);

module.exports = router;

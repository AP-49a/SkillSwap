const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe, updatePassword } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { generateToken } = require('../config/jwt');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already registered',
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Create associated Wallet with 10 credits starting balance
    await Wallet.create({
      user: user._id,
      balance: 10,
      transactions: [
        {
          amount: 10,
          type: 'credit',
          description: 'Welcome credit bonus!',
        },
      ],
    });

    // Generate token and set cookie
    generateToken(res, user._id, req);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token and set cookie
    generateToken(res, user._id, req);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: req.secure || (req.headers.origin && req.headers.origin.startsWith('https://')) || req.headers['x-forwarded-proto'] === 'https',
      sameSite: (req.secure || (req.headers.origin && req.headers.origin.startsWith('https://')) || req.headers['x-forwarded-proto'] === 'https') ? 'none' : 'lax',
      path: '/',
    };

    res.clearCookie('token', cookieOptions);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Re-generate token
    generateToken(res, user._id, req);

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

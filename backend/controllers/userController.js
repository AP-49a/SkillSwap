const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

// @desc    Get user profile by ID
// @route   GET /api/users/:id/profile
// @access  Public
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's skills
    const skills = await Skill.find({ creator: user._id });

    // Get user's wallet (only show balance if owner or admin)
    let balance = null;
    if (req.user && (req.user.id === user._id.toString() || req.user.role === 'admin')) {
      const wallet = await Wallet.findOne({ user: user._id });
      balance = wallet ? wallet.balance : 0;
    }

    // Get user's received reviews (skills where user is the creator/instructor)
    const reviews = await Review.find({ skill: { $in: skills.map(s => s._id) } })
      .populate('reviewer', 'username profile.avatar')
      .populate('skill', 'title');

    // Count completed sessions
    const completedSessions = await Booking.countDocuments({
      $or: [{ instructor: user._id }, { learner: user._id }],
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        skills,
        reviews,
        completedSessions,
        balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      about,
      location,
      college,
      experience,
      languages,
      skillsOffered,
      skillsWanted,
      portfolio,
      linkedin,
      github,
      availability,
    } = req.body;

    // Helper to format string inputs
    const parseStringArray = (input) => {
      if (!input) return [];
      if (Array.isArray(input)) return input;
      return input.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    };

    // Update profile fields
    if (about !== undefined) user.profile.about = about;
    if (location !== undefined) user.profile.location = location;
    if (college !== undefined) user.profile.college = college;
    if (experience !== undefined) user.profile.experience = experience;
    if (portfolio !== undefined) user.profile.portfolio = portfolio;
    if (linkedin !== undefined) user.profile.linkedin = linkedin;
    if (github !== undefined) user.profile.github = github;
    if (availability !== undefined) user.profile.availability = availability;

    if (languages !== undefined) user.profile.languages = parseStringArray(languages);
    if (skillsOffered !== undefined) user.profile.skillsOffered = parseStringArray(skillsOffered);
    if (skillsWanted !== undefined) user.profile.skillsWanted = parseStringArray(skillsWanted);

    // Avatar upload handling
    if (req.file) {
      user.profile.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & activities
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Get Wallet Credits Balance
    const wallet = await Wallet.findOne({ user: userId });
    const balance = wallet ? wallet.balance : 0;

    // 2. Fetch Upcoming Sessions
    const upcomingSessions = await Booking.find({
      $or: [{ instructor: userId }, { learner: userId }],
      status: 'upcoming',
    })
      .populate('skill', 'title category')
      .populate('instructor', 'username profile.avatar')
      .populate('learner', 'username profile.avatar')
      .sort({ date: 1 })
      .limit(5);

    // 3. Count Unread Notifications
    const unreadNotifications = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    // 4. Progress metrics (taught sessions vs learned sessions)
    const taughtCount = await Booking.countDocuments({ instructor: userId, status: 'completed' });
    const learnedCount = await Booking.countDocuments({ learner: userId, status: 'completed' });

    // 5. Recent bookings (activity feed)
    const recentActivity = await Booking.find({
      $or: [{ instructor: userId }, { learner: userId }],
    })
      .populate('skill', 'title')
      .populate('instructor', 'username')
      .populate('learner', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        credits: balance,
        upcomingSessions,
        unreadNotifications,
        progress: {
          taught: taughtCount,
          learned: learnedCount,
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Remove skills
    await Skill.deleteMany({ creator: userId });
    // Remove bookings
    await Booking.deleteMany({ $or: [{ instructor: userId }, { learner: userId }] });
    // Remove wallet
    await Wallet.deleteOne({ user: userId });
    // Remove reviews
    await Review.deleteMany({ reviewer: userId });
    // Remove notifications
    await Notification.deleteMany({ user: userId });
    // Remove User itself
    await User.findByIdAndDelete(userId);

    // Clear cookie
    res.cookie('token', 'none', {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000),
    });

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

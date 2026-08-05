const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');

// @desc    Get all admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSkills = await Skill.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const upcomingBookings = await Booking.countDocuments({ status: 'upcoming' });

    // Aggregate total credits circulating in system
    const walletAgg = await Wallet.aggregate([
      { $group: { _id: null, totalCredits: { $sum: '$balance' } } },
    ]);
    const totalCredits = walletAgg.length > 0 ? walletAgg[0].totalCredits : 0;

    // Get category distribution
    const categoryStats = await Skill.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        skills: totalSkills,
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          upcoming: upcomingBookings,
        },
        creditsCirculating: totalCredits,
        categoryDistribution: categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const wallets = await Wallet.find();
    const walletMap = {};
    wallets.forEach(w => {
      walletMap[w.user.toString()] = w.balance;
    });

    const populatedUsers = users.map(user => {
      const uObj = user.toObject();
      uObj.credits = walletMap[user._id.toString()] || 0;
      return uObj;
    });

    res.status(200).json({
      success: true,
      count: populatedUsers.length,
      data: populatedUsers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all skills list
// @route   GET /api/admin/skills
// @access  Private/Admin
exports.getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find()
      .populate('creator', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings list
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('skill', 'title')
      .populate('instructor', 'username email')
      .populate('learner', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

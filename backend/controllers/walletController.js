const Wallet = require('../models/Wallet');

// @desc    Get user wallet and transaction log
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    // Sort transactions by date descending
    wallet.transactions.sort((a, b) => b.date - a.date);

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

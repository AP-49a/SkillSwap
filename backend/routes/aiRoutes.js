const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Skill = require('../models/Skill');
const User = require('../models/User');

// All AI routes are protected
router.use(protect);

// POST /api/ai/recommend-skills — recommend skills based on user interests
router.post('/recommend-skills', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const wanted = user.profile.skillsWanted || [];

    // Simple recommendation: find skills matching user's wanted list
    const query = wanted.length > 0
      ? { title: { $in: wanted.map(s => new RegExp(s, 'i')) }, creator: { $ne: req.user.id } }
      : { creator: { $ne: req.user.id } };

    const skills = await Skill.find(query)
      .populate('creator', 'username profile.avatar')
      .sort({ averageRating: -1 })
      .limit(6);

    res.json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ai/profile-suggestions — suggest improvements for user profile
router.get('/profile-suggestions', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const suggestions = [];

    if (!user.profile.about) suggestions.push('Add an "About Me" section to increase bookings.');
    if (!user.profile.location) suggestions.push('Add your location to appear in local searches.');
    if (user.profile.skillsOffered.length === 0) suggestions.push('List at least one skill you can teach to start earning credits.');
    if (user.profile.skillsWanted.length === 0) suggestions.push('Add skills you want to learn to get better recommendations.');
    if (!user.profile.avatar || user.profile.avatar.includes('default')) suggestions.push('Upload a profile photo to build trust with learners.');

    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

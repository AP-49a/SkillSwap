const Skill = require('../models/Skill');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc    Create a new skill
// @route   POST /api/skills
// @access  Private
exports.createSkill = async (req, res, next) => {
  try {
    const { title, description, category, credits, duration } = req.body;

    const skill = await Skill.create({
      title,
      description,
      category,
      credits,
      duration,
      creator: req.user.id,
    });

    // Auto-append to user's profile.skillsOffered if not already present
    const user = await User.findById(req.user.id);
    if (user && !user.profile.skillsOffered.includes(title)) {
      user.profile.skillsOffered.push(title);
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: skill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all skills (with search & filters)
// @route   GET /api/skills
// @access  Public
exports.getSkills = async (req, res, next) => {
  try {
    const { search, category, minCredits, maxCredits, minRating } = req.query;

    const query = {};

    // Apply Search filter (title or description match)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Apply Credit range filter
    if (minCredits || maxCredits) {
      query.credits = {};
      if (minCredits) query.credits.$gte = parseInt(minCredits);
      if (maxCredits) query.credits.$lte = parseInt(maxCredits);
    }

    // Apply rating filter
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    // Don't show user's own skills (if requested, but generally show all for browsing, maybe omit own in frontend or query)
    // Let's keep it open, but populate the instructor details
    const skills = await Skill.find(query)
      .populate('creator', 'username profile.avatar profile.location')
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

// @desc    Get skill details by ID
// @route   GET /api/skills/:id
// @access  Public
exports.getSkillById = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id).populate(
      'creator',
      'username profile.avatar profile.location profile.about profile.college profile.linkedin profile.github availability'
    );

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill listing not found' });
    }

    // Fetch reviews for this skill
    const reviews = await Review.find({ skill: skill._id })
      .populate('reviewer', 'username profile.avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        skill,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a skill listing
// @route   PUT /api/skills/:id
// @access  Private
exports.updateSkill = async (req, res, next) => {
  try {
    let skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill listing not found' });
    }

    // Ensure user is creator or admin
    if (skill.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing',
      });
    }

    const { title, description, category, credits, duration } = req.body;

    if (title) skill.title = title;
    if (description) skill.description = description;
    if (category) skill.category = category;
    if (credits) skill.credits = credits;
    if (duration) skill.duration = duration;

    await skill.save();

    res.status(200).json({
      success: true,
      message: 'Skill updated successfully',
      data: skill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a skill listing
// @route   DELETE /api/skills/:id
// @access  Private
exports.deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill listing not found' });
    }

    // Ensure user is creator or admin
    if (skill.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing',
      });
    }

    // Delete reviews and booking records for this skill if needed
    await Review.deleteMany({ skill: skill._id });
    await Skill.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Skill listing deleted successfully' });
  } catch (error) {
    next(error);
  }
};

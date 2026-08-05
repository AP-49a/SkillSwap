import Profile from '../models/Profile.js';
import User from '../models/User.js';

// @desc    Get profile by username
// @route   GET /api/profiles/:username
// @access  Public
export const getProfileByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await Profile.findOne({ user: user._id })
      .populate('user', 'name username email credits level xp streak lastLoginDate')
      .populate('followers', 'name username')
      .populate('following', 'name username')
      .populate({
        path: 'reviews.reviewer',
        select: 'name username',
      });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/profiles/me
// @access  Private
export const updateProfile = async (req, res) => {
  const {
    bio,
    about,
    avatar,
    coverImage,
    skillsOffered,
    skillsWanted,
    experienceLevel,
    languages,
    location,
    collegeOrCompany,
    portfolioLinks,
    availabilityCalendar,
    preferredLearningMode,
    projects,
    certificates,
  } = req.body;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Update fields
    profile.bio = bio !== undefined ? bio : profile.bio;
    profile.about = about !== undefined ? about : profile.about;
    profile.avatar = avatar !== undefined ? avatar : profile.avatar;
    profile.coverImage = coverImage !== undefined ? coverImage : profile.coverImage;
    profile.skillsOffered = skillsOffered !== undefined ? skillsOffered : profile.skillsOffered;
    profile.skillsWanted = skillsWanted !== undefined ? skillsWanted : profile.skillsWanted;
    profile.experienceLevel = experienceLevel !== undefined ? experienceLevel : profile.experienceLevel;
    profile.languages = languages !== undefined ? languages : profile.languages;
    profile.location = location !== undefined ? location : profile.location;
    profile.collegeOrCompany = collegeOrCompany !== undefined ? collegeOrCompany : profile.collegeOrCompany;
    profile.portfolioLinks = portfolioLinks !== undefined ? portfolioLinks : profile.portfolioLinks;
    profile.availabilityCalendar = availabilityCalendar !== undefined ? availabilityCalendar : profile.availabilityCalendar;
    profile.preferredLearningMode = preferredLearningMode !== undefined ? preferredLearningMode : profile.preferredLearningMode;
    profile.projects = projects !== undefined ? projects : profile.projects;
    profile.certificates = certificates !== undefined ? certificates : profile.certificates;

    await profile.save();

    // Check achievement if profile is 100% complete
    const isComplete = bio && about && location && skillsOffered.length > 0 && skillsWanted.length > 0;
    if (isComplete && !profile.achievements.includes('profile_completed')) {
      profile.achievements.push('profile_completed');
      await profile.save();

      // Trigger user XP gain
      const user = await User.findById(req.user.id);
      user.xp += 30;
      await user.save();
    }

    const updatedProfile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'name username email credits level xp streak')
      .populate('followers', 'name username')
      .populate('following', 'name username');

    res.json({ success: true, data: updatedProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all profiles (search, filter)
// @route   GET /api/profiles
// @access  Public
export const getAllProfiles = async (req, res) => {
  const {
    query,
    skill,
    category,
    location,
    language,
    teachingMode,
    minRating,
    availability,
  } = req.query;

  try {
    let filter = {};

    // Filter by specific search term across name/username/skills/bio
    if (query) {
      const usersMatching = await User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = usersMatching.map((u) => u._id);

      filter.$or = [
        { user: { $in: userIds } },
        { bio: { $regex: query, $options: 'i' } },
        { about: { $regex: query, $options: 'i' } },
        { 'skillsOffered.skill': { $regex: query, $options: 'i' } },
      ];
    }

    if (skill) {
      filter['skillsOffered.skill'] = { $regex: skill, $options: 'i' };
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (language) {
      filter.languages = { $regex: language, $options: 'i' };
    }

    if (teachingMode) {
      filter.preferredLearningMode = teachingMode;
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    if (availability) {
      filter.availabilityCalendar = { $in: [availability] };
    }

    // Perform query
    const profiles = await Profile.find(filter)
      .populate('user', 'name username credits level xp')
      .sort({ rating: -1, completedSwapsCount: -1 });

    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Follow / Unfollow user
// @route   POST /api/profiles/:id/follow
// @access  Private
export const toggleFollow = async (req, res) => {
  try {
    const targetProfile = await Profile.findById(req.params.id);
    if (!targetProfile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Check if trying to follow self
    if (targetProfile.user.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const myProfile = await Profile.findOne({ user: req.user.id });

    const isFollowing = targetProfile.followers.includes(req.user.id);

    if (isFollowing) {
      // Unfollow
      targetProfile.followers = targetProfile.followers.filter((f) => f.toString() !== req.user.id);
      myProfile.following = myProfile.following.filter((f) => f.toString() !== targetProfile.user.toString());
    } else {
      // Follow
      targetProfile.followers.push(req.user.id);
      myProfile.following.push(targetProfile.user);
    }

    await targetProfile.save();
    await myProfile.save();

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & recommended mentors
// @route   GET /api/profiles/dashboard/recommendations
// @access  Private
export const getDashboardRecommendations = async (req, res) => {
  try {
    // Return top rated teachers excluding current user
    const recommendations = await Profile.find({ user: { $ne: req.user.id } })
      .populate('user', 'name username credits level')
      .sort({ rating: -1, completedSwapsCount: -1 })
      .limit(6);

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

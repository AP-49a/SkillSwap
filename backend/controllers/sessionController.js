import Session from '../models/Session.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';

// @desc    Create a session booking request
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  const { teacherId, skill, description, date, timeSlot, durationHours } = req.body;

  try {
    if (teacherId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot book a session with yourself' });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Credits cost: 20 credits per hour
    const creditCost = (durationHours || 1) * 20;

    const learner = await User.findById(req.user.id);
    if (learner.credits < creditCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. This session costs ${creditCost} credits, but you only have ${learner.credits}.`,
      });
    }

    const session = await Session.create({
      teacher: teacherId,
      learner: req.user.id,
      skill,
      description,
      date,
      timeSlot,
      durationHours,
      creditCost,
    });

    // Notify teacher
    await Notification.create({
      user: teacherId,
      type: 'booking_request',
      title: 'New Session Request!',
      message: `${req.user.name} wants to learn ${skill} from you.`,
      metaData: { sessionId: session._id.toString() },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept session request
// @route   PUT /api/sessions/:id/accept
// @access  Private
export const acceptSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Only teacher can accept
    if (session.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Session is not pending' });
    }

    const randomRoomId = Math.random().toString(36).substring(2, 10).toUpperCase();

    session.status = 'accepted';
    session.meetingLink = `https://meet.skillswap.app/room/${randomRoomId}`;
    await session.save();

    // Notify learner
    await Notification.create({
      user: session.learner,
      type: 'booking_accepted',
      title: 'Session Request Accepted!',
      message: `${req.user.name} accepted your request for ${session.skill}.`,
      metaData: { sessionId: session._id.toString() },
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject session request
// @route   PUT /api/sessions/:id/reject
// @access  Private
export const rejectSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Only teacher can reject
    if (session.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Session is not pending' });
    }

    session.status = 'rejected';
    await session.save();

    // Notify learner
    await Notification.create({
      user: session.learner,
      type: 'booking_rejected',
      title: 'Session Request Declined',
      message: `${req.user.name} was unavailable for ${session.skill}.`,
      metaData: { sessionId: session._id.toString() },
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
export const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const isTeacher = session.teacher.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isTeacher && !isLearner) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Session already finalized' });
    }

    session.status = 'cancelled';
    await session.save();

    // Notify the other party
    const targetUserId = isTeacher ? session.learner : session.teacher;
    await Notification.create({
      user: targetUserId,
      type: 'booking_rejected',
      title: 'Session Cancelled',
      message: `${req.user.name} cancelled the session for ${session.skill}.`,
      metaData: { sessionId: session._id.toString() },
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete session & transfer credits
// @route   PUT /api/sessions/:id/complete
// @access  Private
export const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Either party can complete, but it must be in "accepted" status
    const isTeacher = session.teacher.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isTeacher && !isLearner) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    if (session.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Session is not in active state' });
    }

    session.status = 'completed';
    await session.save();

    // TRANSFER CREDITS
    const teacherUser = await User.findById(session.teacher);
    const learnerUser = await User.findById(session.learner);

    if (learnerUser.credits < session.creditCost) {
      // In case they spent credits on something else meanwhile
      return res.status(400).json({
        success: false,
        message: 'Learner no longer has enough credits to finalize this session',
      });
    }

    learnerUser.credits -= session.creditCost;
    teacherUser.credits += session.creditCost;

    // Gamification XP Rewards
    // Learner gets 15 XP, Teacher gets 40 XP
    learnerUser.xp += 15;
    teacherUser.xp += 40;

    // Check level ups
    const oldTeacherLevel = teacherUser.level;
    const oldLearnerLevel = learnerUser.level;

    teacherUser.level = Math.floor(teacherUser.xp / 100) + 1;
    learnerUser.level = Math.floor(learnerUser.xp / 100) + 1;

    await learnerUser.save();
    await teacherUser.save();

    // Update Swap Counts on Profiles
    const teacherProfile = await Profile.findOne({ user: session.teacher });
    const learnerProfile = await Profile.findOne({ user: session.learner });

    if (teacherProfile) {
      teacherProfile.completedSwapsCount += 1;
      // Award badges based on completions
      if (teacherProfile.completedSwapsCount >= 5 && !teacherProfile.achievements.includes('pro_teacher')) {
        teacherProfile.achievements.push('pro_teacher');
      }
      await teacherProfile.save();
    }

    if (learnerProfile) {
      learnerProfile.completedSwapsCount += 1;
      if (learnerProfile.completedSwapsCount >= 5 && !learnerProfile.achievements.includes('pro_learner')) {
        learnerProfile.achievements.push('pro_learner');
      }
      await learnerProfile.save();
    }

    // Trigger Notification: Credits Spent
    await Notification.create({
      user: session.learner,
      type: 'credits_spent',
      title: 'Credits Redeemed',
      message: `You spent ${session.creditCost} credits for learning ${session.skill}. Earned 15 XP!`,
      metaData: { sessionId: session._id.toString(), creditsAmount: session.creditCost },
    });

    // Trigger Notification: Credits Earned
    await Notification.create({
      user: session.teacher,
      type: 'credits_earned',
      title: 'Credits Deposited!',
      message: `You earned ${session.creditCost} credits for teaching ${session.skill}. Earned 40 XP!`,
      metaData: { sessionId: session._id.toString(), creditsAmount: session.creditCost },
    });

    if (teacherUser.level > oldTeacherLevel) {
      await Notification.create({
        user: session.teacher,
        type: 'achievement_unlocked',
        title: 'Level Up!',
        message: `Congratulations! You reached Level ${teacherUser.level}!`,
        metaData: { achievementId: `level_${teacherUser.level}` }
      });
    }

    if (learnerUser.level > oldLearnerLevel) {
      await Notification.create({
        user: session.learner,
        type: 'achievement_unlocked',
        title: 'Level Up!',
        message: `Congratulations! You reached Level ${learnerUser.level}!`,
        metaData: { achievementId: `level_${learnerUser.level}` }
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Leave feedback/review on completed session
// @route   POST /api/sessions/:id/review
// @access  Private
export const leaveReview = async (req, res) => {
  const { rating, reviewText, wouldRecommend } = req.body;

  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot review an incomplete session' });
    }

    // Only learner can review teacher in this flow
    if (session.learner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only learners can review teachers' });
    }

    if (session.learnerReviewed) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this session' });
    }

    // Find teacher's profile
    const teacherProfile = await Profile.findOne({ user: session.teacher });
    if (!teacherProfile) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    // Add review to profile
    const newReview = {
      reviewer: req.user.id,
      rating: Number(rating),
      reviewText,
      skillLearned: session.skill,
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
    };

    teacherProfile.reviews.push(newReview);
    
    // Recalculate average rating
    const totalReviews = teacherProfile.reviews.length;
    const ratingSum = teacherProfile.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    teacherProfile.rating = parseFloat((ratingSum / totalReviews).toFixed(1));
    teacherProfile.totalRatingsCount = totalReviews;

    // Check rating achievement
    if (teacherProfile.rating >= 4.8 && totalReviews >= 3 && !teacherProfile.achievements.includes('star_teacher')) {
      teacherProfile.achievements.push('star_teacher');
    }

    await teacherProfile.save();

    session.learnerReviewed = true;
    await session.save();

    // Notify teacher
    await Notification.create({
      user: session.teacher,
      type: 'review_received',
      title: 'New Review Received!',
      message: `${req.user.name} rated you ${rating} stars for teaching ${session.skill}.`,
      metaData: { sessionId: session._id.toString() },
    });

    res.json({ success: true, message: 'Review submitted successfully', data: teacherProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user sessions
// @route   GET /api/sessions/my-sessions
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ teacher: req.user.id }, { learner: req.user.id }],
    })
      .populate('teacher', 'name username email credits')
      .populate('learner', 'name username email credits')
      .sort({ date: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

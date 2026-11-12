const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const CourseVideo = require('../models/CourseVideo');
const CourseReview = require('../models/CourseReview');
const CourseDoubtSession = require('../models/CourseDoubtSession');
const Purchase = require('../models/Purchase');
const Review = require('../models/Review');
const AdminLog = require('../models/AdminLog');
const Report = require('../models/Report');
const PlatformSettings = require('../models/PlatformSettings');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dateBound = (value, endOfDay = false) => {
  const date = new Date(value);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999);
  return date;
};

const recordAdminAction = (req, { action, resourceType, resourceId, description }) => AdminLog.create({
  admin: req.user._id,
  action,
  resourceType,
  resourceId,
  description,
});

exports.getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, pendingCourses, publishedCourses, unlocks, completedSessions, totalTransactions, creditsAgg, courseTeachers, courseStudents, skillTeachers, sessionStudents, recentUsers, popularCourses, recentLogs, categoryDistribution, pendingReports] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments({ status: 'pending' }),
      Course.countDocuments({ status: 'published' }),
      Purchase.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Wallet.aggregate([{ $unwind: '$transactions' }, { $count: 'count' }]),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      Course.distinct('teacher'),
      Purchase.distinct('student'),
      Skill.distinct('creator'),
      Booking.distinct('learner'),
      User.find().select('username email role profile.avatar createdAt').sort({ createdAt: -1 }).limit(6).lean(),
      Purchase.aggregate([
        { $group: { _id: '$course', unlocks: { $sum: 1 } } },
        { $sort: { unlocks: -1 } }, { $limit: 5 },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: { _id: 1, title: '$course.title', thumbnail: '$course.thumbnail', unlocks: 1, rating: '$course.averageRating' } },
      ]),
      AdminLog.find().populate('admin', 'username').sort({ createdAt: -1 }).limit(6).lean(),
      Course.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Report.countDocuments({ status: 'pending' }),
    ]);
    const totalCredits = creditsAgg[0]?.total || 0;
    const studentIds = new Set([...courseStudents, ...sessionStudents].map(String));
    const actualTeachers = new Set([...courseTeachers, ...skillTeachers].map(String));
    res.status(200).json({ success: true, data: {
      metrics: {
        totalUsers,
        students: studentIds.size,
        teachers: actualTeachers.size,
        publishedCourses,
        pendingCourses,
        courseUnlocks: unlocks,
        creditTransactions: totalTransactions[0]?.count || 0,
        completedSessions,
        pendingReports,
        creditsInCirculation: totalCredits,
      },
      recentUsers,
      popularCourses,
      recentActivity: recentLogs,
      categoryDistribution,
      sessions: {
        upcoming: await Booking.countDocuments({ status: 'upcoming' }),
        completed: completedSessions,
        cancelled: await Booking.countDocuments({ status: 'cancelled' }),
      },
    } });
  } catch (error) { next(error); }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const match = {};
    if (['credit', 'debit'].includes(req.query.type)) match['transactions.type'] = req.query.type;
    if (req.query.userId && mongoose.isValidObjectId(req.query.userId)) match.user = new mongoose.Types.ObjectId(req.query.userId);
    if (req.query.from || req.query.to) {
      match['transactions.date'] = {};
      if (req.query.from && !Number.isNaN(Date.parse(req.query.from))) match['transactions.date'].$gte = dateBound(req.query.from);
      if (req.query.to && !Number.isNaN(Date.parse(req.query.to))) match['transactions.date'].$lte = dateBound(req.query.to, true);
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim().slice(0, 100));
      const searchOr = [
        { 'transactions.description': { $regex: term, $options: 'i' } },
        { 'transactions.reason': { $regex: term, $options: 'i' } },
        { 'transactions.reference': { $regex: term, $options: 'i' } },
        { 'account.username': { $regex: term, $options: 'i' } },
        { 'account.email': { $regex: term, $options: 'i' } },
      ];
      if (mongoose.isValidObjectId(req.query.search.trim())) searchOr.push({ 'transactions._id': new mongoose.Types.ObjectId(req.query.search.trim()) });
      match.$or = searchOr;
    }
    const [result] = await Wallet.aggregate([
      { $unwind: '$transactions' },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'account' } },
      { $unwind: '$account' },
      { $match: match },
      { $sort: { 'transactions.date': -1 } },
      { $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: (page - 1) * limit }, { $limit: limit },
          { $project: { _id: '$transactions._id', user: { _id: '$account._id', username: '$account.username', email: '$account.email' }, type: '$transactions.type', amount: '$transactions.amount', description: '$transactions.description', reason: '$transactions.reason', previousBalance: '$transactions.previousBalance', newBalance: '$transactions.newBalance', reference: '$transactions.reference', date: '$transactions.date', admin: '$transactions.admin' } },
        ],
      } },
    ]);
    const [totals, transactionCount, signupCredits, movementTotals] = await Promise.all([
      Wallet.aggregate([{ $group: { _id: null, creditsHeld: { $sum: '$balance' } } }]),
      Wallet.aggregate([{ $unwind: '$transactions' }, { $count: 'count' }]),
      Wallet.aggregate([{ $unwind: '$transactions' }, { $match: { 'transactions.description': /welcome credit/i } }, { $group: { _id: null, amount: { $sum: '$transactions.amount' } } }]),
      Wallet.aggregate([{ $unwind: '$transactions' }, { $group: { _id: null, earned: { $sum: { $cond: [{ $eq: ['$transactions.type', 'credit'] }, '$transactions.amount', 0] } }, spent: { $sum: { $cond: [{ $eq: ['$transactions.type', 'debit'] }, '$transactions.amount', 0] } } } }]),
    ]);
    const total = result?.metadata?.[0]?.total || 0;
    res.status(200).json({ success: true, data: result?.data || [], pagination: { page, limit, total, pages: Math.ceil(total / limit) }, summary: { creditsHeld: totals[0]?.creditsHeld || 0, transactionCount: transactionCount[0]?.count || 0, signupCreditsDistributed: signupCredits[0]?.amount || 0, creditsEarned: movementTotals[0]?.earned || 0, creditsSpent: movementTotals[0]?.spent || 0 } });
  } catch (error) { next(error); }
};

exports.adjustCredits = async (req, res, next) => {
  try {
    const { userId, amount, reason } = req.body || {};
    const signedAmount = Number(amount);
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Select a valid user.' });
    if (!Number.isSafeInteger(signedAmount) || signedAmount === 0) return res.status(400).json({ success: false, message: 'Enter a non-zero whole number of credits.' });
    if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500) return res.status(400).json({ success: false, message: 'Enter a reason between 3 and 500 characters.' });
    const user = await User.findById(userId).select('username');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const transactionId = new mongoose.Types.ObjectId();
    const reference = `admin-${transactionId.toString()}`;
    const update = [{ $set: {
      balance: { $add: ['$balance', signedAmount] },
      transactions: { $concatArrays: [{ $ifNull: ['$transactions', []] }, [{
        _id: transactionId,
        amount: Math.abs(signedAmount),
        type: signedAmount > 0 ? 'credit' : 'debit',
        description: `Administrator adjustment: ${reason.trim()}`,
        reason: reason.trim(),
        admin: req.user._id,
        previousBalance: '$balance',
        newBalance: { $add: ['$balance', signedAmount] },
        reference,
        date: '$$NOW',
      }]],
    } } }];
    const wallet = await Wallet.findOneAndUpdate({ user: userId, ...(signedAmount < 0 ? { balance: { $gte: Math.abs(signedAmount) } } : {}) }, update, { new: true });
    if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found or the deduction exceeds the available balance.' });
    await recordAdminAction(req, { action: 'credits.adjusted', resourceType: 'wallet', resourceId: wallet._id, description: `${signedAmount > 0 ? 'Added' : 'Deducted'} ${Math.abs(signedAmount)} credits ${signedAmount > 0 ? 'to' : 'from'} @${user.username}: ${reason.trim()}` });
    const transaction = wallet.transactions[wallet.transactions.length - 1];
    res.status(200).json({ success: true, message: 'Credits adjusted and recorded.', data: transaction });
  } catch (error) { next(error); }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const query = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.admin && mongoose.isValidObjectId(req.query.admin)) query.admin = req.query.admin;
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim().slice(0, 100));
      query.$or = [{ action: { $regex: term, $options: 'i' } }, { resourceType: { $regex: term, $options: 'i' } }, { description: { $regex: term, $options: 'i' } }];
    }
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from && !Number.isNaN(Date.parse(req.query.from))) query.createdAt.$gte = dateBound(req.query.from);
      if (req.query.to && !Number.isNaN(Date.parse(req.query.to))) query.createdAt.$lte = dateBound(req.query.to, true);
    }
    const [data, total] = await Promise.all([
      AdminLog.find(query).populate('admin', 'username email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AdminLog.countDocuments(query),
    ]);
    res.status(200).json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const months = Math.min(24, Math.max(1, Number.parseInt(req.query.months, 10) || 12));
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - (months - 1));
    const byMonth = (datePath) => [{ $match: { [datePath]: { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: `$${datePath}` } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }];
    const [registrations, courseCreations, unlocks, sessions, creditActivity, subjects, popularCourses, topTeachers] = await Promise.all([
      User.aggregate(byMonth('createdAt')),
      Course.aggregate(byMonth('createdAt')),
      Purchase.aggregate(byMonth('purchasedAt')),
      Booking.aggregate([{ $match: { status: 'completed', updatedAt: { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Wallet.aggregate([{ $unwind: '$transactions' }, { $match: { 'transactions.date': { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$transactions.date' } }, credits: { $sum: '$transactions.amount' }, transactions: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Course.aggregate([{ $group: { _id: '$category', courses: { $sum: 1 }, averageRating: { $avg: '$averageRating' } } }, { $sort: { courses: -1 } }, { $limit: 8 }]),
      Purchase.aggregate([{ $group: { _id: '$course', unlocks: { $sum: 1 } } }, { $sort: { unlocks: -1 } }, { $limit: 8 }, { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } }, { $unwind: '$course' }, { $project: { _id: 1, title: '$course.title', unlocks: 1, rating: '$course.averageRating', teacher: '$course.teacher' } }]),
      Course.aggregate([{ $group: { _id: '$teacher', courses: { $sum: 1 }, averageRating: { $avg: '$averageRating' } } }, { $sort: { averageRating: -1, courses: -1 } }, { $limit: 8 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } }, { $unwind: '$teacher' }, { $project: { username: '$teacher.username', email: '$teacher.email', courses: 1, averageRating: 1 } }]),
    ]);
    res.status(200).json({ success: true, data: { registrations, courseCreations, unlocks, sessions, creditActivity, subjects, popularCourses, topTeachers, months } });
  } catch (error) { next(error); }
};

exports.getReports = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const query = {};
    if (['pending', 'under_review', 'resolved', 'dismissed'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    const [reports, total] = await Promise.all([
      Report.find(query).populate('reporter', 'username email').populate('assignedAdmin', 'username').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Report.countDocuments(query),
    ]);
    const data = await Promise.all(reports.map(async (report) => {
      let target = null;
      if (report.targetType === 'course') target = await Course.findById(report.target).select('title category teacher').populate('teacher', 'username').lean();
      else if (report.targetType === 'user') target = await User.findById(report.target).select('username email accountStatus').lean();
      else if (report.targetType === 'session') target = await Booking.findById(report.target).populate('skill', 'title').populate('instructor', 'username').populate('learner', 'username').lean();
      else if (report.targetType === 'review') target = await CourseReview.findById(report.target).populate('course', 'title').populate('student', 'username').lean() || await Review.findById(report.target).populate('skill', 'title').populate('reviewer', 'username').lean();
      return { ...report, target };
    }));
    res.status(200).json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.updateReport = async (req, res, next) => {
  try {
    const { status, investigationNotes = '', resolution = '' } = req.body || {};
    if (!['under_review', 'resolved', 'dismissed'].includes(status)) return res.status(400).json({ success: false, message: 'Choose a valid moderation outcome.' });
    if (typeof investigationNotes !== 'string' || investigationNotes.length > 4000 || typeof resolution !== 'string' || resolution.length > 1000) return res.status(400).json({ success: false, message: 'Notes are too long.' });
    if (['resolved', 'dismissed'].includes(status) && resolution.trim().length < 3) return res.status(400).json({ success: false, message: 'Add a short resolution note before closing a report.' });
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    report.status = status;
    report.investigationNotes = investigationNotes.trim();
    report.resolution = resolution.trim();
    report.assignedAdmin = req.user._id;
    report.resolvedAt = ['resolved', 'dismissed'].includes(status) ? new Date() : null;
    await report.save();
    await recordAdminAction(req, { action: `report.${status}`, resourceType: 'report', resourceId: report._id, description: `${status.replace('_', ' ')} report ${report._id}` });
    res.status(200).json({ success: true, message: `Report marked ${status.replace('_', ' ')}.`, data: report });
  } catch (error) { next(error); }
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSettings.findOne({ key: 'platform' }).lean();
    res.status(200).json({ success: true, data: { signupCredits: settings?.signupCredits ?? 10, updatedAt: settings?.updatedAt || null } });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const signupCredits = Number(req.body?.signupCredits);
    if (!Number.isSafeInteger(signupCredits) || signupCredits < 0 || signupCredits > 1000) return res.status(400).json({ success: false, message: 'Signup credits must be a whole number from 0 to 1000.' });
    const previous = await PlatformSettings.findOne({ key: 'platform' }).lean();
    const settings = await PlatformSettings.findOneAndUpdate({ key: 'platform' }, { $set: { signupCredits } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    await recordAdminAction(req, { action: 'settings.signup_credits_updated', resourceType: 'settings', resourceId: settings._id, description: `Changed signup credits from ${previous?.signupCredits ?? 10} to ${signupCredits}` });
    res.status(200).json({ success: true, message: 'Signup credit setting saved.', data: { signupCredits: settings.signupCredits, updatedAt: settings.updatedAt } });
  } catch (error) { next(error); }
};

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
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const query = {};
    const clauses = [];
    if (['user', 'admin'].includes(req.query.role)) query.role = req.query.role;
    if (req.query.status === 'suspended') query.accountStatus = 'suspended';
    if (req.query.status === 'active') clauses.push({ $or: [{ accountStatus: 'active' }, { accountStatus: { $exists: false } }, { accountStatus: null }] });
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim().slice(0, 100));
      const alternatives = [{ username: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
      if (mongoose.isValidObjectId(req.query.search.trim())) alternatives.push({ _id: req.query.search.trim() });
      clauses.push({ $or: alternatives });
    }
    if (clauses.length) query.$and = clauses;
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);

    const userIds = users.map((u) => u._id);
    const wallets = await Wallet.find({ user: { $in: userIds } }).select('user balance');
    const walletMap = {};
    wallets.forEach((w) => {
      walletMap[w.user.toString()] = w.balance;
    });

    const populatedUsers = users.map(user => {
      const uObj = user.toObject();
      uObj.credits = walletMap[user._id.toString()] || 0;
      return uObj;
    });

    res.status(200).json({
      success: true,
      count: total,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: populatedUsers,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason = '' } = req.body || {};
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    if (target._id.equals(req.user._id)) return res.status(400).json({ success: false, message: 'You cannot suspend your own administrator account.' });
    if (status === 'suspended' && target.role === 'admin') return res.status(400).json({ success: false, message: 'Administrator accounts cannot be suspended here.' });
    if (status === 'suspended' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 500)) return res.status(400).json({ success: false, message: 'Enter a reason between 3 and 500 characters.' });
    target.accountStatus = status;
    target.suspensionReason = status === 'suspended' ? reason.trim() : '';
    target.suspendedAt = status === 'suspended' ? new Date() : null;
    await target.save();
    await recordAdminAction(req, { action: status === 'suspended' ? 'user.suspended' : 'user.restored', resourceType: 'user', resourceId: target._id, description: `${status === 'suspended' ? 'Suspended' : 'Restored'} @${target.username}${reason ? `: ${reason.trim()}` : ''}` });
    res.status(200).json({ success: true, message: status === 'suspended' ? 'Account suspended.' : 'Account restored.', data: { _id: target._id, accountStatus: target.accountStatus, suspensionReason: target.suspensionReason, suspendedAt: target.suspendedAt } });
  } catch (error) { next(error); }
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

exports.getCourses = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const query = {};
    if (['draft', 'pending', 'published', 'rejected', 'unpublished'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.instructor && mongoose.isValidObjectId(req.query.instructor)) query.teacher = req.query.instructor;
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim().slice(0, 100));
      query.$or = [{ title: { $regex: term, $options: 'i' } }, { category: { $regex: term, $options: 'i' } }];
    }
    const [courses, total, categories, instructorIds] = await Promise.all([
      Course.find(query).populate('teacher', 'username email profile.avatar').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Course.countDocuments(query),
      Course.distinct('category'),
      Course.distinct('teacher'),
    ]);
    const instructors = await User.find({ _id: { $in: instructorIds } }).select('username').sort({ username: 1 }).lean();
    const ids = courses.map((course) => course._id);
    const [purchases, ratings] = await Promise.all([
      Purchase.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: '$course', count: { $sum: 1 } } }]),
      CourseReview.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: '$course', averageRating: { $avg: '$rating' }, reviews: { $sum: 1 } } }]),
    ]);
    const purchaseCounts = new Map(purchases.map((item) => [String(item._id), item.count]));
    const ratingMap = new Map(ratings.map((item) => [String(item._id), item]));
    const data = courses.map((course) => ({ ...course, unlocks: purchaseCounts.get(String(course._id)) || 0, rating: ratingMap.get(String(course._id))?.averageRating || 0, reviewCount: ratingMap.get(String(course._id))?.reviews || 0 }));
    res.status(200).json({ success: true, data, filters: { categories: categories.filter(Boolean).sort(), instructors }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.updateCourseStatus = async (req, res, next) => {
  try {
    const { status, reason = '' } = req.body || {};
    if (!['published', 'rejected', 'unpublished'].includes(status)) return res.status(400).json({ success: false, message: 'Choose a supported course action.' });
    if (status === 'rejected' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500)) return res.status(400).json({ success: false, message: 'A rejection reason between 3 and 500 characters is required.' });
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    course.status = status;
    course.rejectionReason = status === 'rejected' ? reason.trim() : '';
    await course.save();
    await recordAdminAction(req, { action: `course.${status}`, resourceType: 'course', resourceId: course._id, description: `${status === 'published' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Unpublished'} “${course.title}”${reason ? `: ${reason.trim()}` : ''}` });
    res.status(200).json({ success: true, message: `Course ${status}.`, data: course });
  } catch (error) { next(error); }
};

exports.getReviews = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.rating && Number(req.query.rating) >= 1 && Number(req.query.rating) <= 5) query.rating = Number(req.query.rating);
    if (typeof req.query.search === 'string' && req.query.search.trim()) query.comment = { $regex: escapeRegex(req.query.search.trim().slice(0, 100)), $options: 'i' };
    const [courseReviews, skillReviews] = await Promise.all([
      CourseReview.find(query).populate('student', 'username email').populate('course', 'title').populate('teacher', 'username email').sort({ createdAt: -1 }).limit(200).lean(),
      Review.find(query).populate('reviewer', 'username email').populate('skill', 'title').populate('booking', 'instructor').sort({ createdAt: -1 }).limit(200).lean(),
    ]);
    const skillReviewRows = await Promise.all(skillReviews.map(async (review) => {
      const booking = review.booking?._id ? await Booking.findById(review.booking._id).populate('instructor', 'username email').select('instructor').lean() : null;
      return { ...review, source: 'skill', student: review.reviewer, course: { title: review.skill?.title || 'Skill listing' }, teacher: booking?.instructor, rating: review.rating, comment: review.comment };
    }));
    const data = [...courseReviews.map((item) => ({ ...item, source: 'course' })), ...skillReviewRows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 200);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const courseReview = await CourseReview.findById(req.params.id).populate('course', 'title');
    if (courseReview) {
      const courseId = courseReview.course?._id;
      const title = courseReview.course?.title || 'course';
      await courseReview.deleteOne();
      if (courseId) {
        const remaining = await CourseReview.aggregate([{ $match: { course: courseId } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
        await Course.findByIdAndUpdate(courseId, { averageRating: remaining[0]?.average || 0, reviewsCount: remaining[0]?.count || 0 });
      }
      await recordAdminAction(req, { action: 'review.removed', resourceType: 'courseReview', resourceId: courseReview._id, description: `Removed a review for “${title}”` });
    } else {
      const skillReview = await Review.findById(req.params.id).populate('skill', 'title');
      if (!skillReview) return res.status(404).json({ success: false, message: 'Review not found.' });
      const skillId = skillReview.skill?._id;
      const title = skillReview.skill?.title || 'skill listing';
      await skillReview.deleteOne();
      if (skillId) await Review.getAverageRating(skillId);
      await recordAdminAction(req, { action: 'review.removed', resourceType: 'skillReview', resourceId: skillReview._id, description: `Removed a review for “${title}”` });
    }
    res.status(200).json({ success: true, message: 'Review removed.' });
  } catch (error) { next(error); }
};

// @desc    Get all bookings list
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getBookings = async (req, res, next) => {
  try {
    const query = {};
    if (['upcoming', 'completed', 'cancelled'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from && !Number.isNaN(Date.parse(req.query.from))) query.date.$gte = dateBound(req.query.from);
      if (req.query.to && !Number.isNaN(Date.parse(req.query.to))) query.date.$lte = dateBound(req.query.to, true);
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = escapeRegex(req.query.search.trim().slice(0, 100));
      const [users, skills] = await Promise.all([
        User.find({ $or: [{ username: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }] }).select('_id'),
        Skill.find({ title: { $regex: term, $options: 'i' } }).select('_id'),
      ]);
      query.$or = [{ skill: { $in: skills.map((item) => item._id) } }, { instructor: { $in: users.map((item) => item._id) } }, { learner: { $in: users.map((item) => item._id) } }];
    }
    const bookings = await Booking.find(query)
      .populate('skill', 'title')
      .populate('instructor', 'username email')
      .populate('learner', 'username email')
      .sort({ date: -1 }).limit(500);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently remove a user and their related account data
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own administrator account.' });
    }

    const user = await User.findById(id).select('_id role');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Administrator accounts cannot be permanently deleted through this panel.' });

    const [skills, courses, bookings] = await Promise.all([
      Skill.find({ creator: id }).select('_id'),
      Course.find({ teacher: id }).select('_id'),
      Booking.find({ $or: [{ instructor: id }, { learner: id }] }).select('_id'),
    ]);
    const skillIds = skills.map((item) => item._id);
    const courseIds = courses.map((item) => item._id);
    const bookingIds = bookings.map((item) => item._id);

    await Promise.all([
      Review.deleteMany({ $or: [{ reviewer: id }, { skill: { $in: skillIds } }, { booking: { $in: bookingIds } }] }),
      Booking.deleteMany({ $or: [{ instructor: id }, { learner: id }, { skill: { $in: skillIds } }] }),
      Skill.deleteMany({ creator: id }),
      CourseReview.deleteMany({ $or: [{ student: id }, { teacher: id }, { course: { $in: courseIds } }] }),
      CourseDoubtSession.deleteMany({ $or: [{ student: id }, { teacher: id }, { course: { $in: courseIds } }] }),
      Purchase.deleteMany({ $or: [{ student: id }, { teacher: id }, { course: { $in: courseIds } }] }),
      CourseVideo.deleteMany({ course: { $in: courseIds } }),
      Course.deleteMany({ teacher: id }),
      Wallet.deleteMany({ user: id }),
      Notification.deleteMany({ user: id }),
      Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }, { sender: id }, { recipient: id }] }),
      Conversation.deleteMany({ participants: id }),
    ]);
    await User.deleteOne({ _id: id });
    await recordAdminAction(req, { action: 'user.deleted', resourceType: 'user', resourceId: user._id, description: 'Permanently deleted a user and their associated account data.' });

    res.status(200).json({ success: true, message: 'User and associated account data deleted.' });
  } catch (error) {
    next(error);
  }
};

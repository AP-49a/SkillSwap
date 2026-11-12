const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Course = require('../models/Course');
const CourseReview = require('../models/CourseReview');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

const targetModels = { course: Course, user: User, review: [CourseReview, Review], session: Booking };

exports.createReport = async (req, res, next) => {
  try {
    const { targetType, target, category, details } = req.body || {};
    if (!mongoose.isValidObjectId(target)) return res.status(400).json({ success: false, message: 'Select valid content to report.' });
    const models = targetModels[targetType];
    if (!models) return res.status(400).json({ success: false, message: 'Unsupported report target.' });
    if (targetType === 'user' && String(target) === String(req.user._id)) return res.status(400).json({ success: false, message: 'You cannot report your own profile.' });
    const found = Array.isArray(models)
      ? await Promise.any(models.map((Model) => Model.exists({ _id: target }).then((doc) => doc ? Model : Promise.reject(new Error('Not found'))))).catch(() => null)
      : await models.exists({ _id: target });
    if (!found) return res.status(404).json({ success: false, message: 'The reported content could not be found.' });
    const duplicate = await Report.findOne({ reporter: req.user._id, targetType, target, status: { $in: ['pending', 'under_review'] } });
    if (duplicate) return res.status(409).json({ success: false, message: 'You already have an open report for this item.' });
    const report = await Report.create({ reporter: req.user._id, targetType, target, category, details });
    res.status(201).json({ success: true, message: 'Report submitted for review.', data: report });
  } catch (error) { next(error); }
};

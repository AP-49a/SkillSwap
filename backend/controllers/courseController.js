const Course = require('../models/Course');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../middleware/courseThumbnailUpload');
const CourseVideo = require('../models/CourseVideo');
const { videoStorageRoot } = require('../middleware/videoUpload');

const publicTeacherFields = 'username profile.avatar profile.about profile.location';

const courseFields = ['title', 'description', 'category', 'credits', 'thumbnail'];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const removeUploadedThumbnail = async (file) => {
  if (file?.path) await fs.promises.unlink(file.path).catch(() => {});
};

const removeStoredThumbnail = async (url) => {
  const prefix = '/uploads/course-thumbnails/';
  if (typeof url !== 'string' || !url.startsWith(prefix)) return;
  const filename = url.slice(prefix.length);
  if (!filename || path.basename(filename) !== filename) return;
  await fs.promises.unlink(path.join(uploadDir, filename)).catch(() => {});
};

const applyCourseFields = (course, body) => {
  courseFields.forEach((field) => {
    if (body[field] !== undefined) {
      course[field] = body[field];
    }
  });
};

// @desc    Create a course draft
// @route   POST /api/courses
// @access  Private
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      credits: req.body.credits,
      thumbnail: req.file ? `/uploads/course-thumbnails/${req.file.filename}` : req.body.thumbnail,
      teacher: req.user.id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    await removeUploadedThumbnail(req.file);
    next(error);
  }
};

// @desc    Get published courses
// @route   GET /api/courses
// @access  Public
exports.getPublishedCourses = async (req, res, next) => {
  try {
    const { category } = req.query;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const query = { status: 'published' };

    if (search) {
      const literalSearch = escapeRegex(search);
      query.$or = [
        { title: { $regex: literalSearch, $options: 'i' } },
        { description: { $regex: literalSearch, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const courses = await Course.find(query)
      .populate('teacher', publicTeacherFields)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a published course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
    }).populate('teacher', publicTeacherFields);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Published course not found' });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses created by the authenticated teacher
// @route   GET /api/courses/mine
// @access  Private
exports.getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an owned course
// @route   PUT /api/courses/:id
// @access  Private
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    const previousThumbnail = course.thumbnail;
    const wasPublished = course.status === 'published';
    applyCourseFields(course, req.body);
    if (req.file) {
      course.thumbnail = `/uploads/course-thumbnails/${req.file.filename}`;
    }
    if (wasPublished) {
      course.status = 'pending';
      course.rejectionReason = '';
    }
    await course.save();
    if (previousThumbnail !== course.thumbnail) {
      await removeStoredThumbnail(previousThumbnail);
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    await removeUploadedThumbnail(req.file);
    next(error);
  }
};

// @desc    Delete an owned course
// @route   DELETE /api/courses/:id
// @access  Private
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await CourseVideo.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);
    await removeStoredThumbnail(course.thumbnail);
    const courseVideoDirectory = path.resolve(videoStorageRoot, course._id.toString());
    if (courseVideoDirectory.startsWith(`${videoStorageRoot}${path.sep}`)) {
      await fs.promises.rm(courseVideoDirectory, { recursive: true, force: true });
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish an owned course
// @route   POST /api/courses/:id/publish
// @access  Private
exports.publishCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to publish this course' });
    }

    if (course.status === 'published') {
      return res.status(200).json({ success: true, data: course, message: 'This course is already published.' });
    }
    course.status = 'pending';
    course.rejectionReason = '';
    await course.save();

    res.status(200).json({
      success: true,
      data: course,
      message: 'Course submitted for administrator review.',
    });
  } catch (error) {
    next(error);
  }
};

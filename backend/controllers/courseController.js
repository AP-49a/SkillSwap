const Course = require('../models/Course');

const publicTeacherFields = 'username profile.avatar profile.about profile.location';

const courseFields = ['title', 'description', 'category', 'credits', 'thumbnail'];

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
      thumbnail: req.body.thumbnail,
      teacher: req.user.id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get published courses
// @route   GET /api/courses
// @access  Public
exports.getPublishedCourses = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = { status: 'published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
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

    applyCourseFields(course, req.body);
    await course.save();

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
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

    await Course.findByIdAndDelete(course._id);

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

    course.status = 'published';
    await course.save();

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

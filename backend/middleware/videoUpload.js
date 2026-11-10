const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');

const videoStorageRoot = path.resolve(__dirname, '..', 'private', 'course-videos');
const videoMaxSizeMb = Number(process.env.COURSE_VIDEO_MAX_SIZE_MB || 500);
const videoMaxSizeBytes = videoMaxSizeMb * 1024 * 1024;
const allowedVideoTypes = new Map([
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.ogg', 'video/ogg'],
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return callback(Object.assign(new Error('Course not found'), { statusCode: 404 }));
    }
    const courseDirectory = path.resolve(videoStorageRoot, req.params.id);
    if (!courseDirectory.startsWith(`${videoStorageRoot}${path.sep}`)) {
      return callback(Object.assign(new Error('Invalid course upload path'), { statusCode: 400 }));
    }
    fs.mkdir(courseDirectory, { recursive: true }, (error) => callback(error, courseDirectory));
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `video-${crypto.randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMimeType = allowedVideoTypes.get(extension);

  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    return callback(new Error('Only MP4, WebM, and Ogg video files are supported'));
  }

  callback(null, true);
};

const authorizeCourseVideoUpload = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  try {
    const course = await Course.findById(req.params.id).select('_id teacher');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage videos for this course' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: videoMaxSizeBytes },
  fileFilter,
});

const uploadCourseVideo = (req, res, next) => {
  upload.single('video')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `Video file must be ${videoMaxSizeMb}MB or smaller`,
      });
    }

    error.statusCode = 400;
    next(error);
  });
};

module.exports = {
  uploadCourseVideo,
  authorizeCourseVideoUpload,
  videoStorageRoot,
  allowedVideoTypes,
  videoMaxSizeMb,
};

const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

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
    const courseDirectory = path.join(videoStorageRoot, req.params.id);
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
  videoStorageRoot,
  allowedVideoTypes,
  videoMaxSizeMb,
};

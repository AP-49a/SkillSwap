const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');

const uploadDir = path.join(__dirname, '..', 'uploads', 'course-thumbnails');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `course-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const mimeByExtension = new Map([
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'],
  ['.webp', 'image/webp'], ['.gif', 'image/gif'],
]);

const uploadCourseThumbnail = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (mimeByExtension.get(extension) === file.mimetype) return callback(null, true);
    const error = new Error('Thumbnail extension and image type must match (JPEG, PNG, WEBP, or GIF).');
    error.statusCode = 400;
    callback(error);
  },
});

const isImageSignature = (buffer, mimeType) => {
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/gif') return ['GIF87a', 'GIF89a'].some((signature) => buffer.subarray(0, 6).toString('ascii') === signature);
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
};

const validateCourseThumbnail = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const handle = await fs.promises.open(req.file.path, 'r');
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    await handle.close();
    if (!isImageSignature(header.subarray(0, bytesRead), req.file.mimetype)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: 'The selected file is not a valid image.' });
    }
    next();
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    next(error);
  }
};

const requireThumbnailCapacity = async (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  try {
    if (req.method === 'PUT') {
      const course = await Course.findById(req.params.id).select('teacher thumbnail');
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      if (course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
      }
      req.thumbnailCourse = course;
      if (course.thumbnail?.startsWith('/uploads/course-thumbnails/')) return next();
    }

    const thumbnailCount = await Course.countDocuments({
      teacher: req.user.id,
      thumbnail: { $regex: '^/uploads/course-thumbnails/' },
    });
    if (thumbnailCount >= 20) {
      return res.status(429).json({ success: false, message: 'You have reached the limit of 20 uploaded course thumbnails. Replace an existing thumbnail to upload another.' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadCourseThumbnail, validateCourseThumbnail, requireThumbnailCapacity, uploadDir };

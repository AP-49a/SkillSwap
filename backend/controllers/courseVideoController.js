const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseVideo = require('../models/CourseVideo');
const Purchase = require('../models/Purchase');
const {
  allowedVideoTypes,
  videoStorageRoot,
} = require('../middleware/videoUpload');

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidId = (value) => mongoose.isValidObjectId(value);

const getCourse = async (courseId) => {
  if (!isValidId(courseId)) {
    throw httpError(404, 'Course not found');
  }

  const course = await Course.findById(courseId).select('_id teacher');
  if (!course) {
    throw httpError(404, 'Course not found');
  }

  return course;
};

const assertCourseTeacher = (course, userId) => {
  if (course.teacher.toString() !== userId) {
    throw httpError(403, 'Not authorized to manage videos for this course');
  }
};

const assertVideoAccess = async (course, userId) => {
  if (course.teacher.toString() === userId) return;

  const purchase = await Purchase.exists({
    student: userId,
    course: course._id,
    status: 'completed',
  });

  if (!purchase) {
    throw httpError(403, 'Purchase required to access course videos');
  }
};

const getVideo = async (courseId, videoId) => {
  if (!isValidId(videoId)) {
    throw httpError(404, 'Video not found');
  }

  const video = await CourseVideo.findOne({
    _id: videoId,
    course: courseId,
  });

  if (!video) {
    throw httpError(404, 'Video not found');
  }

  return video;
};

const getPrivateVideoPath = (courseId, storedVideoUrl) => {
  if (typeof storedVideoUrl !== 'string') return null;

  const parts = storedVideoUrl.split('/');
  if (parts.length !== 2 || parts[0] !== courseId || parts[1] !== path.basename(parts[1])) {
    return null;
  }

  const videoPath = path.resolve(videoStorageRoot, courseId, parts[1]);
  const rootPrefix = `${videoStorageRoot}${path.sep}`;
  if (!videoPath.startsWith(rootPrefix)) {
    return null;
  }

  return videoPath;
};

const toVideoResponse = (video, courseId) => ({
  id: video._id,
  title: video.title,
  description: video.description,
  order: video.order,
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
  videoUrl: `/api/courses/${courseId}/videos/${video._id}/stream`,
});

const removeUploadedFile = async (file) => {
  if (!file?.path) return;

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Course video cleanup failed: ${error.message}`);
    }
  }
};

const parseVideoFields = (body, { partial = false } = {}) => {
  const title = body.title === undefined ? undefined : String(body.title).trim();
  const description = body.description === undefined ? undefined : String(body.description).trim();
  const order = body.order === undefined || body.order === '' ? undefined : Number(body.order);

  if (!partial && !title) {
    throw httpError(400, 'Video title is required');
  }
  if (title !== undefined && !title) {
    throw httpError(400, 'Video title cannot be empty');
  }
  if (title !== undefined && title.length > 150) {
    throw httpError(400, 'Video title cannot be more than 150 characters');
  }
  if (description !== undefined && description.length > 5000) {
    throw httpError(400, 'Video description cannot be more than 5000 characters');
  }
  if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
    throw httpError(400, 'Video order must be a non-negative integer');
  }

  return { title, description, order };
};

// @desc    Upload a course video
// @route   POST /api/courses/:id/videos
// @access  Private course teacher
exports.createCourseVideo = async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id);
    assertCourseTeacher(course, req.user.id);

    if (!req.file) {
      throw httpError(400, 'A video file is required');
    }

    const fields = parseVideoFields(req.body);

    const video = await CourseVideo.create({
      course: course._id,
      title: fields.title,
      description: fields.description,
      order: fields.order === undefined ? 0 : fields.order,
      videoUrl: `${course._id}/${req.file.filename}`,
    });

    res.status(201).json({
      success: true,
      data: toVideoResponse(video, course._id.toString()),
    });
  } catch (error) {
    await removeUploadedFile(req.file);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    List accessible course videos
// @route   GET /api/courses/:id/videos
// @access  Private teacher or purchaser
exports.getCourseVideos = async (req, res, next) => {
  try {
    const course = await getCourse(req.params.id);
    await assertVideoAccess(course, req.user.id);

    const videos = await CourseVideo.find({ course: course._id }).sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos.map((video) => toVideoResponse(video, course._id.toString())),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get accessible course video metadata
// @route   GET /api/courses/:courseId/videos/:videoId
// @access  Private teacher or purchaser
exports.getCourseVideo = async (req, res, next) => {
  try {
    const course = await getCourse(req.params.courseId);
    await assertVideoAccess(course, req.user.id);
    const video = await getVideo(course._id, req.params.videoId);

    res.status(200).json({
      success: true,
      data: toVideoResponse(video, course._id.toString()),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Stream an accessible course video
// @route   GET /api/courses/:courseId/videos/:videoId/stream
// @access  Private teacher or purchaser
exports.streamCourseVideo = async (req, res, next) => {
  try {
    const course = await getCourse(req.params.courseId);
    await assertVideoAccess(course, req.user.id);
    const video = await getVideo(course._id, req.params.videoId);
    const videoPath = getPrivateVideoPath(course._id.toString(), video.videoUrl);

    if (!videoPath) {
      throw httpError(404, 'Video file not found');
    }

    let fileStats;
    try {
      fileStats = await fs.promises.stat(videoPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw httpError(404, 'Video file not found');
      }
      throw error;
    }

    const extension = path.extname(videoPath).toLowerCase();
    const contentType = allowedVideoTypes.get(extension) || 'application/octet-stream';
    const baseHeaders = {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    };
    const range = req.headers.range;

    if (!range) {
      res.status(200).set({ ...baseHeaders, 'Content-Length': fileStats.size });
      return fs.createReadStream(videoPath).pipe(res);
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (match[1] === '' && match[2] === '')) {
      return res.status(416)
        .set('Content-Range', `bytes */${fileStats.size}`)
        .end();
    }

    let start = match[1] === '' ? Math.max(fileStats.size - Number(match[2]), 0) : Number(match[1]);
    let end = match[2] === '' ? fileStats.size - 1 : Number(match[2]);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= fileStats.size) {
      return res.status(416)
        .set('Content-Range', `bytes */${fileStats.size}`)
        .end();
    }

    end = Math.min(end, fileStats.size - 1);
    const contentLength = end - start + 1;

    res.status(206).set({
      ...baseHeaders,
      'Content-Length': contentLength,
      'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
    });
    return fs.createReadStream(videoPath, { start, end }).pipe(res);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update course video metadata
// @route   PUT /api/courses/:courseId/videos/:videoId
// @access  Private course teacher
exports.updateCourseVideo = async (req, res, next) => {
  try {
    const course = await getCourse(req.params.courseId);
    assertCourseTeacher(course, req.user.id);
    const video = await getVideo(course._id, req.params.videoId);
    const fields = parseVideoFields(req.body, { partial: true });

    if (fields.title !== undefined) video.title = fields.title;
    if (fields.description !== undefined) video.description = fields.description;
    if (fields.order !== undefined) video.order = fields.order;
    await video.save();

    res.status(200).json({
      success: true,
      data: toVideoResponse(video, course._id.toString()),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete a course video
// @route   DELETE /api/courses/:courseId/videos/:videoId
// @access  Private course teacher
exports.deleteCourseVideo = async (req, res, next) => {
  try {
    const course = await getCourse(req.params.courseId);
    assertCourseTeacher(course, req.user.id);
    const video = await getVideo(course._id, req.params.videoId);
    const videoPath = getPrivateVideoPath(course._id.toString(), video.videoUrl);

    await CourseVideo.findByIdAndDelete(video._id);

    if (videoPath) {
      try {
        await fs.promises.unlink(videoPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Course video file cleanup failed: ${error.message}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Course video deleted successfully',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

exports.getPrivateVideoPath = getPrivateVideoPath;
exports.toVideoResponse = toVideoResponse;

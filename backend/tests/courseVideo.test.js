const test = require('node:test');
const assert = require('node:assert/strict');
const CourseVideo = require('../models/CourseVideo');
const {
  getPrivateVideoPath,
  toVideoResponse,
} = require('../controllers/courseVideoController');

const courseId = '507f1f77bcf86cd799439011';

test('CourseVideo validates required fields and non-negative order', () => {
  const missing = new CourseVideo().validateSync();
  assert.ok(missing.errors.course);
  assert.ok(missing.errors.title);
  assert.ok(missing.errors.videoUrl);

  const invalidOrder = new CourseVideo({
    course: courseId,
    title: 'Lesson',
    videoUrl: `${courseId}/video.mp4`,
    order: -1,
  }).validateSync();
  assert.ok(invalidOrder.errors.order);
});

test('private video paths are constrained to the course storage key', () => {
  const validPath = getPrivateVideoPath(courseId, `${courseId}/video.mp4`);
  assert.ok(validPath.endsWith(`course-videos${require('path').sep}${courseId}${require('path').sep}video.mp4`));
  assert.equal(getPrivateVideoPath(courseId, '../other/video.mp4'), null);
  assert.equal(getPrivateVideoPath(courseId, `${courseId}/../video.mp4`), null);
});

test('video responses expose a protected stream URL, not storage paths', () => {
  const response = toVideoResponse({
    _id: 'video-1',
    title: 'Lesson',
    description: 'Description',
    order: 2,
    videoUrl: `${courseId}/private.mp4`,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }, courseId);

  assert.equal(response.id, 'video-1');
  assert.equal(response.videoUrl, `/api/courses/${courseId}/videos/video-1/stream`);
  assert.equal(response.videoUrl.includes('private.mp4'), false);
});

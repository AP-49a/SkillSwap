const test = require('node:test');
const assert = require('node:assert/strict');

const { isValidGoogleMeetLink } = require('../utils/meetingLink');

test('accepts valid Google Meet URLs', () => {
  assert.equal(isValidGoogleMeetLink('https://meet.google.com/abc-defg-hij'), true);
  assert.equal(isValidGoogleMeetLink('https://meet.google.com/abc-defg-hij?authuser=0'), true);
});

test('rejects non-Google-Meet URLs and invalid strings', () => {
  assert.equal(isValidGoogleMeetLink('https://zoom.us/j/123456789'), false);
  assert.equal(isValidGoogleMeetLink('not-a-url'), false);
  assert.equal(isValidGoogleMeetLink(''), false);
});

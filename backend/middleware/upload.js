const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save file with unique timestamp hash prefix + original extension
    cb(null, `avatar-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const mimeByExtension = new Map([
    ['.jpeg', 'image/jpeg'], ['.jpg', 'image/jpeg'], ['.png', 'image/png'],
    ['.webp', 'image/webp'], ['.gif', 'image/gif'],
  ]);
  const extension = path.extname(file.originalname).toLowerCase();

  if (mimeByExtension.get(extension) === file.mimetype) {
    return cb(null, true);
  } else {
    const error = new Error('Image extension and type must match (JPEG, PNG, WEBP, or GIF).');
    error.statusCode = 400;
    cb(error);
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;

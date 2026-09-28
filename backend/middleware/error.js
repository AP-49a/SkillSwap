const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode;

  // Log to console for developer if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  // Multer Error handling
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new Error('File size exceeds the allowed limit.');
      error.statusCode = 413;
    } else {
      error = new Error(`File upload error: ${err.message}`);
      error.statusCode = 400;
    }
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = new Error('Invalid or expired authentication token');
    error.statusCode = 401;
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : (error.message || 'Server Error');

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;

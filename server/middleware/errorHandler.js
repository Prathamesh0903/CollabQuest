const errorHandler = (err, req, res, next) => {
  // Log error with context
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    user: req.user?.uid || 'anonymous',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Don't expose internal errors to client in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Handle specific error types
  let statusCode = err.status || err.statusCode || 500;
  let errorMessage = err.message || 'Internal server error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation error';
    errorCode = 'VALIDATION_ERROR';
  }

  // Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    errorMessage = 'Duplicate entry';
    errorCode = 'DUPLICATE_ERROR';
  }

  // Mongoose cast errors
  if (err.name === 'CastError') {
    statusCode = 400;
    errorMessage = 'Invalid ID format';
    errorCode = 'INVALID_ID';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorMessage = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }

  // JWT expired errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    statusCode = 503;
    errorMessage = 'Database connection error';
    errorCode = 'DATABASE_ERROR';
  }

  // Prepare response
  const response = {
    success: false,
    error: isDevelopment ? errorMessage : 'Internal server error',
    code: errorCode,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  // Add request ID for tracking
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  res.status(statusCode).json(response);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

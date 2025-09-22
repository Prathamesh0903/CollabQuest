const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// DSA Problem validation rules
const validateProblemId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid problem ID format'),
  handleValidationErrors
];

const validateProblemQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  handleValidationErrors
];

// DSA Submission validation rules
const validateSubmission = [
  body('problem_id')
    .isMongoId()
    .withMessage('Invalid problem ID format'),
  body('code')
    .isString()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Code must be between 1 and 50000 characters'),
  body('language')
    .isIn(['python', 'javascript', 'java', 'cpp'])
    .withMessage('Language must be python, javascript, java, or cpp'),
  handleValidationErrors
];

// DSA Progress validation rules
const validateProgressUpdate = [
  body('problemId')
    .isMongoId()
    .withMessage('Invalid problem ID format'),
  body('isCompleted')
    .isBoolean()
    .withMessage('isCompleted must be a boolean'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors
];

const validateProgressQuery = [
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  query('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit must be between 1 and 500'),
  handleValidationErrors
];

// User mapping validation
const validateUserMapping = (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!user.uid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user data: missing uid',
      code: 'INVALID_USER_DATA',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Database integrity checks
const checkDatabaseIntegrity = async (req, res, next) => {
  try {
    // Skip strict DB checks in test environment to reduce flakiness
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    const mongoose = require('mongoose');
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if required collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const requiredCollections = ['dsaproblems', 'dsausers', 'dsaprogress', 'dsasubmissions', 'usermappings'];
    const missingCollections = requiredCollections.filter(
      col => !collections.some(c => c.name === col)
    );
    
    if (missingCollections.length > 0) {
      console.warn('Missing collections:', missingCollections);
      // Don't fail the request, just log the warning
    }
    
    next();
  } catch (error) {
    console.error('Database integrity check failed:', error);
    return res.status(503).json({
      success: false,
      error: 'Database integrity check failed',
      code: 'DATABASE_INTEGRITY_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Rate limiting for specific endpoints
const createRateLimit = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Specific rate limits for DSA endpoints
const submissionRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 submissions per 15 minutes
  'Too many submissions. Please try again later.'
);

const progressRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  60, // 60 progress updates per minute
  'Too many progress updates. Please try again later.'
);

module.exports = {
  handleValidationErrors,
  validateProblemId,
  validateProblemQuery,
  validateSubmission,
  validateProgressUpdate,
  validateProgressQuery,
  validateUserMapping,
  checkDatabaseIntegrity,
  submissionRateLimit,
  progressRateLimit
};

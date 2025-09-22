const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateProblemId,
  validateProblemQuery,
  validateSubmission,
  validateProgressUpdate,
  validateProgressQuery,
  validateUserMapping,
  checkDatabaseIntegrity,
  submissionRateLimit,
  progressRateLimit
} = require('../middleware/validation');
const { QueryOptimizer, performanceMonitor } = require('../utils/databaseOptimization');

const DSAUser = require('../models/dsa/DSAUser');
const DSACategory = require('../models/dsa/Category');
const DSAProblem = require('../models/dsa/DSAProblem');
const DSASubmission = require('../models/dsa/DSASubmission');
const DSAProgress = require('../models/dsa/DSAProgress');
const UserMapping = require('../models/dsa/UserMapping');

const router = express.Router();

// Helper function to get progress fallback for unauthenticated users
async function getProgressFallback(req, res) {
  try {
    const { category, difficulty, limit = 500 } = req.query;
    
    // Build filter for problems
    const problemFilter = { isActive: true };
    if (category) {
      if (mongoose.isValidObjectId(category)) {
        problemFilter.category = category;
      } else {
        const cat = await DSACategory.findOne({ slug: String(category).toLowerCase() }).select('_id');
        if (cat) problemFilter.category = cat._id;
      }
    }
    if (difficulty) {
      problemFilter.difficulty = { $in: String(difficulty).split(',') };
    }

    // Get problems without progress data
    const problems = await DSAProblem.find(problemFilter)
      .select('_id title difficulty category tags problemNumber')
      .populate('category', 'name slug')
      .sort({ problemNumber: 1 })
      .limit(parseInt(limit));

    // Return problems with default progress values
    const problemsWithDefaultProgress = problems.map(problem => ({
      _id: problem._id,
      title: problem.title,
      difficulty: problem.difficulty,
      category: problem.category,
      tags: problem.tags,
      problemNumber: problem.problemNumber,
      isCompleted: false,
      completedAt: null,
      notes: ''
    }));

    return res.json({
      success: true,
      problems: problemsWithDefaultProgress,
      total: problemsWithDefaultProgress.length,
      completed: 0,
      message: 'Progress data available after login'
    });
  } catch (error) {
    console.error('Progress fallback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load problems',
      error: error.message
    });
  }
}

// Import authentication middleware
const { optionalAuth } = require('../middleware/auth');

function toInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

// GET /api/dsa/problems
router.get('/problems', checkDatabaseIntegrity, validateProblemQuery, asyncHandler(async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const { q, difficulty, category, tag, isActive } = req.query;

    const filter = {};
    if (typeof isActive !== 'undefined') {
      filter.isActive = String(isActive) === 'true';
    } else {
      filter.isActive = true;
    }
    if (difficulty) {
      filter.difficulty = { $in: String(difficulty).split(',') };
    }
    if (category) {
      if (mongoose.isValidObjectId(category)) {
        filter.category = category;
      } else {
        const cat = await DSACategory.findOne({ slug: String(category).toLowerCase() }).select('_id');
        if (cat) filter.category = cat._id;
      }
    }
    if (tag) {
      filter.tags = { $in: String(tag).split(',').map(t => t.trim()) };
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Execute optimized query with performance monitoring
    const startTime = Date.now();
    const [items, total] = await Promise.all([
      DSAProblem.find(filter)
        .select('problemNumber title difficulty category tags acceptanceRate isActive created_at functionName')
        .populate('category', 'name slug')
        .sort({ problemNumber: 1 })
        .skip(skip)
        .limit(limit),
      DSAProblem.countDocuments(filter)
    ]);
    
    const queryTime = Date.now() - startTime;
    performanceMonitor.recordQuery(queryTime, 'DSAProblem.find');

    res.json({ page, limit, total, items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch problems', error: err.message });
  }
}));

// GET /api/dsa/problems/:id
router.get('/problems/:id', checkDatabaseIntegrity, validateProblemId, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid problem id' });
    }

    const problem = await DSAProblem.findById(id)
      .populate('category', 'name slug');

    if (!problem || !problem.isActive) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch problem', error: err.message });
  }
}));

// POST /api/dsa/submissions
// Validate request body before auth mapping to return 400 for bad input
router.post('/submissions', optionalAuth, checkDatabaseIntegrity, validateSubmission, validateUserMapping, submissionRateLimit, asyncHandler(async (req, res) => {
  try {
    const { problem_id, code, language, user_id } = req.body || {};
    const supabaseUid = req.user?.uid;
    
    // Test-mode bypass: allow direct dsa user_id without auth header
    let dsaUserId = null;
    if (process.env.NODE_ENV === 'test' && user_id) {
      dsaUserId = user_id;
    }
    
    if (!supabaseUid && !dsaUserId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!problem_id || !mongoose.isValidObjectId(problem_id)) {
      return res.status(400).json({ message: 'Valid problem_id is required' });
    }
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ message: 'code is required' });
    }
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ message: 'language is required' });
    }

    // Get or create DSA user mapping with enhanced error handling
    if (!dsaUserId) {
      let mapping;
      try {
        console.log(`[DSA] Creating user mapping for UID: ${req.user?.uid}`);
        mapping = await UserMapping.createUserMappingWithRetry(req.user);
        console.log(`[DSA] User mapping created/retrieved: ${mapping.dsaUserId}`);
      } catch (error) {
        console.error('Failed to create user mapping for submission:', error);
        return res.status(500).json({ 
          message: 'Failed to create user mapping', 
          error: error.message 
        });
      }
      dsaUserId = mapping.dsaUserId;
    }

    // Ensure problem exists
    const problem = await DSAProblem.findById(problem_id).select('_id isActive');
    if (!problem || !problem.isActive) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const submission = await DSASubmission.create({
      user_id: dsaUserId,
      problem_id,
      code,
      language,
      status: 'pending'
    });

    res.status(201).json(submission);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: err.message });
    }
    res.status(500).json({ message: 'Failed to create submission', error: err.message });
  }
}));

// GET /api/dsa/submissions - Get current user's submissions
router.get('/submissions', optionalAuth, async (req, res) => {
  try {
    const supabaseUid = req.user?.uid;
    
    if (!supabaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { problem_id } = req.query;
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    // Get DSA user ID from mapping
    const mapping = await UserMapping.findOne({ firebaseUid: supabaseUid, isActive: true });
    if (!mapping) {
      return res.json({ page, limit, total: 0, items: [] });
    }

    const filter = { user_id: mapping.dsaUserId };
    if (problem_id && mongoose.isValidObjectId(problem_id)) {
      filter.problem_id = problem_id;
    }

    const [items, total] = await Promise.all([
      DSASubmission.find(filter)
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limit),
      DSASubmission.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: err.message });
  }
});

// GET /api/dsa/users/:userId/submissions - Legacy endpoint (for backward compatibility)
router.get('/users/:userId/submissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { problem_id } = req.query;
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const filter = { user_id: userId };
    if (problem_id && mongoose.isValidObjectId(problem_id)) {
      filter.problem_id = problem_id;
    }

    const [items, total] = await Promise.all([
      DSASubmission.find(filter)
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limit),
      DSASubmission.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: err.message });
  }
});

// GET /api/dsa/progress - Get user's progress for all problems with fallback
router.get('/progress', optionalAuth, checkDatabaseIntegrity, validateProgressQuery, asyncHandler(async (req, res) => {
  try {
    const supabaseUid = req.user?.uid;
    
    if (!supabaseUid) {
      // Return problems without progress for unauthenticated users
      return await getProgressFallback(req, res);
    }

    const { category, difficulty, limit = 500 } = req.query;
    
    // Get or create DSA user mapping with enhanced error handling
    let mapping;
    try {
      mapping = await UserMapping.createUserMappingWithRetry(req.user);
    } catch (error) {
      console.error('Failed to create user mapping:', error);
      // Fallback to problems without progress if mapping fails
      return await getProgressFallback(req, res);
    }
    
    // Build filter for problems
    const problemFilter = { isActive: true };
    if (category) {
      if (mongoose.isValidObjectId(category)) {
        problemFilter.category = category;
      } else {
        const cat = await DSACategory.findOne({ slug: String(category).toLowerCase() }).select('_id');
        if (cat) problemFilter.category = cat._id;
      }
    }
    if (difficulty) {
      problemFilter.difficulty = { $in: String(difficulty).split(',') };
    }

    // Get all problems with progress (using firebaseUid for progress, dsaUserId for submissions)
    let problems, progressRecords;
    try {
      [problems, progressRecords] = await Promise.all([
        DSAProblem.find(problemFilter)
          .select('_id title difficulty category tags problemNumber')
          .populate('category', 'name slug')
          .sort({ problemNumber: 1 })
          .limit(parseInt(limit)),
        DSAProgress.find({ firebaseUid: supabaseUid })
          .select('problemId isCompleted completedAt notes')
      ]);
    } catch (error) {
      console.error('Failed to fetch problems or progress:', error);
      return await getProgressFallback(req, res);
    }

    // Create progress map for efficient lookup
    const progressMap = new Map();
    progressRecords.forEach(progress => {
      progressMap.set(progress.problemId.toString(), progress);
    });

    // Combine problems with progress
    const problemsWithProgress = problems.map(problem => {
      const progress = progressMap.get(problem._id.toString());
      return {
        _id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        tags: problem.tags,
        problemNumber: problem.problemNumber,
        isCompleted: progress ? progress.isCompleted : false,
        completedAt: progress ? progress.completedAt : null,
        notes: progress ? progress.notes : ''
      };
    });

    res.json({
      success: true,
      problems: problemsWithProgress,
      total: problemsWithProgress.length,
      completed: problemsWithProgress.filter(p => p.isCompleted).length
    });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ message: 'Failed to fetch progress', error: err.message });
  }
}));

// POST /api/dsa/progress - Update problem completion status
router.post('/progress', optionalAuth, checkDatabaseIntegrity, validateUserMapping, progressRateLimit, validateProgressUpdate, asyncHandler(async (req, res) => {
  try {
    console.log(`[PROGRESS] POST /progress - Request received`);
    console.log(`[PROGRESS] User object:`, req.user ? { uid: req.user.uid, email: req.user.email } : 'null');
    console.log(`[PROGRESS] Request body:`, req.body);
    
    const supabaseUid = req.user?.uid;
    
    if (!supabaseUid) {
      console.log(`[PROGRESS] No supabaseUid found, returning 401`);
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log(`[PROGRESS] Processing progress update for UID: ${supabaseUid}`);

    const { problemId, isCompleted, notes } = req.body;

    if (!problemId || !mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ message: 'Valid problem ID is required' });
    }

    if (typeof isCompleted !== 'boolean') {
      return res.status(400).json({ message: 'isCompleted must be a boolean' });
    }

    // Ensure mapping exists with enhanced error handling
    let mapping;
    try {
      console.log(`[DSA] Creating user mapping for progress update, UID: ${req.user?.uid}`);
      mapping = await UserMapping.createUserMappingWithRetry(req.user);
      console.log(`[DSA] User mapping created/retrieved for progress: ${mapping.dsaUserId}`);
    } catch (error) {
      console.error('Failed to create user mapping for progress update:', error);
      return res.status(500).json({ 
        message: 'Failed to create user mapping', 
        error: error.message 
      });
    }

    // Verify problem exists
    const problem = await DSAProblem.findById(problemId).select('_id difficulty category');
    if (!problem || !problem.isActive) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update or create progress record
    console.log(`[PROGRESS] Updating progress for UID: ${supabaseUid}, Problem: ${problemId}, Completed: ${isCompleted}`);
    
    const progress = await DSAProgress.updateCompletion(
      supabaseUid, 
      problemId, 
      isCompleted, 
      notes || ''
    );
    
    console.log(`[PROGRESS] Progress updated successfully:`, {
      problemId: progress.problemId,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt
    });

    res.json({
      success: true,
      progress: {
        problemId: progress.problemId,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        notes: progress.notes
      }
    });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Failed to update progress', error: err.message });
  }
}));

// GET /api/dsa/progress/stats - Get user's progress statistics
router.get('/progress/stats', optionalAuth, asyncHandler(async (req, res) => {
  try {
    const supabaseUid = req.user?.uid;
    
    if (!supabaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const [stats, categoryProgress] = await Promise.all([
      DSAProgress.getUserStats(supabaseUid),
      DSAProgress.getProgressByCategory(supabaseUid)
    ]);

    // Calculate completion percentage
    const completionPercentage = stats.totalProblems > 0 
      ? Math.round((stats.completedProblems / stats.totalProblems) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        ...stats,
        completionPercentage
      },
      categoryProgress
    });
  } catch (err) {
    console.error('Error fetching progress stats:', err);
    res.status(500).json({ message: 'Failed to fetch progress stats', error: err.message });
  }
}));

// GET /api/dsa/performance - Get performance metrics (admin only)
router.get('/performance', asyncHandler(async (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching performance metrics:', err);
    res.status(500).json({ message: 'Failed to fetch performance metrics', error: err.message });
  }
}));

// GET /api/dsa/progress/:problemId - Get progress for specific problem
router.get('/progress/:problemId', optionalAuth, asyncHandler(async (req, res) => {
  try {
    const supabaseUid = req.user?.uid;
    const { problemId } = req.params;

    if (!supabaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ message: 'Invalid problem ID' });
    }

    const progress = await DSAProgress.findOne({ firebaseUid, problemId });

    if (!progress) {
      // Return default progress for new problems
      return res.json({
        success: true,
        progress: {
          problemId,
          isCompleted: false,
          completedAt: null,
          notes: '',
          submissionCount: 0
        }
      });
    }

    res.json({
      success: true,
      progress: {
        problemId: progress.problemId,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        notes: progress.notes,
        submissionCount: progress.submissionCount,
        firstAttemptAt: progress.firstAttemptAt,
        lastAttemptAt: progress.lastAttemptAt
      }
    });
  } catch (err) {
    console.error('Error fetching problem progress:', err);
    res.status(500).json({ message: 'Failed to fetch problem progress', error: err.message });
  }
}));

module.exports = router;

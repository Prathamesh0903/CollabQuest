const express = require('express');
const mongoose = require('mongoose');

const DSAUser = require('../models/dsa/DSAUser');
const DSACategory = require('../models/dsa/Category');
const DSAProblem = require('../models/dsa/DSAProblem');
const DSASubmission = require('../models/dsa/DSASubmission');
const DSAProgress = require('../models/dsa/DSAProgress');
const UserMapping = require('../models/dsa/UserMapping');

const router = express.Router();

// Import authentication middleware
const { optionalAuth } = require('../middleware/auth');

function toInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

// GET /api/dsa/problems
router.get('/problems', async (req, res) => {
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

    const [items, total] = await Promise.all([
          DSAProblem.find(filter)
      .select('problemNumber title difficulty category tags acceptanceRate isActive created_at functionName')
      .populate('category', 'name slug')
      .sort({ problemNumber: 1 })
      .skip(skip)
      .limit(limit),
      DSAProblem.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch problems', error: err.message });
  }
});

// GET /api/dsa/problems/:id
router.get('/problems/:id', async (req, res) => {
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
});

// POST /api/dsa/submissions
router.post('/submissions', optionalAuth, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { problem_id, code, language } = req.body || {};

    if (!problem_id || !mongoose.isValidObjectId(problem_id)) {
      return res.status(400).json({ message: 'Valid problem_id is required' });
    }
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ message: 'code is required' });
    }
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ message: 'language is required' });
    }

    // Get or create DSA user mapping for Firebase user
    const mapping = await UserMapping.findOne({ firebaseUid, isActive: true });
    let dsaUserId;
    
    if (mapping) {
      dsaUserId = mapping.dsaUserId;
    } else {
      // Create new DSA user and mapping
      const firebaseUser = req.user;
      const dsaUser = new DSAUser({
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        email: firebaseUser.email,
        hashed_password: 'firebase_authenticated_' + firebaseUid // Placeholder
      });
      await dsaUser.save();
      
      // Create mapping
      await UserMapping.create({
        firebaseUid,
        dsaUserId: dsaUser._id,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
      
      dsaUserId = dsaUser._id;
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
});

// GET /api/dsa/submissions - Get current user's submissions
router.get('/submissions', optionalAuth, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { problem_id } = req.query;
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    // Get DSA user ID from mapping
    const mapping = await UserMapping.findOne({ firebaseUid, isActive: true });
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

// GET /api/dsa/progress - Get user's progress for all problems
router.get('/progress', optionalAuth, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { category, difficulty, limit = 500 } = req.query;
    
    // Get or create DSA user mapping
    const mapping = await UserMapping.findOne({ firebaseUid, isActive: true });
    let dsaUserId;
    
    if (mapping) {
      dsaUserId = mapping.dsaUserId;
    } else {
      // Create new DSA user and mapping if doesn't exist
      const firebaseUser = req.user;
      const dsaUser = new DSAUser({
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        email: firebaseUser.email,
        hashed_password: 'firebase_authenticated_' + firebaseUid
      });
      await dsaUser.save();
      
      await UserMapping.create({
        firebaseUid,
        dsaUserId: dsaUser._id,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
      
      dsaUserId = dsaUser._id;
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
    const [problems, progressRecords] = await Promise.all([
      DSAProblem.find(problemFilter)
        .select('_id title difficulty category tags problemNumber')
        .populate('category', 'name slug')
        .sort({ problemNumber: 1 })
        .limit(parseInt(limit)),
      DSAProgress.find({ firebaseUid })
        .select('problemId isCompleted completedAt notes')
    ]);

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
});

// POST /api/dsa/progress - Update problem completion status
router.post('/progress', optionalAuth, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { problemId, isCompleted, notes } = req.body;

    if (!problemId || !mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ message: 'Valid problem ID is required' });
    }

    if (typeof isCompleted !== 'boolean') {
      return res.status(400).json({ message: 'isCompleted must be a boolean' });
    }

    // Ensure mapping exists
    const mapping = await UserMapping.findOne({ firebaseUid, isActive: true });
    if (!mapping) {
      // Create new DSA user and mapping if doesn't exist
      const firebaseUser = req.user;
      const dsaUser = new DSAUser({
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        email: firebaseUser.email,
        hashed_password: 'firebase_authenticated_' + firebaseUid
      });
      await dsaUser.save();
      
      await UserMapping.create({
        firebaseUid,
        dsaUserId: dsaUser._id,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
    }

    // Verify problem exists
    const problem = await DSAProblem.findById(problemId).select('_id difficulty category');
    if (!problem || !problem.isActive) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update or create progress record
    const progress = await DSAProgress.updateCompletion(
      firebaseUid, 
      problemId, 
      isCompleted, 
      notes || ''
    );

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
});

// GET /api/dsa/progress/stats - Get user's progress statistics
router.get('/progress/stats', optionalAuth, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const [stats, categoryProgress] = await Promise.all([
      DSAProgress.getUserStats(firebaseUid),
      DSAProgress.getProgressByCategory(firebaseUid)
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
});

// GET /api/dsa/progress/:problemId - Get progress for specific problem
router.get('/progress/:problemId', optionalAuth, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const { problemId } = req.params;

    if (!firebaseUid) {
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
});

module.exports = router;

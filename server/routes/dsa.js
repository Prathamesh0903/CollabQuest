const express = require('express');
const mongoose = require('mongoose');

const DSAUser = require('../models/dsa/DSAUser');
const DSACategory = require('../models/dsa/Category');
const DSAProblem = require('../models/dsa/Problem');
const DSASubmission = require('../models/dsa/Submission');

const router = express.Router();

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
router.post('/submissions', async (req, res) => {
  try {
    const { user_id, problem_id, code, language } = req.body || {};

    if (!user_id || !mongoose.isValidObjectId(user_id)) {
      return res.status(400).json({ message: 'Valid user_id is required' });
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

    // Ensure user and problem exist
    const [user, problem] = await Promise.all([
      DSAUser.findById(user_id).select('_id'),
      DSAProblem.findById(problem_id).select('_id isActive')
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!problem || !problem.isActive) return res.status(404).json({ message: 'Problem not found' });

    const submission = await DSASubmission.create({
      user_id,
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

// GET /api/dsa/users/:userId/submissions
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

module.exports = router;

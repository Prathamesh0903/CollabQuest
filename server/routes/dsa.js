const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');

/**
 * @route   GET /api/dsa/problems
 * @desc    Get all problems with filtering and pagination
 * @access  Public
 */
router.get('/problems', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Build query
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const problems = await Problem.find(query)
      .select('title slug difficulty category tags acceptanceRate totalSubmissions description')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Problem.countDocuments(query);

    res.json({
      success: true,
      problems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProblems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems'
    });
  }
});

/**
 * @route   GET /api/dsa/problems/:slug
 * @desc    Get problem by slug
 * @access  Public
 */
router.get('/problems/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await Problem.findOne({ slug, isActive: true })
      .select('-solution'); // Don't send solution to client

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      problem
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
});

/**
 * @route   GET /api/dsa/problems/:slug/solution
 * @desc    Get problem solution (requires authentication)
 * @access  Private
 */
router.get('/problems/:slug/solution', auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { language = 'javascript' } = req.query;
    
    const problem = await Problem.findOne({ slug, isActive: true })
      .select(`solution.${language}`);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      solution: problem.solution[language] || null
    });
  } catch (error) {
    console.error('Error fetching solution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch solution'
    });
  }
});

/**
 * @route   POST /api/dsa/problems/:slug/submit
 * @desc    Submit solution for a problem
 * @access  Private
 */
router.post('/problems/:slug/submit', auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { code, language, isPractice = true } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    // Find the problem
    const problem = await Problem.findOne({ slug, isActive: true });
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Create submission
    const submission = new Submission({
      user: req.user._id,
      problem: problem._id,
      language,
      code,
      isPractice,
      status: 'pending'
    });

    await submission.save();

    // TODO: Integrate with existing code execution service
    // For now, return a mock response
    const mockResults = problem.testCases.map((testCase, index) => ({
      testCaseId: testCase._id,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: `Mock output ${index + 1}`,
      isPassed: Math.random() > 0.3, // Mock pass/fail
      executionTime: Math.floor(Math.random() * 100) + 10,
      memoryUsed: Math.floor(Math.random() * 50) + 5
    }));

    // Update submission with results
    await submission.updateTestResults(mockResults);

    // Update problem statistics
    const isSuccessful = submission.status === 'accepted';
    await problem.updateSubmissionStats(isSuccessful);

    res.json({
      success: true,
      submission: {
        id: submission._id,
        status: submission.status,
        score: submission.score,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        testResults: submission.testResults,
        submittedAt: submission.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit solution'
    });
  }
});

/**
 * @route   GET /api/dsa/problems/:slug/submissions
 * @desc    Get user's submissions for a problem
 * @access  Private
 */
router.get('/problems/:slug/submissions', auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 10 } = req.query;

    const problem = await Problem.findOne({ slug, isActive: true });
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    const submissions = await Submission.getUserSubmissions(
      req.user._id,
      problem._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
});

/**
 * @route   GET /api/dsa/categories
 * @desc    Get all problem categories with counts
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          difficulties: {
            $push: '$difficulty'
          }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          easy: {
            $size: {
              $filter: {
                input: '$difficulties',
                cond: { $eq: ['$$this', 'Easy'] }
              }
            }
          },
          medium: {
            $size: {
              $filter: {
                input: '$difficulties',
                cond: { $eq: ['$$this', 'Medium'] }
              }
            }
          },
          hard: {
            $size: {
              $filter: {
                input: '$difficulties',
                cond: { $eq: ['$$this', 'Hard'] }
              }
            }
          }
        }
      },
      { $sort: { category: 1 } }
    ]);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   GET /api/dsa/user/progress
 * @desc    Get user's DSA progress
 * @access  Private
 */
router.get('/user/progress', auth, async (req, res) => {
  try {
    // Get user's submission statistics
    const [submissionStats] = await Submission.getUserStats(req.user._id);

    // Get problems by category that user has solved
    const solvedProblems = await Submission.aggregate([
      { $match: { user: req.user._id, status: 'accepted' } },
      {
        $lookup: {
          from: 'problems',
          localField: 'problem',
          foreignField: '_id',
          as: 'problem'
        }
      },
      { $unwind: '$problem' },
      {
        $group: {
          _id: '$problem.category',
          solved: { $sum: 1 },
          problems: { $addToSet: '$problem._id' }
        }
      }
    ]);

    // Get total problems by category
    const totalProblems = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 }
        }
      }
    ]);

    // Combine the data
    const progress = totalProblems.map(cat => {
      const solved = solvedProblems.find(s => s._id === cat._id);
      return {
        category: cat._id,
        total: cat.total,
        solved: solved ? solved.solved : 0,
        percentage: Math.round(((solved ? solved.solved : 0) / cat.total) * 100)
      };
    });

    res.json({
      success: true,
      progress,
      stats: submissionStats || {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        averageExecutionTime: 0,
        averageMemoryUsed: 0,
        languagesUsed: []
      }
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user progress'
    });
  }
});

/**
 * @route   GET /api/dsa/user/submissions
 * @desc    Get user's recent submissions
 * @access  Private
 */
router.get('/user/submissions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ user: req.user._id })
      .populate('problem', 'title slug difficulty category')
      .select('language status executionTime memoryUsed score submittedAt')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      submissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSubmissions: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user submissions'
    });
  }
});

module.exports = router;

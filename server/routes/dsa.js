const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const mongoose = require('mongoose'); // Added for mongoose.connection.readyState

// Mock data for when MongoDB is not connected
const mockCategories = [
  {
    category: 'Arrays',
    count: 15,
    easy: 8,
    medium: 5,
    hard: 2
  },
  {
    category: 'Strings',
    count: 12,
    easy: 6,
    medium: 4,
    hard: 2
  },
  {
    category: 'Linked Lists',
    count: 8,
    easy: 4,
    medium: 3,
    hard: 1
  },
  {
    category: 'Trees',
    count: 10,
    easy: 5,
    medium: 3,
    hard: 2
  },
  {
    category: 'Dynamic Programming',
    count: 20,
    easy: 6,
    medium: 10,
    hard: 4
  },
  {
    category: 'Graphs',
    count: 12,
    easy: 4,
    medium: 6,
    hard: 2
  }
];

const mockProblems = [
  {
    _id: '1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['Array', 'Hash Table'],
    description: 'Find two numbers that add up to a target',
    acceptanceRate: 85,
    totalSubmissions: 1500
  },
  {
    _id: '2',
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['String', 'Hash Table', 'Sorting'],
    description: 'Check if two strings are anagrams',
    acceptanceRate: 78,
    totalSubmissions: 1200
  },
  {
    _id: '3',
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    category: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    description: 'Find the contiguous subarray with maximum sum',
    acceptanceRate: 65,
    totalSubmissions: 800
  },
  {
    _id: '4',
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    category: 'Linked Lists',
    tags: ['Linked List', 'Recursion'],
    description: 'Reverse a singly linked list',
    acceptanceRate: 82,
    totalSubmissions: 950
  },
  {
    _id: '5',
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    tags: ['Dynamic Programming', 'Math'],
    description: 'Find ways to climb n stairs',
    acceptanceRate: 70,
    totalSubmissions: 1100
  }
];

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

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Use mock data when MongoDB is not connected
      let filteredProblems = [...mockProblems];
      
      if (category) {
        filteredProblems = filteredProblems.filter(p => p.category === category);
      }
      
      if (difficulty) {
        filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProblems = filteredProblems.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          p.category.toLowerCase().includes(searchLower)
        );
      }
      
      const skip = (page - 1) * limit;
      const paginatedProblems = filteredProblems.slice(skip, skip + parseInt(limit));
      
      return res.json({
        success: true,
        problems: paginatedProblems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredProblems.length / limit),
          totalProblems: filteredProblems.length,
          hasNext: page * limit < filteredProblems.length,
          hasPrev: page > 1
        }
      });
    }

    // Original MongoDB logic
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
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Use mock data when MongoDB is not connected
      const mockProblem = mockProblems.find(p => p.slug === slug);
      if (!mockProblem) {
        return res.status(404).json({
          success: false,
          error: 'Problem not found'
        });
      }
      
      return res.json({
        success: true,
        problem: {
          ...mockProblem,
          problemStatement: `This is a sample problem statement for ${mockProblem.title}.`,
          examples: [
            {
              input: 'Sample input',
              output: 'Sample output',
              explanation: 'Sample explanation'
            }
          ],
          constraints: 'Sample constraints',
          starterCode: {
            javascript: '// Your code here',
            python: '# Your code here',
            java: '// Your code here',
            cpp: '// Your code here'
          }
        }
      });
    }

    // Original MongoDB logic
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
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock solution when MongoDB is not connected
      return res.json({
        success: true,
        solution: `// Mock solution for ${slug} in ${language}\n// This is a placeholder solution.`
      });
    }

    // Original MongoDB logic
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

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock submission result when MongoDB is not connected
      const mockResults = [
        {
          testCaseId: '1',
          input: 'Sample input',
          expectedOutput: 'Sample output',
          actualOutput: 'Sample output',
          isPassed: true,
          executionTime: Math.floor(Math.random() * 100) + 10,
          memoryUsed: Math.floor(Math.random() * 50) + 5
        }
      ];
      
      return res.json({
        success: true,
        submission: {
          id: 'mock-submission-id',
          status: 'accepted',
          score: 100,
          executionTime: 45,
          memoryUsed: 12,
          testResults: mockResults,
          submittedAt: new Date()
        }
      });
    }

    // Original MongoDB logic
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

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock submissions when MongoDB is not connected
      const mockSubmissions = [
        {
          _id: '1',
          language: 'javascript',
          status: 'accepted',
          executionTime: 45,
          memoryUsed: 12,
          score: 100,
          submittedAt: new Date()
        }
      ];
      
      return res.json({
        success: true,
        submissions: mockSubmissions
      });
    }

    // Original MongoDB logic
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
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock categories when MongoDB is not connected
      return res.json({
        success: true,
        categories: mockCategories
      });
    }

    // Original MongoDB logic
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
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock progress when MongoDB is not connected
      const mockProgress = mockCategories.map(cat => ({
        category: cat.category,
        total: cat.count,
        solved: Math.floor(Math.random() * cat.count),
        percentage: Math.floor(Math.random() * 100)
      }));
      
      return res.json({
        success: true,
        progress: mockProgress,
        stats: {
          totalSubmissions: 25,
          acceptedSubmissions: 18,
          averageExecutionTime: 45,
          averageMemoryUsed: 12,
          languagesUsed: ['javascript', 'python']
        }
      });
    }

    // Original MongoDB logic
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

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock submissions when MongoDB is not connected
      const mockSubmissions = [
        {
          _id: '1',
          language: 'javascript',
          status: 'accepted',
          executionTime: 45,
          memoryUsed: 12,
          score: 100,
          submittedAt: new Date(),
          problem: {
            title: 'Two Sum',
            slug: 'two-sum',
            difficulty: 'Easy',
            category: 'Arrays'
          }
        }
      ];
      
      return res.json({
        success: true,
        submissions: mockSubmissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalSubmissions: 1,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Original MongoDB logic
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

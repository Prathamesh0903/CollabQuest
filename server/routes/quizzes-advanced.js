const express = require('express');
const { auth } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateQuiz = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid difficulty level'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.question').trim().notEmpty().withMessage('Question text is required'),
  body('questions.*.type').isIn(['multiple-choice', 'true-false', 'fill-blank', 'coding', 'matching', 'essay']).withMessage('Invalid question type'),
  body('questions.*.points').isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
  body('questions.*.timeLimit').isInt({ min: 5, max: 300 }).withMessage('Time limit must be between 5 and 300 seconds'),
  body('questions.*.difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid question difficulty'),
  body('settings.timeLimit').optional().isInt({ min: 0 }).withMessage('Time limit must be a positive number'),
  body('settings.maxAttempts').optional().isInt({ min: 1, max: 10 }).withMessage('Max attempts must be between 1 and 10')
];

// @route   GET /api/advanced-quizzes
// @desc    Get all quizzes with advanced filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      difficulty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'published'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { status, 'availability.isActive': true };

    // Apply filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'displayName avatar email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Quiz.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Calculate statistics
    const stats = await Quiz.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          avgQuestions: { $avg: { $size: '$questions' } },
          avgScore: { $avg: '$stats.averageScore' },
          totalAttempts: { $sum: '$stats.totalAttempts' }
        }
      }
    ]);

    res.json({
      success: true,
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      },
      stats: stats[0] || {
        totalQuizzes: 0,
        avgQuestions: 0,
        avgScore: 0,
        totalAttempts: 0
      }
    });
  } catch (error) {
    console.error('Get advanced quizzes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quizzes',
      message: error.message
    });
  }
});

// @route   GET /api/advanced-quizzes/:id
// @desc    Get quiz by ID with detailed information
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'displayName avatar email')
      .populate('teamId', 'name description')
      .populate('roomId', 'name description');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check if user has access to this quiz
    if (!quiz.settings.isPublic && quiz.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Add user-specific data
    const userAttempts = await Quiz.aggregate([
      { $match: { _id: quiz._id } },
      { $unwind: '$attempts' },
      { $match: { 'attempts.userId': req.user._id } },
      { $sort: { 'attempts.completedAt': -1 } },
      { $limit: 1 }
    ]);

    const userBestScore = userAttempts.length > 0 ? userAttempts[0].attempts.score : 0;
    const userAttemptsCount = userAttempts.length;

    res.json({
      success: true,
      quiz: {
        ...quiz.toObject(),
        userStats: {
          bestScore: userBestScore,
          attemptsCount: userAttemptsCount,
          canRetake: quiz.settings.allowRetakes && userAttemptsCount < quiz.settings.maxAttempts
        }
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quiz',
      message: error.message
    });
  }
});

// @route   POST /api/advanced-quizzes
// @desc    Create a new advanced quiz
// @access  Private
router.post('/', auth, validateQuiz, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      difficulty,
      questions,
      settings,
      tags,
      teamId,
      roomId,
      availability
    } = req.body;

    // Calculate total points and estimated duration
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = questions.reduce((sum, q) => sum + q.timeLimit, 0);

    const quiz = new Quiz({
      title,
      description,
      category,
      difficulty,
      questions,
      settings: {
        isPublic: settings?.isPublic ?? true,
        allowRetakes: settings?.allowRetakes ?? true,
        maxAttempts: settings?.maxAttempts ?? 3,
        showResults: settings?.showResults ?? true,
        showCorrectAnswers: settings?.showCorrectAnswers ?? true,
        randomizeQuestions: settings?.randomizeQuestions ?? false,
        adaptiveDifficulty: settings?.adaptiveDifficulty ?? false,
        multiplayer: settings?.multiplayer ?? false,
        timeLimit: settings?.timeLimit ?? 0
      },
      tags: tags || [],
      teamId: teamId || null,
      roomId: roomId || null,
      availability: {
        startDate: availability?.startDate || null,
        endDate: availability?.endDate || null,
        isActive: availability?.isActive ?? true
      },
      createdBy: req.user._id,
      totalPoints,
      estimatedDuration
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      quiz,
      message: 'Quiz created successfully'
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quiz',
      message: error.message
    });
  }
});

// @route   PUT /api/advanced-quizzes/:id
// @desc    Update an existing quiz
// @access  Private
router.put('/:id', auth, validateQuiz, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Don't allow updates if quiz is published and has attempts
    if (quiz.status === 'published' && quiz.stats.totalAttempts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update published quiz with attempts'
      });
    }

    const {
      title,
      description,
      category,
      difficulty,
      questions,
      settings,
      tags,
      teamId,
      roomId,
      availability
    } = req.body;

    // Calculate new totals
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = questions.reduce((sum, q) => sum + q.timeLimit, 0);

    // Update quiz
    Object.assign(quiz, {
      title,
      description,
      category,
      difficulty,
      questions,
      settings: {
        ...quiz.settings,
        ...settings
      },
      tags: tags || [],
      teamId: teamId || null,
      roomId: roomId || null,
      availability: {
        ...quiz.availability,
        ...availability
      },
      totalPoints,
      estimatedDuration
    });

    await quiz.save();

    res.json({
      success: true,
      quiz,
      message: 'Quiz updated successfully'
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quiz',
      message: error.message
    });
  }
});

// @route   DELETE /api/advanced-quizzes/:id
// @desc    Delete a quiz
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check ownership
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Soft delete by archiving
    quiz.status = 'archived';
    quiz.availability.isActive = false;
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz archived successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quiz',
      message: error.message
    });
  }
});

// @route   POST /api/advanced-quizzes/:id/start
// @desc    Start a quiz session
// @access  Private
router.post('/:id/start', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check availability
    if (!quiz.availability.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Quiz is not available'
      });
    }

    if (quiz.availability.startDate && new Date() < quiz.availability.startDate) {
      return res.status(400).json({
        success: false,
        error: 'Quiz has not started yet'
      });
    }

    if (quiz.availability.endDate && new Date() > quiz.availability.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Quiz has ended'
      });
    }

    // Check attempt limits
    const userAttempts = quiz.attempts?.filter(a => a.userId.toString() === req.user._id.toString()) || [];
    if (userAttempts.length >= quiz.settings.maxAttempts) {
      return res.status(400).json({
        success: false,
        error: 'Maximum attempts reached'
      });
    }

    // Create session
    const sessionId = require('crypto').randomUUID();
    const session = {
      sessionId,
      userId: req.user._id,
      startedAt: new Date(),
      status: 'active',
      currentQuestion: 0,
      answers: [],
      timeRemaining: quiz.settings.timeLimit * 60 || null
    };

    // Add session to quiz if not exists
    if (!quiz.sessions) quiz.sessions = [];
    quiz.sessions.push(session);
    await quiz.save();

    // Prepare quiz data for client
    const quizData = {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      questions: quiz.settings.randomizeQuestions ? 
        quiz.questions.sort(() => Math.random() - 0.5) : 
        quiz.questions,
      timeLimit: quiz.settings.timeLimit * 60,
      totalPoints: quiz.totalPoints,
      settings: quiz.settings,
      sessionId
    };

    res.json({
      success: true,
      quiz: quizData,
      session: session
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start quiz',
      message: error.message
    });
  }
});

// @route   POST /api/advanced-quizzes/:id/submit
// @desc    Submit quiz answers and get results
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { sessionId, answers, timeSpent } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Find session
    const session = quiz.sessions?.find(s => s.sessionId === sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Calculate results
    let correctAnswers = 0;
    let totalPoints = 0;
    const detailedResults = [];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = quiz.questions[i];
      let isCorrect = false;
      let points = 0;

      // Check answer based on question type
      switch (question.type) {
        case 'multiple-choice':
          isCorrect = answer.answer === question.correctAnswer;
          break;
        case 'true-false':
          isCorrect = answer.answer === question.correctAnswer;
          break;
        case 'fill-blank':
          isCorrect = answer.answer.toString().toLowerCase() === question.correctAnswer.toString().toLowerCase();
          break;
        case 'matching':
          isCorrect = JSON.stringify(answer.answer) === JSON.stringify(question.correctAnswer);
          break;
        case 'coding':
          // For coding questions, check if all test cases pass
          isCorrect = answer.testResults?.every(result => result.passed) || false;
          break;
        default:
          isCorrect = false;
      }

      if (isCorrect) {
        correctAnswers++;
        points = question.points;
        totalPoints += points;
      }

      detailedResults.push({
        questionId: question._id,
        question: question.question,
        userAnswer: answer.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        timeSpent: answer.timeSpent,
        explanation: question.explanation
      });
    }

    const accuracy = (correctAnswers / quiz.questions.length) * 100;
    const averageTime = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length;

    // Update session
    session.status = 'completed';
    session.completedAt = new Date();
    session.answers = answers;
    session.results = {
      correctAnswers,
      totalQuestions: quiz.questions.length,
      accuracy,
      totalPoints,
      earnedPoints: totalPoints,
      averageTime,
      timeSpent
    };

    // Create attempt record
    const attempt = {
      userId: req.user._id,
      sessionId,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      score: totalPoints,
      accuracy,
      timeSpent,
      answers: detailedResults
    };

    if (!quiz.attempts) quiz.attempts = [];
    quiz.attempts.push(attempt);

    // Update quiz statistics
    quiz.stats.totalAttempts++;
    quiz.stats.totalParticipants++;
    
    const totalScore = quiz.stats.averageScore * (quiz.stats.totalParticipants - 1) + totalPoints;
    quiz.stats.averageScore = totalScore / quiz.stats.totalParticipants;
    
    const totalTime = quiz.stats.averageTime * (quiz.stats.totalParticipants - 1) + timeSpent;
    quiz.stats.averageTime = totalTime / quiz.stats.totalParticipants;
    
    quiz.stats.completionRate = (quiz.stats.totalParticipants / quiz.stats.totalAttempts) * 100;

    await quiz.save();

    res.json({
      success: true,
      results: {
        correctAnswers,
        totalQuestions: quiz.questions.length,
        accuracy,
        totalPoints: quiz.totalPoints,
        earnedPoints: totalPoints,
        averageTime,
        timeSpent,
        detailedResults: quiz.settings.showCorrectAnswers ? detailedResults : undefined
      },
      session: session
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz',
      message: error.message
    });
  }
});

// @route   GET /api/advanced-quizzes/:id/leaderboard
// @desc    Get quiz leaderboard
// @access  Private
router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Get leaderboard data
    const leaderboard = await Quiz.aggregate([
      { $match: { _id: quiz._id } },
      { $unwind: '$attempts' },
      {
        $lookup: {
          from: 'users',
          localField: 'attempts.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$attempts.userId',
          username: { $first: '$user.displayName' },
          avatar: { $first: '$user.avatar' },
          bestScore: { $max: '$attempts.score' },
          bestAccuracy: { $max: '$attempts.accuracy' },
          attemptsCount: { $sum: 1 },
          lastAttempt: { $max: '$attempts.completedAt' }
        }
      },
      { $sort: { bestScore: -1, bestAccuracy: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await Quiz.aggregate([
      { $match: { _id: quiz._id } },
      { $unwind: '$attempts' },
      { $group: { _id: '$attempts.userId' } },
      { $count: 'total' }
    ]);

    const totalParticipants = total[0]?.total || 0;
    const totalPages = Math.ceil(totalParticipants / limit);

    res.json({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        ...entry,
        rank: skip + index + 1
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalParticipants,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
});

// @route   GET /api/advanced-quizzes/:id/analytics
// @desc    Get detailed quiz analytics
// @access  Private
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check access
    if (!quiz.settings.isPublic && quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Calculate analytics
    const analytics = await Quiz.aggregate([
      { $match: { _id: quiz._id } },
      { $unwind: '$attempts' },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          uniqueParticipants: { $addToSet: '$attempts.userId' },
          avgScore: { $avg: '$attempts.score' },
          avgAccuracy: { $avg: '$attempts.accuracy' },
          avgTimeSpent: { $avg: '$attempts.timeSpent' },
          maxScore: { $max: '$attempts.score' },
          minScore: { $min: '$attempts.score' },
          completionRate: { $avg: { $cond: [{ $gt: ['$attempts.completedAt', null] }, 1, 0] } }
        }
      }
    ]);

    // Question-level analytics
    const questionAnalytics = await Quiz.aggregate([
      { $match: { _id: quiz._id } },
      { $unwind: '$attempts' },
      { $unwind: '$attempts.answers' },
      {
        $group: {
          _id: '$attempts.answers.questionId',
          question: { $first: '$attempts.answers.question' },
          correctAnswers: { $sum: { $cond: ['$attempts.answers.isCorrect', 1, 0] } },
          totalAnswers: { $sum: 1 },
          avgTimeSpent: { $avg: '$attempts.answers.timeSpent' }
        }
      },
      {
        $addFields: {
          accuracy: { $multiply: [{ $divide: ['$correctAnswers', '$totalAnswers'] }, 100] }
        }
      }
    ]);

    // Time distribution
    const timeDistribution = await Quiz.aggregate([
      { $match: { _id: quiz._id } },
      { $unwind: '$attempts' },
      {
        $bucket: {
          groupBy: '$attempts.timeSpent',
          boundaries: [0, 300, 600, 900, 1200, 1800, 3600],
          default: '3600+',
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: '$attempts.score' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        overview: analytics[0] || {
          totalAttempts: 0,
          uniqueParticipants: 0,
          avgScore: 0,
          avgAccuracy: 0,
          avgTimeSpent: 0,
          maxScore: 0,
          minScore: 0,
          completionRate: 0
        },
        questionAnalytics,
        timeDistribution,
        quizStats: quiz.stats
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

// @route   POST /api/advanced-quizzes/:id/publish
// @desc    Publish a quiz
// @access  Private
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await quiz.publish();

    res.json({
      success: true,
      message: 'Quiz published successfully',
      quiz
    });
  } catch (error) {
    console.error('Publish quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish quiz',
      message: error.message
    });
  }
});

module.exports = router;



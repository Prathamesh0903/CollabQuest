const express = require('express');
const { auth } = require('../middleware/auth');
const Quiz = require('../models/Quiz');

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get all quizzes for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      $or: [
        { createdBy: req.user._id },
        { 'settings.isPublic': true }
      ]
    }).populate('createdBy', 'displayName email');

    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get quizzes',
      message: error.message 
    });
  }
});

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, questions, isPublic = false } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and questions are required' 
      });
    }

    const quiz = new Quiz({
      title,
      description,
      questions,
      settings: {
        isPublic: isPublic
      },
      createdBy: req.user._id
    });

    await quiz.save();

    res.status(201).json({
      success: true,
      quiz
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

module.exports = router; 
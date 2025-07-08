const express = require('express');
const { auth } = require('../middleware/auth');
const Leaderboard = require('../models/Leaderboard');

const router = express.Router();

// @route   GET /api/leaderboards
// @desc    Get leaderboards
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find()
      .populate('entries.userId', 'displayName email avatar')
      .sort({ 'entries.score': -1 })
      .limit(10);

    res.json({
      success: true,
      leaderboards
    });
  } catch (error) {
    console.error('Get leaderboards error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get leaderboards',
      message: error.message 
    });
  }
});

// @route   POST /api/leaderboards/score
// @desc    Submit a score to leaderboard
// @access  Private
router.post('/score', auth, async (req, res) => {
  try {
    const { category, score, details } = req.body;

    if (!category || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category and score are required' 
      });
    }

    let leaderboard = await Leaderboard.findOne({ category });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        category,
        entries: []
      });
    }

    // Check if user already has an entry
    const existingEntryIndex = leaderboard.entries.findIndex(
      entry => entry.userId.toString() === req.user._id.toString()
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry if new score is higher
      if (score > leaderboard.entries[existingEntryIndex].score) {
        leaderboard.entries[existingEntryIndex].score = score;
        leaderboard.entries[existingEntryIndex].details = details;
        leaderboard.entries[existingEntryIndex].updatedAt = new Date();
      }
    } else {
      // Add new entry
      leaderboard.entries.push({
        userId: req.user._id,
        score,
        details,
        submittedAt: new Date()
      });
    }

    // Sort entries by score (descending)
    leaderboard.entries.sort((a, b) => b.score - a.score);

    await leaderboard.save();

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit score',
      message: error.message 
    });
  }
});

module.exports = router; 
const express = require('express');
const { auth } = require('../middleware/auth');
const Team = require('../models/Team');

const router = express.Router();

// @route   GET /api/teams
// @desc    Get all teams for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      'members.userId': req.user._id
    }).populate('members.userId', 'displayName email avatar');

    res.json({
      success: true,
      teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get teams',
      message: error.message 
    });
  }
});

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team name is required' 
      });
    }

    const team = new Team({
      name,
      description,
      leaderId: req.user._id,
      members: [{ userId: req.user._id, role: 'leader', joinedAt: new Date() }]
    });

    await team.save();

    res.status(201).json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create team',
      message: error.message 
    });
  }
});

module.exports = router; 
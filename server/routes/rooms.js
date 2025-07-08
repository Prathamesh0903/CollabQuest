const express = require('express');
const { auth } = require('../middleware/auth');
const Room = require('../models/Room');
const { executeCode } = require('../utils/codeExecutor');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      'participants.userId': req.user._id
    }).populate('participants.userId', 'displayName email avatar');

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get rooms',
      message: error.message 
    });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, type = 'collaborative' } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Room name is required' 
      });
    }

    const room = new Room({
      name,
      description,
      type,
      createdBy: req.user._id,
      participants: [{ userId: req.user._id, role: 'host', joinedAt: new Date() }]
    });

    await room.save();

    res.status(201).json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create room',
      message: error.message 
    });
  }
});

// POST /api/rooms/:roomId/execute
router.post('/:roomId/execute', async (req, res) => {
  try {
    const { language, code, input, testCases, submissionTime, battleStartTime } = req.body;
    if (!language || !code) {
      return res.status(400).json({ success: false, error: 'language and code are required' });
    }
    // If no testCases, fallback to single execution
    if (!Array.isArray(testCases) || testCases.length === 0) {
      const result = await executeCode(language, code, input || '');
      return res.json({ success: true, result });
    }
    // Run code for each test case
    let passed = 0;
    const testCaseResults = [];
    for (const tc of testCases) {
      const execResult = await executeCode(language, code, tc.input || '');
      const output = (execResult.stdout || '').trim();
      const expected = (tc.expectedOutput || '').trim();
      const isPass = output === expected;
      if (isPass) passed++;
      testCaseResults.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: output,
        isPass,
        error: execResult.stderr || execResult.compile_output || null
      });
    }
    // Scoring logic
    const maxPoints = 100;
    const accuracyScore = Math.round((passed / testCases.length) * maxPoints);
    // Speed bonus: max 50 points, linearly decreases over 5 minutes
    let speedScore = 0;
    if (battleStartTime && submissionTime) {
      const elapsed = Math.max(0, Math.min(300, Math.floor((submissionTime - battleStartTime) / 1000)));
      speedScore = Math.round(50 * (1 - (elapsed / 300)));
    }
    const totalScore = accuracyScore + speedScore;
    res.json({
      success: true,
      result: {
        passed,
        total: testCases.length,
        testCaseResults,
        accuracyScore,
        speedScore,
        totalScore,
        timeTaken: submissionTime && battleStartTime ? Math.floor((submissionTime - battleStartTime) / 1000) : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 
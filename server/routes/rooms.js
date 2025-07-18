const express = require('express');
const { auth } = require('../middleware/auth');
const Room = require('../models/Room');
const roomStateManager = require('../utils/roomStateManager');
const { executeCode } = require('../utils/codeExecutor');
const { generateProblemsWithGemini } = require('../utils/problemGenerator');

const router = express.Router();

// Get all rooms for current user
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

// Create a new room with a generated code
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, language = 'javascript', mode = 'collaborative', isTemporary = false } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }
    const { room, state } = await roomStateManager.createRoom({
      name,
      description,
      language,
      mode,
      createdBy: req.user._id,
      isTemporary
    });
    res.status(201).json({
      success: true,
      room,
      roomCode: room.roomCode,
      state
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

// Join a room by code
router.post('/join', auth, async (req, res) => {
  try {
    const { roomCode } = req.body;
    if (!roomCode) {
      return res.status(400).json({ success: false, error: 'Room code is required' });
    }
    const { room, state } = await roomStateManager.joinRoomByCode(roomCode, req.user._id);
    res.json({
      success: true,
      room,
      state
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(404).json({ 
      success: false, 
      error: 'Failed to join room',
      message: error.message 
    });
  }
});

// Get room state by code (for debugging/demo)
router.get('/state/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const roomInfo = roomStateManager.getRoomByCode(roomCode);
    if (!roomInfo) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({
      success: true,
      ...roomInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// (Optional) Get all active rooms (for admin/debug)
router.get('/active', auth, (req, res) => {
  try {
    const rooms = roomStateManager.getActiveRooms();
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute code in a room
router.post('/:roomId/execute', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { language, code, input = '' } = req.body;

    // Validate inputs
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required'
      });
    }

    // Validate language
    if (!['javascript', 'python'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language. Supported: javascript, python'
      });
    }

    // Execute the code
    const result = await executeCode(language, code, input);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Code execution failed'
    });
  }
});

// Generate and store problems for a room
router.post('/:roomId/generate-problems', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { language = 'JavaScript', difficulty = 'Easy' } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    // Call Gemini API
    const problems = await generateProblemsWithGemini(language, difficulty);
    // Store in room document
    room.problems = problems;
    await room.save();
    res.json({ success: true, problems });
  } catch (error) {
    console.error('Problem generation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate problems' });
  }
});

module.exports = router; 
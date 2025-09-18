const express = require('express');
const { auth } = require('../middleware/auth');
const Room = require('../models/Room');
const DSAProblem = require('../models/dsa/DSAProblem');
const roomStateManager = require('../utils/roomStateManager');
const { executeCode } = require('../utils/codeExecutor');

const router = express.Router();

// Create a new battle room
router.post('/create', auth, async (req, res) => {
  try {
    const { 
      difficulty = 'Easy', 
      battleTime = 10, 
      selectedProblem,
      questionSelection = 'random'
    } = req.body;

    let problem;
    
    // Get problem based on selection
    if (selectedProblem) {
      // Find specific problem by ID or slug
      problem = await DSAProblem.findOne({
        $or: [
          { _id: selectedProblem },
          { slug: selectedProblem }
        ],
        isActive: true
      });
    } else if (questionSelection === 'random') {
      // Get random problem by difficulty
      const difficultyLevels = {
        'Easy': ['Easy'],
        'Medium': ['Medium'], 
        'Hard': ['Hard'],
        'Any': ['Easy', 'Medium', 'Hard']
      };
      
      const difficulties = difficultyLevels[difficulty] || ['Easy'];
      
      problem = await DSAProblem.aggregate([
        { 
          $match: { 
            difficulty: { $in: difficulties },
            isActive: true 
          } 
        },
        { $sample: { size: 1 } }
      ]);
      
      problem = problem.length > 0 ? problem[0] : null;
    }

    if (!problem) {
      return res.status(400).json({ 
        success: false, 
        error: 'No problem found for the given criteria' 
      });
    }

    // Create battle room
    const { room, state } = await roomStateManager.createRoom({
      name: `Battle: ${problem.title}`,
      description: `Battle room for ${problem.title} (${difficulty})`,
      language: 'javascript',
      mode: 'battle',
      createdBy: req.user._id,
      isTemporary: true
    });

    // Update room state with battle info
    await roomStateManager.updateRoomState(room._id.toString(), {
      mode: 'battle',
      battle: {
        problemId: problem._id.toString(),
        difficulty: difficulty,
        host: req.user._id.toString(),
        durationMinutes: Math.max(1, Math.min(Number(battleTime) || 10, 180)),
        started: false,
        startedAt: null,
        ended: false,
        endedAt: null,
        submissions: {}
      }
    });

    res.status(201).json({
      success: true,
      roomId: room._id.toString(),
      roomCode: room.roomCode,
      problem,
      state: {
        ...state,
        battle: {
          problemId: problem._id.toString(),
          difficulty: difficulty,
          host: req.user._id.toString(),
          durationMinutes: Math.max(1, Math.min(Number(battleTime) || 10, 180)),
          started: false,
          startedAt: null,
          ended: false,
          endedAt: null,
          submissions: {}
        }
      }
    });
  } catch (error) {
    console.error('Create battle error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create battle room',
      message: error.message 
    });
  }
});

// Join a battle room by code
router.post('/join', auth, async (req, res) => {
  try {
    const { roomCode } = req.body;
    if (!roomCode) {
      return res.status(400).json({ success: false, error: 'Room code is required' });
    }

    const { room, state } = await roomStateManager.joinRoomByCode(roomCode, req.user._id);
    
    if (room.mode !== 'battle') {
      return res.status(400).json({ 
        success: false, 
        error: 'This room is not a battle room' 
      });
    }

    res.json({
      success: true,
      room,
      roomCode: room.roomCode,
      state
    });
  } catch (error) {
    console.error('Join battle error:', error);
    res.status(404).json({ 
      success: false, 
      error: 'Failed to join battle room',
      message: error.message 
    });
  }
});

// Get battle lobby state
router.get('/:roomId/lobby', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Get room info
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: 'Battle room not found' 
      });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(p => 
      p.userId.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not a participant in this battle' 
      });
    }

    // Get current room state
    const roomInfo = roomStateManager.getRoomById(roomId);
    if (!roomInfo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Battle state not found' 
      });
    }

    // Get problem details if battle has started
    let problem = null;
    if (roomInfo.state?.battle?.problemId) {
      problem = await DSAProblem.findById(roomInfo.state.battle.problemId);
    }

    res.json({
      success: true,
      room,
      roomCode: room.roomCode,
      state: roomInfo.state,
      problem,
      users: roomInfo.users || []
    });
  } catch (error) {
    console.error('Get battle lobby error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get battle lobby',
      message: error.message 
    });
  }
});

// Test code execution for battle
router.post('/:roomId/test', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code is required' 
      });
    }

    // Get room info
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: 'Battle room not found' 
      });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(p => 
      p.userId.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not a participant in this battle' 
      });
    }

    // Get battle state
    const roomInfo = roomStateManager.getRoomById(roomId);
    if (!roomInfo?.state?.battle?.problemId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Battle problem not found' 
      });
    }

    // Get problem details
    const problem = await DSAProblem.findById(roomInfo.state.battle.problemId);
    if (!problem) {
      return res.status(404).json({ 
        success: false, 
        error: 'Problem not found' 
      });
    }

    // Execute code against test cases
    const result = await executeCode({
      code,
      language: 'javascript',
      testCases: problem.testCases || [],
      expectedOutput: problem.expectedOutput || []
    });

    // Update battle submissions if battle has started
    if (roomInfo.state.battle.started) {
      await roomStateManager.updateRoomState(roomId, {
        battle: {
          ...roomInfo.state.battle,
          submissions: {
            ...roomInfo.state.battle.submissions,
            [req.user._id.toString()]: {
              code,
              result,
              timestamp: new Date(),
              passed: result.passed || 0,
              total: result.total || 0
            }
          }
        }
      });
    }

    res.json({
      success: true,
      result,
      problem: {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty
      }
    });
  } catch (error) {
    console.error('Battle test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to execute code',
      message: error.message 
    });
  }
});

// Get battle results
router.get('/:roomId/results', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Get room info
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: 'Battle room not found' 
      });
    }

    // Check if user is participant
    const isParticipant = room.participants.some(p => 
      p.userId.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false, 
        error: 'You are not a participant in this battle' 
      });
    }

    // Get current room state
    const roomInfo = roomStateManager.getRoomById(roomId);
    if (!roomInfo) {
      return res.status(404).json({ 
        success: false, 
        error: 'Battle state not found' 
      });
    }

    const battle = roomInfo.state?.battle;
    if (!battle) {
      return res.status(400).json({ 
        success: false, 
        error: 'Battle data not found' 
      });
    }

    // Get problem details
    const problem = await DSAProblem.findById(battle.problemId);
    
    // Format results
    const submissions = battle.submissions || {};
    const results = Object.entries(submissions).map(([userId, submission]) => ({
      userId,
      ...submission,
      timestamp: submission.timestamp
    })).sort((a, b) => {
      // Sort by: 1) passed tests, 2) timestamp (earlier is better)
      if (a.passed !== b.passed) {
        return b.passed - a.passed;
      }
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    res.json({
      success: true,
      battle: {
        problemId: battle.problemId,
        problem: problem ? {
          id: problem._id,
          title: problem.title,
          difficulty: problem.difficulty
        } : null,
        started: battle.started,
        ended: battle.ended,
        startedAt: battle.startedAt,
        endedAt: battle.endedAt,
        durationMinutes: battle.durationMinutes
      },
      results,
      submissions
    });
  } catch (error) {
    console.error('Get battle results error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get battle results',
      message: error.message 
    });
  }
});

module.exports = router;

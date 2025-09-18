const express = require('express');
const roomStateManager = require('../utils/roomStateManager');
const Room = require('../models/Room');

const router = express.Router();

// Test utility endpoints for Redis fallback testing
// These should only be available in development/test environments

// Clear memory state for a specific room
router.post('/clear-memory-state', async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ success: false, error: 'roomId is required' });
    }

    // Clear from in-memory storage
    const roomStates = roomStateManager.roomStates || new Map();
    roomStates.delete(roomId);
    
    console.log(`🧹 Test: Cleared memory state for room ${roomId}`);
    
    res.json({ 
      success: true, 
      message: `Memory state cleared for room ${roomId}`,
      roomId 
    });
  } catch (error) {
    console.error('Error clearing memory state:', error);
    res.status(500).json({ success: false, error: 'Failed to clear memory state' });
  }
});

// Evict room from memory (simulate room expiration)
router.post('/evict-room', async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ success: false, error: 'roomId is required' });
    }

    // Remove from in-memory storage
    const roomStates = roomStateManager.roomStates || new Map();
    const roomCodeToId = roomStateManager.roomCodeToId || new Map();
    
    // Find room code and remove mappings
    for (const [code, id] of roomCodeToId.entries()) {
      if (id === roomId) {
        roomCodeToId.delete(code);
        break;
      }
    }
    
    roomStates.delete(roomId);
    
    console.log(`🗑️ Test: Evicted room ${roomId} from memory`);
    
    res.json({ 
      success: true, 
      message: `Room ${roomId} evicted from memory`,
      roomId 
    });
  } catch (error) {
    console.error('Error evicting room:', error);
    res.status(500).json({ success: false, error: 'Failed to evict room' });
  }
});

// Get Redis state for a room
router.get('/redis-state/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Try to get from Redis
    const redisClient = roomStateManager.redisClient;
    if (!redisClient) {
      return res.json({ 
        success: false, 
        error: 'Redis client not available',
        redisAvailable: false 
      });
    }

    const redisState = await redisClient.get(`room:${roomId}`);
    
    res.json({ 
      success: true, 
      redisAvailable: true,
      hasRedisState: !!redisState,
      redisState: redisState ? JSON.parse(redisState) : null,
      roomId 
    });
  } catch (error) {
    console.error('Error getting Redis state:', error);
    res.status(500).json({ success: false, error: 'Failed to get Redis state' });
  }
});

// Get memory state for a room
router.get('/memory-state/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const roomStates = roomStateManager.roomStates || new Map();
    const memoryState = roomStates.get(roomId);
    
    res.json({ 
      success: true, 
      hasMemoryState: !!memoryState,
      memoryState: memoryState || null,
      roomId 
    });
  } catch (error) {
    console.error('Error getting memory state:', error);
    res.status(500).json({ success: false, error: 'Failed to get memory state' });
  }
});

// Force Redis fallback by clearing memory and testing lobby fetch
router.post('/test-redis-fallback/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Clear memory state
    const roomStates = roomStateManager.roomStates || new Map();
    roomStates.delete(roomId);
    
    // Try to get room state (should trigger Redis fallback)
    const state = await roomStateManager.getRoomState(roomId);
    
    res.json({ 
      success: true, 
      message: 'Redis fallback test completed',
      roomId,
      stateRecovered: !!state,
      state: state || null
    });
  } catch (error) {
    console.error('Error testing Redis fallback:', error);
    res.status(500).json({ success: false, error: 'Failed to test Redis fallback' });
  }
});

// Get room state manager statistics
router.get('/room-state-stats', async (req, res) => {
  try {
    const stats = roomStateManager.getRoomStats();
    const roomStates = roomStateManager.roomStates || new Map();
    const roomCodeToId = roomStateManager.roomCodeToId || new Map();
    
    res.json({ 
      success: true, 
      stats,
      memoryRooms: Array.from(roomStates.keys()),
      roomCodeMappings: Array.from(roomCodeToId.entries()),
      redisAvailable: !!roomStateManager.redisClient
    });
  } catch (error) {
    console.error('Error getting room state stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get room state stats' });
  }
});

// Simulate server restart (clear all memory state)
router.post('/simulate-restart', async (req, res) => {
  try {
    // Clear all in-memory state
    const roomStates = roomStateManager.roomStates || new Map();
    const roomCodeToId = roomStateManager.roomCodeToId || new Map();
    
    const clearedRooms = Array.from(roomStates.keys());
    roomStates.clear();
    roomCodeToId.clear();
    
    console.log(`🔄 Test: Simulated server restart - cleared ${clearedRooms.length} rooms`);
    
    res.json({ 
      success: true, 
      message: 'Server restart simulated',
      clearedRooms: clearedRooms.length,
      rooms: clearedRooms
    });
  } catch (error) {
    console.error('Error simulating restart:', error);
    res.status(500).json({ success: false, error: 'Failed to simulate restart' });
  }
});

module.exports = router;

const Room = require('../models/Room');
const RoomState = require('../models/RoomState');
const persistentStateManager = require('./persistentStateManager');

// In-memory storage for room states
const roomStates = new Map();
const roomCodeToId = new Map();
const roomExpirations = new Map(); 
const battleEndTimers = new Map();
const pendingJoinRequests = new Map(); // roomId -> Array<{ tempUserId, name, requestedAt }>

// Redis client (optional)
let redisClient = null;

// Initialize Redis if available
const initializeRedis = async () => {
  try {
    const redis = require('redis');
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await redisClient.connect();
    console.log('✅ Redis connected for room state management');

    // Connection lifecycle logging and auto-resync
    redisClient.on('connect', () => {
      console.log('🔌 Redis connect event');
    });

    redisClient.on('ready', async () => {
      console.log('🟢 Redis ready');
      try {
        await resyncMemoryToRedis();
      } catch (e) {
        console.warn('⚠️ Failed to resync memory to Redis on ready:', e.message);
      }
    });

    // Set up error handling
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
      redisClient = null;
    });

    redisClient.on('end', async () => {
      console.log('🔴 Redis connection ended. Falling back to in-memory storage');
      redisClient = null;
      try {
        await rebuildMemoryFromDatabase();
      } catch (e) {
        console.warn('⚠️ Rebuild memory from DB failed after Redis end:', e.message);
      }
    });
  } catch (error) {
    console.log('⚠️ Redis not available, using in-memory storage only');
    redisClient = null;
  }
};

// Room state structure
const createRoomState = (roomId, language = 'javascript', mode = 'collaborative') => ({
  roomId,
  language,
  mode,
  code: getDefaultCode(language),
  version: 0,
  lastModified: new Date(),
  lastModifiedBy: null,
  users: new Set(),
  cursors: new Map(),
  viewports: new Map(), // userId -> { scrollTop, scrollLeft, visibleRange }
  lastPositions: new Map(), // userId -> { lineNumber, column }
  collabHistory: [], // array of recent collaboration events (bounded)
  chatMessages: [],
  isActive: true,
  createdAt: new Date(),
  battle: undefined
});

// Get default code for language
const getDefaultCode = (language) => {
  switch (language) {
    case 'python':
      return `# Welcome to Python Collaborative Editor
# Start coding with your team!

def hello_world():
    print("Hello, Collaborative World!")
    
# Add your Python code here
`;
    case 'java':
      return `// Welcome to Java Collaborative Editor
// Start coding with your team!

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Collaborative World!");
    }
}
`;
    case 'cpp':
      return `// Welcome to C++ Collaborative Editor
// Start coding with your team!

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Collaborative World!" << endl;
    return 0;
}
`;
    case 'csharp':
      return `// Welcome to C# Collaborative Editor
// Start coding with your team!

using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, Collaborative World!");
    }
}
`;
    default:
      return `// Welcome to JavaScript Collaborative Editor
// Start coding with your team!

function helloWorld() {
    console.log("Hello, Collaborative World!");
}

// Add your JavaScript code here
`;
  }
};

// Room State Management Methods

// Create a new room state
const createRoom = async (roomData) => {
  try {
    const { name, description, language, mode, createdBy, isTemporary = false } = roomData;
    
    // Generate unique room code
    let roomCode;
    try {
      roomCode = await Room.generateRoomCode();
    } catch (error) {
      // Fallback if database is not available
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    let room;
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection.readyState === 1;
    
    if (isDbConnected) {
      try {
        // Create room in database
        room = new Room({
          name,
          description,
          roomCode,
          language,
          mode,
          createdBy,
          participants: [{ userId: createdBy, role: 'host' }],
          codeExpiresAt: isTemporary ? new Date(Date.now() + (24 * 60 * 60 * 1000)) : null // 24 hours for temporary rooms
        });
        
        await room.save();
      } catch (dbError) {
        console.warn('Database save failed, creating in-memory room:', dbError.message);
        isDbConnected = false;
      }
    }
    
    // If database is not connected or save failed, create mock room
    if (!isDbConnected || !room) {
      const mongoose = require('mongoose');
      room = {
        _id: new mongoose.Types.ObjectId(),
        name,
        description,
        roomCode,
        language,
        mode,
        createdBy: new mongoose.Types.ObjectId(createdBy),
        participants: [{ userId: new mongoose.Types.ObjectId(createdBy), role: 'host' }],
        codeExpiresAt: isTemporary ? new Date(Date.now() + (24 * 60 * 60 * 1000)) : null,
        status: 'active'
      };
    }
    
    // Create in-memory state
    const state = createRoomState(room._id.toString(), language, mode);
    roomStates.set(room._id.toString(), state);
    roomCodeToId.set(roomCode, room._id.toString());
    
    // Store in Redis if available
    if (redisClient) {
      const stateForRedis = {
        ...state,
        users: Array.from(state.users),
        cursors: Array.from(state.cursors.entries()),
        viewports: Array.from(state.viewports.entries()),
        lastPositions: Array.from(state.lastPositions.entries()),
        // collabHistory can be stored directly (array)
      };
      await redisClient.setEx(
        `room:${room._id}`,
        24 * 60 * 60, // 24 hours TTL
        JSON.stringify(stateForRedis)
      );
      await redisClient.setEx(
        `roomcode:${roomCode}`,
        24 * 60 * 60,
        room._id.toString()
      );
    }
    
    // Save to persistent database
    try {
      await persistentStateManager.handleRoomCreated(room._id.toString(), state);
    } catch (persistentError) {
      console.warn('⚠️ Failed to save room state to database:', persistentError.message);
    }
    
    // Set expiration cleanup for temporary rooms
    if (isTemporary) {
      const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
      roomExpirations.set(room._id.toString(), expirationTime);
      
      setTimeout(() => {
        cleanupExpiredRoom(room._id.toString());
      }, 24 * 60 * 60 * 1000);
    }
    
    return { room, state };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Join room by code
const joinRoomByCode = async (roomCode, userId) => {
  try {
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection.readyState === 1;
    
    let room = null;
    
    if (isDbConnected) {
      try {
        room = await Room.findByCode(roomCode);
        if (room) {
          // Add user to room participants
          await room.addParticipant(userId);
        }
      } catch (dbError) {
        console.warn('Database query failed, checking in-memory state:', dbError.message);
      }
    }
    
    // If no room found in DB or DB not connected, check in-memory state
    if (!room) {
      const codeKey = (roomCode || '').toString().toUpperCase().trim();
      const roomId = roomCodeToId.get(codeKey);
      if (roomId) {
        const state = roomStates.get(roomId);
        if (state) {
          // Create mock room from in-memory state
          room = {
            _id: roomId,
            roomCode: codeKey,
            language: state.language || 'javascript',
            mode: state.mode || 'collaborative',
            participants: []
          };
        }
      }
    }
    
    if (!room) {
      throw new Error('Room not found or code expired');
    }
    
    // Get or create room state
    let state = roomStates.get(room._id.toString());
    if (!state) {
      // Try to load from Redis
      if (redisClient) {
        const redisState = await redisClient.get(`room:${room._id}`);
        if (redisState) {
          const parsedState = JSON.parse(redisState);
          // Reconstruct Sets and Maps
          parsedState.users = new Set(parsedState.users);
          parsedState.cursors = new Map(parsedState.cursors);
          parsedState.viewports = new Map(parsedState.viewports || []);
          parsedState.lastPositions = new Map(parsedState.lastPositions || []);
          state = parsedState;
        }
      }
      
      // If still no state, create new one
      if (!state) {
        state = createRoomState(room._id.toString(), room.language, room.mode);
      }
      
      roomStates.set(room._id.toString(), state);
      roomCodeToId.set((room.roomCode || '').toString().toUpperCase().trim(), room._id.toString());
    }
    
    // Add user to state
    state.users.add(userId.toString());
    
    // Update Redis if available
    if (redisClient) {
      const stateForRedis = {
        ...state,
        users: Array.from(state.users),
        cursors: Array.from(state.cursors.entries())
      };
      await redisClient.setEx(
        `room:${room._id}`,
        24 * 60 * 60,
        JSON.stringify(stateForRedis)
      );
    }
    
    // Save to persistent database
    try {
      await persistentStateManager.handleUserJoined(room._id.toString(), userId);
    } catch (persistentError) {
      console.warn('⚠️ Failed to save user join to database:', persistentError.message);
    }
    
    return { room, state };
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Get room state with persistent fallback
const getRoomState = async (roomId) => {
  try {
    // Prefer in-memory
    let state = roomStates.get(roomId);
    if (state) return state;
    // Try Redis
    if (redisClient) {
      const redisState = await redisClient.get(`room:${roomId}`);
      if (redisState) {
        const parsed = JSON.parse(redisState);
        parsed.users = new Set(parsed.users || []);
        parsed.cursors = new Map(parsed.cursors || []);
        parsed.viewports = new Map(parsed.viewports || []);
        parsed.lastPositions = new Map(parsed.lastPositions || []);
        roomStates.set(roomId, parsed);
        return parsed;
      }
    }
    // Fallback to persistent DB
    state = await persistentStateManager.getRoomStateWithFallback(roomId);
    if (state) roomStates.set(roomId, state);
    return state;
  } catch (error) {
    console.error('Error getting room state:', error.message);
    return null;
  }
};

// Update room state
const updateRoomState = async (roomId, updates) => {
  const state = roomStates.get(roomId);
  if (!state) {
    throw new Error('Room state not found');
  }
  
  Object.assign(state, updates);
  state.lastModified = new Date();
  // Bound collaboration history length
  if (Array.isArray(state.collabHistory) && state.collabHistory.length > 500) {
    state.collabHistory = state.collabHistory.slice(-500);
  }
  
  // Update Redis if available
  if (redisClient) {
    const stateForRedis = {
      ...state,
      users: Array.from(state.users),
      cursors: Array.from(state.cursors.entries()),
      viewports: Array.from(state.viewports.entries()),
      lastPositions: Array.from(state.lastPositions.entries())
    };
    await redisClient.setEx(
      `room:${roomId}`,
      24 * 60 * 60,
      JSON.stringify(stateForRedis)
    );
  }
  
  // Save to persistent database
  try {
    await persistentStateManager.debouncedSave(roomId, state);
  } catch (persistentError) {
    console.warn('⚠️ Failed to save room state update to database:', persistentError.message);
  }
  
  return state;
};

// Schedule battle end for a room after a duration (in ms). Sets state.battle.ended.
const scheduleBattleEnd = (roomId, durationMs) => {
  if (battleEndTimers.has(roomId)) {
    clearTimeout(battleEndTimers.get(roomId));
    battleEndTimers.delete(roomId);
  }
  const timer = setTimeout(async () => {
    try {
      const state = roomStates.get(roomId);
      if (state && state.battle && !state.battle.ended) {
        console.log(`Battle ${roomId} ended by timer after ${durationMs}ms`);
        state.battle.ended = true;
        state.battle.endedAt = new Date();
        await updateRoomState(roomId, { battle: state.battle });
        
        // Log comprehensive state after timer-based battle end
        const { logRoomState, logSubmissionState, validateBattleResultData } = require('./battleLogger');
        await logRoomState(roomId, 'BATTLE_TIMER_ENDED');
        await logSubmissionState(roomId, 'BATTLE_TIMER_ENDED');
        await validateBattleResultData(roomId);
      }
    } catch (e) {
      console.error('Error ending battle by timer:', e);
    } finally {
      battleEndTimers.delete(roomId);
    }
  }, Math.max(0, durationMs | 0));
  battleEndTimers.set(roomId, timer);
};

// Clear battle timer for a room (used to prevent double-ending)
const clearBattleTimer = (roomId) => {
  if (battleEndTimers.has(roomId)) {
    clearTimeout(battleEndTimers.get(roomId));
    battleEndTimers.delete(roomId);
    console.log(`Cleared battle timer for room ${roomId}`);
  }
};

// Prune inactive participants based on lastSeen in Room doc; marks participant inactive in DB and removes from state.users
const pruneInactiveParticipants = async (roomId, maxIdleMs = 5 * 60 * 1000) => {
  const room = await Room.findById(roomId);
  if (!room) return;
  const now = Date.now();
  let changed = false;
  room.participants.forEach(p => {
    const last = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
    if (p.isActive && last && (now - last) > maxIdleMs) {
      p.isActive = false;
      changed = true;
    }
  });
  if (changed) await room.save();
  const state = roomStates.get(roomId);
  if (state) {
    for (const uid of Array.from(state.users)) {
      const stillActive = room.participants.some(p => p.isActive && p.userId.toString() === uid.toString());
      if (!stillActive) state.users.delete(uid);
    }
  }
};

// Remove user from room
const removeUserFromRoom = async (roomId, userId) => {
  const state = roomStates.get(roomId);
  if (state) {
    state.users.delete(userId.toString());
    state.cursors.delete(userId.toString());
    
    // Update Redis if available
    if (redisClient) {
      const stateForRedis = {
        ...state,
        users: Array.from(state.users),
        cursors: Array.from(state.cursors.entries())
      };
      await redisClient.setEx(
        `room:${roomId}`,
        24 * 60 * 60,
        JSON.stringify(stateForRedis)
      );
    }
    
    // Save to persistent database
    try {
      await persistentStateManager.handleUserLeft(roomId, userId);
    } catch (persistentError) {
      console.warn('⚠️ Failed to save user leave to database:', persistentError.message);
    }
  }
  
  // Update database
  const room = await Room.findById(roomId);
  if (room) {
    await room.removeParticipant(userId);
  }
};

// Cleanup expired rooms
const cleanupExpiredRoom = async (roomId) => {
  try {
    // Remove from memory
    roomStates.delete(roomId);
    
    // Remove from Redis if available
    if (redisClient) {
      await redisClient.del(`room:${roomId}`);
    }
    
    // Update database
    const room = await Room.findById(roomId);
    if (room) {
      room.isActive = false;
      await room.save();
    }
    
    console.log(`Cleaned up expired room: ${roomId}`);
  } catch (error) {
    console.error('Error cleaning up expired room:', error);
  }
};

// Get room by code (from memory)
const getRoomByCode = (roomCode) => {
  const roomId = roomCodeToId.get(roomCode.toUpperCase());
  if (roomId) {
    return {
      roomId,
      state: roomStates.get(roomId)
    };
  }
  return null;
};

// Get all active rooms
const getActiveRooms = () => {
  return Array.from(roomStates.entries()).map(([roomId, state]) => ({
    roomId,
    ...state
  }));
};

// Get room statistics
const getRoomStats = () => {
  return {
    totalRooms: roomStates.size,
    activeRooms: Array.from(roomStates.values()).filter(state => state.isActive).length,
    totalUsers: Array.from(roomStates.values()).reduce((sum, state) => sum + state.users.size, 0)
  };
};

// Rebuild in-memory cache from persistent database
const rebuildMemoryFromDatabase = async () => {
  console.log('🔄 Rebuilding in-memory room cache from database...');
  try {
    const docs = await RoomState.find({ isActive: true }).lean(false);
    let restored = 0;
    for (const doc of docs) {
      try {
        const memoryState = doc.toMemoryState();
        const roomId = memoryState.roomId;
        roomStates.set(roomId, memoryState);
        // roomCode mapping best-effort (requires Room lookup)
        try {
          const room = await Room.findById(roomId).select('roomCode');
          if (room?.roomCode) {
            roomCodeToId.set(room.roomCode, roomId);
          }
        } catch (_) {}
        restored += 1;
      } catch (e) {
        console.warn('⚠️ Failed to convert RoomState to memory state:', e.message);
      }
    }
    console.log(`✅ Rebuilt memory cache for ${restored} rooms from DB`);
    return restored;
  } catch (error) {
    console.error('❌ Error rebuilding memory from database:', error.message);
    throw error;
  }
};

// Resync current memory cache to Redis
const resyncMemoryToRedis = async () => {
  if (!redisClient) return 0;
  console.log('🔁 Resyncing in-memory room cache to Redis...');
  let pushed = 0;
  for (const [roomId, state] of roomStates.entries()) {
    try {
      const stateForRedis = {
        ...state,
        users: Array.from(state.users),
        cursors: Array.from(state.cursors.entries()),
        viewports: Array.from(state.viewports.entries()),
        lastPositions: Array.from(state.lastPositions.entries())
      };
      await redisClient.setEx(
        `room:${roomId}`,
        24 * 60 * 60,
        JSON.stringify(stateForRedis)
      );
      pushed += 1;
    } catch (e) {
      console.warn(`⚠️ Failed to push room ${roomId} to Redis:`, e.message);
    }
  }
  console.log(`✅ Resynced ${pushed} rooms to Redis`);
  return pushed;
};

// Periodically log Redis/Cache status and attempt reconnect
const startRedisStatusMonitor = () => {
  setInterval(async () => {
    const status = {
      redisConnected: Boolean(redisClient),
      memoryRooms: roomStates.size,
      codes: roomCodeToId.size
    };
    console.log('📊 Room cache status:', status);
    // Attempt reconnection if redis is down
    if (!redisClient) {
      try {
        await initializeRedis();
      } catch (_) {}
    }
  }, 30 * 1000);
};

// Periodic cleanup of expired rooms
const startCleanupScheduler = () => {
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, expirationTime] of roomExpirations.entries()) {
      if (now > expirationTime) {
        cleanupExpiredRoom(roomId);
        roomExpirations.delete(roomId);
      }
    }
    // Periodically prune inactive participants
    for (const roomId of roomStates.keys()) {
      pruneInactiveParticipants(roomId).catch(() => {});
    }
    // Cleanup expired rooms from persistent storage
    persistentStateManager.cleanupExpiredRooms(24).catch(() => {});
  }, 60 * 1000); // Check every minute
};

// Initialize the room state manager
const initialize = async () => {
  await initializeRedis();
  startCleanupScheduler();
  startRedisStatusMonitor();
  console.log('✅ Room state manager initialized');
};

module.exports = {
  initialize,
  createRoom,
  joinRoomByCode,
  getRoomState,
  updateRoomState,
  removeUserFromRoom,
  getRoomByCode,
  getActiveRooms,
  getRoomStats,
  createRoomState,
  getDefaultCode,
  scheduleBattleEnd,
  clearBattleTimer,
  pruneInactiveParticipants,
  // Expose internal state for testing
  roomStates,
  roomCodeToId,
  redisClient,
  pendingJoinRequests,
  // Expose persistent state manager
  persistentStateManager
}; 
const Room = require('../models/Room');

// In-memory storage for room states
const roomStates = new Map();
const roomCodeToId = new Map();
const roomExpirations = new Map();
const battleEndTimers = new Map();

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
    
    // Set up error handling
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
      redisClient = null;
    });
    
    redisClient.on('disconnect', () => {
      console.log('Redis disconnected, falling back to in-memory storage');
      redisClient = null;
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
    const roomCode = await Room.generateRoomCode();
    
    // Create room in database
    const room = new Room({
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
    
    // Create in-memory state
    const state = createRoomState(room._id.toString(), language, mode);
    roomStates.set(room._id.toString(), state);
    roomCodeToId.set(roomCode, room._id.toString());
    
    // Store in Redis if available
    if (redisClient) {
      await redisClient.setEx(
        `room:${room._id}`,
        24 * 60 * 60, // 24 hours TTL
        JSON.stringify(state)
      );
      await redisClient.setEx(
        `roomcode:${roomCode}`,
        24 * 60 * 60,
        room._id.toString()
      );
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
    const room = await Room.findByCode(roomCode);
    if (!room) {
      throw new Error('Room not found or code expired');
    }
    
    // Add user to room participants
    await room.addParticipant(userId);
    
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
          state = parsedState;
        }
      }
      
      // If still no state, create new one
      if (!state) {
        state = createRoomState(room._id.toString(), room.language, room.mode);
      }
      
      roomStates.set(room._id.toString(), state);
      roomCodeToId.set(room.roomCode, room._id.toString());
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
    
    return { room, state };
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Get room state
const getRoomState = (roomId) => {
  return roomStates.get(roomId);
};

// Update room state
const updateRoomState = async (roomId, updates) => {
  const state = roomStates.get(roomId);
  if (!state) {
    throw new Error('Room state not found');
  }
  
  Object.assign(state, updates);
  state.lastModified = new Date();
  
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
        state.battle.ended = true;
        state.battle.endedAt = new Date();
        await updateRoomState(roomId, { battle: state.battle });
      }
    } catch (e) {
      // noop
    } finally {
      battleEndTimers.delete(roomId);
    }
  }, Math.max(0, durationMs | 0));
  battleEndTimers.set(roomId, timer);
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
  }, 60 * 1000); // Check every minute
};

// Initialize the room state manager
const initialize = async () => {
  await initializeRedis();
  startCleanupScheduler();
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
  pruneInactiveParticipants
}; 
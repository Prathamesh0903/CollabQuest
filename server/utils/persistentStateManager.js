const RoomState = require('../models/RoomState');
const roomStateManager = require('./roomStateManager');

class PersistentStateManager {
  constructor() {
    this.saveQueue = new Map(); // Debounce saves
    this.saveTimeout = 1000; // 1 second debounce
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Save room state to database with debouncing
  async saveRoomState(roomId, state, options = {}) {
    const { immediate = false, retryCount = 0 } = options;
    
    try {
      console.log(`💾 Saving room state to database [${roomId}]`);
      
      // Convert in-memory state to database format
      const dbState = this.convertToDbFormat(roomId, state);
      
      // Update or create room state
      const roomState = await RoomState.findOneAndUpdate(
        { roomId: roomId },
        dbState,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );
      
      console.log(`✅ Room state saved to database [${roomId}]`);
      return roomState;
      
    } catch (error) {
      console.error(`❌ Error saving room state [${roomId}]:`, error.message);
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retrying save [${roomId}] (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.saveRoomState(roomId, state, { ...options, retryCount: retryCount + 1 });
      }
      
      throw error;
    }
  }

  // Debounced save - prevents too many database writes
  debouncedSave(roomId, state, immediate = false) {
    if (immediate) {
      return this.saveRoomState(roomId, state, { immediate: true });
    }
    
    // Clear existing timeout
    if (this.saveQueue.has(roomId)) {
      clearTimeout(this.saveQueue.get(roomId));
    }
    
    // Set new timeout
    const timeoutId = setTimeout(async () => {
      try {
        await this.saveRoomState(roomId, state);
        this.saveQueue.delete(roomId);
      } catch (error) {
        console.error(`❌ Debounced save failed [${roomId}]:`, error.message);
        this.saveQueue.delete(roomId);
      }
    }, this.saveTimeout);
    
    this.saveQueue.set(roomId, timeoutId);
  }

  // Restore room state from database
  async restoreRoomState(roomId) {
    try {
      console.log(`🔄 Restoring room state from database [${roomId}]`);
      
      const roomState = await RoomState.findByRoomId(roomId);
      
      if (!roomState) {
        console.log(`❌ No room state found in database [${roomId}]`);
        return null;
      }
      
      // Convert database format to in-memory format
      const memoryState = roomState.toMemoryState();
      
      // Store in memory cache
      roomStateManager.roomStates.set(roomId, memoryState);
      
      // Store in Redis if available
      if (roomStateManager.redisClient) {
        try {
          const stateForRedis = {
            ...memoryState,
            users: Array.from(memoryState.users),
            cursors: Array.from(memoryState.cursors.entries())
          };
          await roomStateManager.redisClient.setEx(
            `room:${roomId}`,
            24 * 60 * 60,
            JSON.stringify(stateForRedis)
          );
          console.log(`✅ Room state restored to Redis [${roomId}]`);
        } catch (redisError) {
          console.warn(`⚠️ Failed to restore to Redis [${roomId}]:`, redisError.message);
        }
      }
      
      console.log(`✅ Room state restored from database [${roomId}]`);
      return memoryState;
      
    } catch (error) {
      console.error(`❌ Error restoring room state [${roomId}]:`, error.message);
      throw error;
    }
  }

  // Convert in-memory state to database format
  convertToDbFormat(roomId, state) {
    return {
      roomId: roomId,
      language: state.language || 'javascript',
      mode: state.mode || 'collaborative',
      code: state.code || '',
      version: state.version || 0,
      lastModified: state.lastModified || new Date(),
      lastModifiedBy: state.lastModifiedBy || null,
      users: state.users ? Array.from(state.users) : [],
      cursors: state.cursors ? Array.from(state.cursors.entries()).map(([userId, cursor]) => ({
        userId: userId,
        position: cursor.position,
        color: cursor.color,
        displayName: cursor.displayName
      })) : [],
      chatMessages: state.chatMessages || [],
      isActive: state.isActive !== false,
      createdAt: state.createdAt || new Date(),
      battle: state.battle || undefined,
      'metadata.lastSaved': new Date(),
      $inc: { 'metadata.saveCount': 1 }
    };
  }

  // Handle room creation
  async handleRoomCreated(roomId, state) {
    console.log(`🏗️ Handling room creation [${roomId}]`);
    await this.saveRoomState(roomId, state, { immediate: true });
  }

  // Handle user join
  async handleUserJoined(roomId, userId) {
    console.log(`👥 Handling user join [${roomId}] - user: ${userId}`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      state.users.add(userId.toString());
      state.lastModified = new Date();
      this.debouncedSave(roomId, state);
    }
  }

  // Handle user leave
  async handleUserLeft(roomId, userId) {
    console.log(`👋 Handling user leave [${roomId}] - user: ${userId}`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      state.users.delete(userId.toString());
      state.cursors.delete(userId.toString());
      state.lastModified = new Date();
      this.debouncedSave(roomId, state);
    }
  }

  // Handle battle start
  async handleBattleStarted(roomId, battleData) {
    console.log(`⚔️ Handling battle start [${roomId}]`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      if (!state.battle) {
        state.battle = {};
      }
      Object.assign(state.battle, battleData);
      state.battle.started = true;
      state.battle.startedAt = new Date();
      state.lastModified = new Date();
      await this.saveRoomState(roomId, state, { immediate: true });
    }
  }

  // Handle battle end
  async handleBattleEnded(roomId, battleData) {
    console.log(`🏁 Handling battle end [${roomId}]`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      if (!state.battle) {
        state.battle = {};
      }
      Object.assign(state.battle, battleData);
      state.battle.ended = true;
      state.battle.endedAt = new Date();
      state.lastModified = new Date();
      await this.saveRoomState(roomId, state, { immediate: true });
    }
  }

  // Handle code change
  async handleCodeChange(roomId, code, userId) {
    console.log(`📝 Handling code change [${roomId}] - user: ${userId}`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      state.code = code;
      state.version += 1;
      state.lastModified = new Date();
      state.lastModifiedBy = userId;
      this.debouncedSave(roomId, state);
    }
  }

  // Handle cursor movement
  async handleCursorMove(roomId, userId, position, color, displayName) {
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      state.cursors.set(userId.toString(), {
        position,
        color,
        displayName
      });
      state.lastModified = new Date();
      this.debouncedSave(roomId, state);
    }
  }

  // Handle chat message
  async handleChatMessage(roomId, userId, message) {
    console.log(`💬 Handling chat message [${roomId}] - user: ${userId}`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      if (!state.chatMessages) {
        state.chatMessages = [];
      }
      state.chatMessages.push({
        userId,
        message,
        timestamp: new Date()
      });
      state.lastModified = new Date();
      this.debouncedSave(roomId, state);
    }
  }

  // Handle battle submission
  async handleBattleSubmission(roomId, userId, submissionData) {
    console.log(`📊 Handling battle submission [${roomId}] - user: ${userId}`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      if (!state.battle) {
        state.battle = {};
      }
      if (!state.battle.submissions) {
        state.battle.submissions = {};
      }
      state.battle.submissions[userId] = submissionData;
      state.lastModified = new Date();
      await this.saveRoomState(roomId, state, { immediate: true });
    }
  }

  // Handle user ready status
  async handleUserReady(roomId, userId, ready) {
    console.log(`✅ Handling user ready [${roomId}] - user: ${userId}, ready: ${ready}`);
    
    const state = roomStateManager.roomStates.get(roomId);
    if (state) {
      if (!state.battle) {
        state.battle = {};
      }
      if (!state.battle.ready) {
        state.battle.ready = {};
      }
      state.battle.ready[userId] = ready;
      state.lastModified = new Date();
      this.debouncedSave(roomId, state);
    }
  }

  // Get room state with fallback
  async getRoomStateWithFallback(roomId) {
    // First try memory
    let state = roomStateManager.roomStates.get(roomId);
    if (state) {
      // Increment cache hit
      try {
        await RoomState.findOneAndUpdate(
          { roomId: roomId },
          { $inc: { 'metadata.cacheHits': 1 } }
        );
      } catch (error) {
        console.warn(`⚠️ Failed to increment cache hit [${roomId}]:`, error.message);
      }
      return state;
    }
    
    // Try Redis
    if (roomStateManager.redisClient) {
      try {
        const redisState = await roomStateManager.redisClient.get(`room:${roomId}`);
        if (redisState) {
          const parsedState = JSON.parse(redisState);
          parsedState.users = new Set(parsedState.users);
          parsedState.cursors = new Map(parsedState.cursors);
          roomStateManager.roomStates.set(roomId, parsedState);
          return parsedState;
        }
      } catch (redisError) {
        console.warn(`⚠️ Redis get failed [${roomId}]:`, redisError.message);
      }
    }
    
    // Fallback to database
    try {
      state = await this.restoreRoomState(roomId);
      if (state) {
        // Increment cache miss
        try {
          await RoomState.findOneAndUpdate(
            { roomId: roomId },
            { $inc: { 'metadata.cacheMisses': 1 } }
          );
        } catch (error) {
          console.warn(`⚠️ Failed to increment cache miss [${roomId}]:`, error.message);
        }
        return state;
      }
    } catch (error) {
      console.error(`❌ Database fallback failed [${roomId}]:`, error.message);
    }
    
    return null;
  }

  // Cleanup expired rooms
  async cleanupExpiredRooms(expiryHours = 24) {
    try {
      console.log(`🧹 Cleaning up expired rooms (older than ${expiryHours} hours)`);
      
      const expiredRooms = await RoomState.findExpiredRooms(expiryHours);
      console.log(`Found ${expiredRooms.length} expired rooms`);
      
      for (const roomState of expiredRooms) {
        const roomId = roomState.roomId.toString();
        
        // Remove from memory
        roomStateManager.roomStates.delete(roomId);
        
        // Remove from Redis
        if (roomStateManager.redisClient) {
          try {
            await roomStateManager.redisClient.del(`room:${roomId}`);
          } catch (redisError) {
            console.warn(`⚠️ Failed to delete from Redis [${roomId}]:`, redisError.message);
          }
        }
        
        // Mark as inactive in database
        roomState.isActive = false;
        await roomState.save();
        
        console.log(`✅ Cleaned up expired room [${roomId}]`);
      }
      
      console.log(`✅ Cleanup completed - ${expiredRooms.length} rooms processed`);
      
    } catch (error) {
      console.error(`❌ Error during cleanup:`, error.message);
    }
  }

  // Get room statistics
  async getRoomStatistics() {
    try {
      const stats = await RoomState.aggregate([
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            activeRooms: { $sum: { $cond: ['$isActive', 1, 0] } },
            battleRooms: { $sum: { $cond: ['$battle', 1, 0] } },
            totalSaves: { $sum: '$metadata.saveCount' },
            totalCacheHits: { $sum: '$metadata.cacheHits' },
            totalCacheMisses: { $sum: '$metadata.cacheMisses' }
          }
        }
      ]);
      
      return stats[0] || {
        totalRooms: 0,
        activeRooms: 0,
        battleRooms: 0,
        totalSaves: 0,
        totalCacheHits: 0,
        totalCacheMisses: 0
      };
      
    } catch (error) {
      console.error(`❌ Error getting room statistics:`, error.message);
      return null;
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const persistentStateManager = new PersistentStateManager();

module.exports = persistentStateManager;

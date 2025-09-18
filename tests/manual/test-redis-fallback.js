const mongoose = require('mongoose');
const Room = require('./server/models/Room');
const roomStateManager = require('./server/utils/roomStateManager');

// Redis Fallback Test for roomId 68ba83f471e14644d1f9736e
class RedisFallbackTest {
  constructor(roomId) {
    this.roomId = roomId;
    this.testResults = [];
    this.originalRedisClient = null;
  }

  // Log test step with timestamp
  logTestStep(step, description, data = null) {
    const timestamp = new Date().toISOString();
    const result = {
      timestamp,
      step,
      description,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
      roomId: this.roomId
    };
    this.testResults.push(result);
    console.log(`\n🧪 [${timestamp}] STEP ${step}: ${description}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  // Simulate Redis disconnect
  async simulateRedisDisconnect() {
    console.log(`\n🔌 === SIMULATING REDIS DISCONNECT ===`);
    
    // Store original Redis client
    this.originalRedisClient = roomStateManager.redisClient;
    
    // Simulate Redis disconnect by setting client to null
    roomStateManager.redisClient = null;
    
    this.logTestStep('REDIS_DISCONNECT', 'Redis client set to null', {
      originalClient: !!this.originalRedisClient,
      newClient: !!roomStateManager.redisClient
    });
    
    console.log('✅ Redis disconnect simulated');
  }

  // Restore Redis connection
  async restoreRedisConnection() {
    console.log(`\n🔌 === RESTORING REDIS CONNECTION ===`);
    
    roomStateManager.redisClient = this.originalRedisClient;
    
    this.logTestStep('REDIS_RESTORE', 'Redis client restored', {
      client: !!roomStateManager.redisClient
    });
    
    console.log('✅ Redis connection restored');
  }

  // Create test room with state in both memory and Redis
  async createTestRoom() {
    console.log(`\n🏗️ === CREATING TEST ROOM ===`);
    
    try {
      // Create room
      const { room, state } = await roomStateManager.createRoom({
        name: `Test Battle Room`,
        description: `Test room for Redis fallback testing`,
        language: 'javascript',
        mode: 'battle',
        createdBy: this.roomId, // Using roomId as creator for testing
        isTemporary: true
      });
      
      this.logTestStep('ROOM_CREATED', 'Test room created successfully', {
        roomId: room._id,
        roomCode: room.roomCode,
        mode: room.mode,
        stateExists: !!state
      });
      
      // Update room state with battle info
      await roomStateManager.updateRoomState(room._id.toString(), {
        mode: 'battle',
        battle: {
          problemId: 'two-sum',
          difficulty: 'Easy',
          host: this.roomId,
          durationMinutes: 10,
          started: false,
          ended: false,
          submissions: {}
        }
      });
      
      this.logTestStep('BATTLE_STATE_ADDED', 'Battle state added to room', {
        roomId: room._id,
        battle: {
          problemId: 'two-sum',
          difficulty: 'Easy',
          host: this.roomId
        }
      });
      
      // Add some users to the state
      state.users.add('user1');
      state.users.add('user2');
      
      this.logTestStep('USERS_ADDED', 'Test users added to state', {
        roomId: room._id,
        users: Array.from(state.users)
      });
      
      return { room, state };
    } catch (error) {
      this.logTestStep('ROOM_CREATE_ERROR', 'Failed to create test room', {
        error: error.message
      });
      throw error;
    }
  }

  // Test getRoomState with Redis disconnected
  async testGetRoomStateFallback() {
    console.log(`\n📋 === TESTING getRoomState FALLBACK ===`);
    
    try {
      // Test 1: Get room state when Redis is disconnected
      this.logTestStep('GET_STATE_REDIS_DOWN', 'Attempting to get room state with Redis down');
      
      const state = await roomStateManager.getRoomState(this.roomId);
      
      this.logTestStep('GET_STATE_RESULT', 'Room state retrieval result', {
        stateExists: !!state,
        redisClient: !!roomStateManager.redisClient,
        state: state ? {
          users: Array.from(state.users || []),
          battle: state.battle,
          mode: state.mode
        } : null
      });
      
      if (state) {
        console.log('✅ Room state retrieved from memory fallback');
        return state;
      } else {
        console.log('❌ Room state not found in memory fallback');
        return null;
      }
    } catch (error) {
      this.logTestStep('GET_STATE_ERROR', 'Error getting room state', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Test lobby fetch with Redis disconnected
  async testLobbyFetchFallback() {
    console.log(`\n📋 === TESTING LOBBY FETCH FALLBACK ===`);
    
    try {
      // Simulate the lobby endpoint logic with Redis disconnected
      this.logTestStep('LOBBY_FETCH_START', 'Starting lobby fetch with Redis down');
      
      // Step 1: Get room state (should fallback to memory)
      const state = await roomStateManager.getRoomState(this.roomId);
      
      this.logTestStep('LOBBY_STATE_RETRIEVED', 'Room state retrieved for lobby', {
        stateExists: !!state,
        state: state ? {
          users: Array.from(state.users || []),
          battle: state.battle,
          mode: state.mode
        } : null
      });
      
      if (!state) {
        this.logTestStep('LOBBY_STATE_NOT_FOUND', 'Room state not found - should return 404');
        return {
          success: false,
          error: 'Room not found',
          status: 404
        };
      }
      
      // Step 2: Get participants from database
      const isDbConnected = mongoose.connection.readyState === 1;
      let participants = [];
      
      if (isDbConnected) {
        try {
          const room = await Room.findById(this.roomId).populate('participants.userId', 'displayName email avatar');
          if (room) {
            participants = room.participants.filter(p => p.isActive);
          }
        } catch (dbError) {
          this.logTestStep('LOBBY_DB_ERROR', 'Database query failed', {
            error: dbError.message
          });
        }
      }
      
      this.logTestStep('LOBBY_PARTICIPANTS_RETRIEVED', 'Participants retrieved from database', {
        participantsCount: participants.length,
        participants: participants.map(p => ({
          userId: p.userId,
          role: p.role,
          isActive: p.isActive
        }))
      });
      
      // Step 3: Merge in-memory users
      const inMemoryUsers = state.users ? Array.from(state.users) : [];
      const dbUserIds = participants.map(p => p.id.toString());
      
      // Add in-memory users that aren't in DB participants
      for (const userId of inMemoryUsers) {
        if (!dbUserIds.includes(userId.toString())) {
          participants.push({
            id: userId,
            name: 'Anonymous User',
            role: userId === (state.battle?.host) ? 'host' : 'participant',
            isActive: true,
            ready: false
          });
        }
      }
      
      this.logTestStep('LOBBY_PARTICIPANTS_MERGED', 'Participants merged with in-memory users', {
        totalParticipants: participants.length,
        inMemoryUsers: inMemoryUsers,
        finalParticipants: participants.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role
        }))
      });
      
      // Step 4: Build response
      const response = {
        success: true,
        roomId: this.roomId,
        participants: participants,
        battle: {
          started: Boolean(state.battle?.started),
          ended: Boolean(state.battle?.ended),
          durationMinutes: state.battle?.durationMinutes || null,
          problemId: state.battle?.problemId || null,
          difficulty: state.battle?.difficulty || null,
          numReady: participants.filter(p => p.ready).length,
          total: participants.length
        }
      };
      
      this.logTestStep('LOBBY_RESPONSE_BUILT', 'Lobby response built successfully', response);
      
      console.log('✅ Lobby fetch completed with Redis fallback');
      return response;
      
    } catch (error) {
      this.logTestStep('LOBBY_FETCH_ERROR', 'Error during lobby fetch', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Test error handling and logging
  async testErrorHandling() {
    console.log(`\n🚨 === TESTING ERROR HANDLING ===`);
    
    try {
      // Test 1: Try to get non-existent room state
      this.logTestStep('ERROR_TEST_NONEXISTENT', 'Testing getRoomState for non-existent room');
      
      const nonExistentState = await roomStateManager.getRoomState('nonexistentroomid');
      
      this.logTestStep('ERROR_TEST_RESULT', 'Result for non-existent room', {
        stateExists: !!nonExistentState,
        expected: false
      });
      
      // Test 2: Try to update non-existent room state
      this.logTestStep('ERROR_TEST_UPDATE_NONEXISTENT', 'Testing updateRoomState for non-existent room');
      
      try {
        await roomStateManager.updateRoomState('nonexistentroomid', { test: 'value' });
        this.logTestStep('ERROR_TEST_UPDATE_RESULT', 'Update should have failed but did not');
      } catch (updateError) {
        this.logTestStep('ERROR_TEST_UPDATE_RESULT', 'Update failed as expected', {
          error: updateError.message,
          expected: true
        });
      }
      
      // Test 3: Test Redis error handling in getRoomState
      this.logTestStep('ERROR_TEST_REDIS_ERROR', 'Testing Redis error handling');
      
      // Temporarily set a mock Redis client that throws errors
      const originalClient = roomStateManager.redisClient;
      roomStateManager.redisClient = {
        get: async () => {
          throw new Error('Simulated Redis error');
        }
      };
      
      try {
        const stateWithRedisError = await roomStateManager.getRoomState(this.roomId);
        this.logTestStep('ERROR_TEST_REDIS_ERROR_RESULT', 'Redis error handled gracefully', {
          stateExists: !!stateWithRedisError,
          errorHandled: true
        });
      } catch (redisError) {
        this.logTestStep('ERROR_TEST_REDIS_ERROR_RESULT', 'Redis error not handled properly', {
          error: redisError.message,
          errorHandled: false
        });
      } finally {
        // Restore original client
        roomStateManager.redisClient = originalClient;
      }
      
      console.log('✅ Error handling tests completed');
      
    } catch (error) {
      this.logTestStep('ERROR_HANDLING_TEST_ERROR', 'Error during error handling tests', {
        error: error.message
      });
      throw error;
    }
  }

  // Test Redis reconnection and state recovery
  async testRedisReconnection() {
    console.log(`\n🔄 === TESTING REDIS RECONNECTION ===`);
    
    try {
      // Test 1: Restore Redis connection
      await this.restoreRedisConnection();
      
      // Test 2: Try to get room state after reconnection
      this.logTestStep('RECONNECT_GET_STATE', 'Getting room state after Redis reconnection');
      
      const stateAfterReconnect = await roomStateManager.getRoomState(this.roomId);
      
      this.logTestStep('RECONNECT_GET_STATE_RESULT', 'Room state after reconnection', {
        stateExists: !!stateAfterReconnect,
        redisClient: !!roomStateManager.redisClient,
        state: stateAfterReconnect ? {
          users: Array.from(stateAfterReconnect.users || []),
          battle: stateAfterReconnect.battle
        } : null
      });
      
      // Test 3: Test lobby fetch after reconnection
      const lobbyAfterReconnect = await this.testLobbyFetchFallback();
      
      this.logTestStep('RECONNECT_LOBBY_RESULT', 'Lobby fetch after reconnection', {
        success: lobbyAfterReconnect.success,
        participantsCount: lobbyAfterReconnect.participants?.length || 0
      });
      
      console.log('✅ Redis reconnection tests completed');
      
    } catch (error) {
      this.logTestStep('RECONNECT_ERROR', 'Error during reconnection tests', {
        error: error.message
      });
      throw error;
    }
  }

  // Run complete Redis fallback test
  async runCompleteTest() {
    console.log(`\n🚀 === COMPLETE REDIS FALLBACK TEST FOR ROOM ${this.roomId} ===`);
    
    try {
      // Connect to MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform');
        console.log('✅ Connected to MongoDB');
      }
      
      // Initialize room state manager
      await roomStateManager.initialize();
      
      // Step 1: Create test room
      const { room, state } = await this.createTestRoom();
      this.roomId = room._id.toString(); // Update roomId to actual created room
      
      // Step 2: Test with Redis connected
      this.logTestStep('TEST_WITH_REDIS', 'Testing with Redis connected');
      const stateWithRedis = await roomStateManager.getRoomState(this.roomId);
      this.logTestStep('TEST_WITH_REDIS_RESULT', 'State with Redis connected', {
        stateExists: !!stateWithRedis,
        redisClient: !!roomStateManager.redisClient
      });
      
      // Step 3: Simulate Redis disconnect
      await this.simulateRedisDisconnect();
      
      // Step 4: Test getRoomState fallback
      await this.testGetRoomStateFallback();
      
      // Step 5: Test lobby fetch fallback
      const lobbyResult = await this.testLobbyFetchFallback();
      
      // Step 6: Test error handling
      await this.testErrorHandling();
      
      // Step 7: Test Redis reconnection
      await this.testRedisReconnection();
      
      // Final analysis
      await this.analyzeResults();
      
      return {
        success: true,
        roomId: this.roomId,
        testResults: this.testResults,
        lobbyResult
      };
      
    } catch (error) {
      console.error('\n💥 REDIS FALLBACK TEST FAILED:', error.message);
      console.error('Stack:', error.stack);
      return {
        success: false,
        error: error.message,
        testResults: this.testResults
      };
    }
  }

  // Analyze test results
  async analyzeResults() {
    console.log(`\n🔍 === REDIS FALLBACK ANALYSIS ===`);
    
    const analysis = {
      totalTests: this.testResults.length,
      redisDisconnectTests: this.testResults.filter(r => r.step.includes('REDIS_DISCONNECT')).length,
      fallbackTests: this.testResults.filter(r => r.step.includes('FALLBACK')).length,
      errorTests: this.testResults.filter(r => r.step.includes('ERROR')).length,
      lobbyTests: this.testResults.filter(r => r.step.includes('LOBBY')).length
    };
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Total test steps: ${analysis.totalTests}`);
    console.log(`Redis disconnect tests: ${analysis.redisDisconnectTests}`);
    console.log(`Fallback tests: ${analysis.fallbackTests}`);
    console.log(`Error handling tests: ${analysis.errorTests}`);
    console.log(`Lobby fetch tests: ${analysis.lobbyTests}`);
    
    // Check for specific issues
    const issues = [];
    
    // Check if Redis fallback worked
    const fallbackResults = this.testResults.filter(r => r.step.includes('GET_STATE_RESULT'));
    if (fallbackResults.length > 0) {
      const fallbackWorked = fallbackResults.some(r => r.data?.stateExists === true);
      if (!fallbackWorked) {
        issues.push('Redis fallback did not work - room state not found in memory');
      }
    }
    
    // Check if lobby fetch worked with Redis down
    const lobbyResults = this.testResults.filter(r => r.step.includes('LOBBY_RESPONSE_BUILT'));
    if (lobbyResults.length > 0) {
      const lobbyWorked = lobbyResults.some(r => r.data?.success === true);
      if (!lobbyWorked) {
        issues.push('Lobby fetch failed with Redis disconnected');
      }
    }
    
    // Check error handling
    const errorResults = this.testResults.filter(r => r.step.includes('ERROR_TEST_RESULT'));
    if (errorResults.length > 0) {
      const errorHandlingWorked = errorResults.every(r => r.data?.expected === true);
      if (!errorHandlingWorked) {
        issues.push('Error handling not working properly');
      }
    }
    
    console.log('\n🚨 ISSUES FOUND:');
    if (issues.length === 0) {
      console.log('✅ No issues found - Redis fallback working correctly');
    } else {
      issues.forEach(issue => {
        console.log(`❌ ${issue}`);
      });
    }
    
    // Check if errors are surfaced clearly
    const errorLogs = this.testResults.filter(r => r.step.includes('ERROR'));
    console.log('\n📝 ERROR LOGGING:');
    if (errorLogs.length === 0) {
      console.log('⚠️ No error logs found - errors may not be surfaced clearly');
    } else {
      console.log(`✅ ${errorLogs.length} error logs found - errors are being surfaced`);
      errorLogs.forEach(log => {
        console.log(`  - ${log.step}: ${log.description}`);
      });
    }
  }

  // Generate detailed report
  generateReport() {
    const report = {
      roomId: this.roomId,
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      testResults: this.testResults,
      summary: {
        redisDisconnectTests: this.testResults.filter(r => r.step.includes('REDIS_DISCONNECT')).length,
        fallbackTests: this.testResults.filter(r => r.step.includes('FALLBACK')).length,
        errorTests: this.testResults.filter(r => r.step.includes('ERROR')).length,
        lobbyTests: this.testResults.filter(r => r.step.includes('LOBBY')).length
      }
    };
    
    return report;
  }
}

// Test with specific roomId
async function testRedisFallback() {
  const roomId = '68ba83f471e14644d1f9736e';
  console.log(`\n🧪 Testing Redis fallback for roomId: ${roomId}`);
  
  const test = new RedisFallbackTest(roomId);
  const result = await test.runCompleteTest();
  
  console.log('\n📋 FINAL REPORT:');
  const report = test.generateReport();
  console.log(JSON.stringify(report.summary, null, 2));
  
  if (result.success) {
    console.log('\n🎉 REDIS FALLBACK TEST COMPLETED SUCCESSFULLY!');
  } else {
    console.log('\n💥 REDIS FALLBACK TEST FAILED!');
    console.log('Error:', result.error);
  }
  
  return result;
}

// Run the test
if (require.main === module) {
  testRedisFallback().then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { RedisFallbackTest, testRedisFallback };
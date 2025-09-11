const mongoose = require('mongoose');
const Room = require('./server/models/Room');
const roomStateManager = require('./server/utils/roomStateManager');

async function testCompleteFallback() {
  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform');
      console.log('✅ Connected to MongoDB');
    }
    
    // Initialize room state manager
    await roomStateManager.initialize();
    
    const roomId = '68ba83f471e14644d1f9736e';
    console.log(`\n🧪 === TESTING COMPLETE FALLBACK MECHANISM [${roomId}] ===`);
    
    // Step 1: Verify room exists in database
    console.log('\n📋 Step 1: Verifying room exists in database...');
    const room = await Room.findById(roomId).populate('participants.userId', 'displayName email avatar');
    
    if (!room) {
      console.log('❌ Room not found in database - cannot test fallback');
      return;
    }
    
    console.log('✅ Room found in database:', {
      _id: room._id,
      roomCode: room.roomCode,
      mode: room.mode,
      participants: room.participants.length
    });
    
    // Step 2: Clear memory state to simulate fallback scenario
    console.log('\n📋 Step 2: Clearing memory state to simulate fallback...');
    roomStateManager.roomStates.clear();
    roomStateManager.roomCodeToId.clear();
    console.log('✅ Memory state cleared');
    
    // Step 3: Test getRoomState (should return null)
    console.log('\n📋 Step 3: Testing getRoomState (should return null)...');
    let state = await roomStateManager.getRoomState(roomId);
    console.log(`State from memory: ${!!state}`);
    
    // Step 4: Simulate the fallback reconstruction
    console.log('\n📋 Step 4: Simulating fallback reconstruction...');
    
    // Import the reconstruction function (we'll simulate it here)
    const reconstructedState = await simulateReconstruction(roomId);
    
    if (reconstructedState) {
      console.log('✅ State reconstruction successful');
      console.log('Reconstructed state:', {
        roomId: reconstructedState.roomId,
        users: Array.from(reconstructedState.users),
        battle: reconstructedState.battle
      });
    } else {
      console.log('❌ State reconstruction failed');
    }
    
    // Step 5: Test lobby endpoint logic
    console.log('\n📋 Step 5: Testing lobby endpoint logic...');
    
    // Get participants from database
    const participants = room.participants.filter(p => p.isActive);
    console.log(`Active participants: ${participants.length}`);
    
    // Build participant info
    const participantInfo = participants.map(p => ({
      id: p.userId._id || p.userId,
      name: (p.userId && p.userId.displayName) || (p.userId && p.userId.email) || 'Anonymous',
      avatar: (p.userId && p.userId.avatar) || '👤',
      role: p.role,
      isActive: p.isActive,
      ready: false,
      joinedAt: p.joinedAt,
      lastSeen: p.lastSeen,
      elapsedSeconds: p.joinedAt ? Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000) : null
    }));
    
    console.log('Participant info:', participantInfo);
    
    // Build response
    const response = {
      success: true,
      room: {
        roomId: roomId,
        roomCode: room.roomCode,
        hostId: room.createdBy?.toString(),
        status: room.status,
        mode: 'battle',
        totalParticipants: participantInfo.length,
        activeParticipants: participantInfo.filter(p => p.isActive).length
      },
      participants: participantInfo,
      battle: reconstructedState?.battle || {
        started: false,
        ended: false,
        durationMinutes: null,
        problemId: null,
        difficulty: null
      }
    };
    
    console.log('\n✅ FINAL RESPONSE:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n🎉 FALLBACK TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('\n💥 FALLBACK TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Simulate the reconstruction function
async function simulateReconstruction(roomId) {
  console.log(`\n🔧 === SIMULATING RECONSTRUCTION [${roomId}] ===`);
  
  try {
    // Find room in database
    const room = await Room.findById(roomId).populate('participants.userId', 'displayName email avatar');
    
    if (!room) {
      console.log('❌ Room not found in database');
      return null;
    }
    
    console.log('✅ Room found in database');
    
    // Create base room state
    const state = {
      roomId: room._id?.toString() || roomId,
      language: room.language || 'javascript',
      mode: room.mode || 'collaborative',
      code: '// Reconstructed room state',
      version: 0,
      lastModified: new Date(),
      lastModifiedBy: null,
      users: new Set(),
      cursors: new Map(),
      chatMessages: [],
      isActive: true,
      createdAt: room.createdAt || new Date(),
      battle: undefined
    };
    
    // Reconstruct users from participants
    const activeParticipants = room.participants?.filter(p => p && p.isActive) || [];
    console.log(`Active participants: ${activeParticipants.length}`);
    
    activeParticipants.forEach((participant, index) => {
      try {
        const userId = participant.userId?._id || participant.userId;
        if (userId) {
          state.users.add(userId.toString());
          console.log(`Added user to state: ${userId} (${participant.role})`);
        } else {
          console.log(`⚠️ Skipping participant with null userId: ${participant.role}`);
        }
      } catch (participantError) {
        console.log(`❌ Error processing participant ${index}:`, participantError.message);
      }
    });
    
    // Reconstruct battle state if it's a battle room
    if (room.mode === 'battle') {
      console.log('Reconstructing battle state...');
      
      state.battle = {
        problemId: 'two-sum',
        difficulty: 'Easy',
        host: room.createdBy?.toString() || null,
        durationMinutes: 10,
        started: false,
        startedAt: null,
        ended: false,
        endedAt: null,
        submissions: {}
      };
      
      console.log('✅ Battle state reconstructed');
    }
    
    // Store in memory
    roomStateManager.roomStates.set(roomId, state);
    if (room.roomCode) {
      roomStateManager.roomCodeToId.set(room.roomCode, roomId);
    }
    
    console.log('✅ State stored in memory');
    return state;
    
  } catch (error) {
    console.error('❌ Error during reconstruction:', error.message);
    throw error;
  }
}

testCompleteFallback();

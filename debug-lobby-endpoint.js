const mongoose = require('mongoose');
const Room = require('./server/models/Room');
const roomStateManager = require('./server/utils/roomStateManager');

// Enhanced debugging version of the lobby endpoint logic
async function debugLobbyEndpoint(roomId) {
  console.log(`\n🔍 === DEBUGGING LOBBY ENDPOINT FOR ROOM: ${roomId} ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Step 1: Validate roomId format
    console.log('\n📋 STEP 1: RoomId Validation');
    const isValidHexId = (s) => typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);
    console.log(`RoomId: "${roomId}"`);
    console.log(`Type: ${typeof roomId}`);
    console.log(`Length: ${roomId ? roomId.length : 'null'}`);
    console.log(`Is valid hex ID: ${isValidHexId(roomId)}`);
    
    if (!isValidHexId(roomId)) {
      console.log('❌ INVALID ROOM ID FORMAT');
      return { success: false, error: 'Invalid roomId', step: 'validation' };
    }
    console.log('✅ RoomId validation passed');
    
    // Step 2: Check database connection
    console.log('\n📋 STEP 2: Database Connection Check');
    const isDbConnected = mongoose.connection.readyState === 1;
    console.log(`MongoDB connection state: ${mongoose.connection.readyState}`);
    console.log(`Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting`);
    console.log(`Is DB connected: ${isDbConnected}`);
    
    // Step 3: Get room state from memory/Redis
    console.log('\n📋 STEP 3: Get Room State from Memory/Redis');
    console.log('Calling roomStateManager.getRoomState...');
    let state;
    try {
      state = await roomStateManager.getRoomState(roomId);
      console.log('✅ Room state retrieved successfully');
      console.log(`State exists: ${!!state}`);
      if (state) {
        console.log(`State keys: ${Object.keys(state).join(', ')}`);
        console.log(`Has battle property: ${!!state.battle}`);
        if (state.battle) {
          console.log(`Battle keys: ${Object.keys(state.battle).join(', ')}`);
          console.log(`Battle started: ${state.battle.started}`);
          console.log(`Battle ended: ${state.battle.ended}`);
          console.log(`Battle problemId: ${state.battle.problemId}`);
          console.log(`Battle host: ${state.battle.host}`);
        }
        console.log(`Has users property: ${!!state.users}`);
        if (state.users) {
          console.log(`Users type: ${state.users.constructor.name}`);
          console.log(`Users size: ${state.users.size || state.users.length || 'unknown'}`);
          console.log(`Users content: ${Array.from(state.users).join(', ')}`);
        }
      } else {
        console.log('❌ NO ROOM STATE FOUND');
        return { success: false, error: 'Room not found', step: 'state_retrieval' };
      }
    } catch (stateError) {
      console.log('❌ ERROR getting room state:', stateError.message);
      console.log('Stack:', stateError.stack);
      return { success: false, error: 'Failed to get room state', step: 'state_retrieval', details: stateError.message };
    }
    
    // Step 4: Get battle state
    console.log('\n📋 STEP 4: Extract Battle State');
    const battleState = state.battle || {};
    console.log(`Battle state extracted: ${!!battleState}`);
    console.log(`Battle state content:`, JSON.stringify(battleState, null, 2));
    
    // Step 5: Get participants from database
    console.log('\n📋 STEP 5: Get Participants from Database');
    let dbParticipants = [];
    if (isDbConnected) {
      try {
        console.log('Querying Room.findById with populate...');
        const room = await Room.findById(roomId).populate('participants.userId', 'displayName email avatar');
        console.log(`Room found in DB: ${!!room}`);
        if (room) {
          console.log(`Room participants count: ${room.participants ? room.participants.length : 0}`);
          console.log(`Room participants:`, room.participants);
          
          const now = Date.now();
          const activeParticipants = room.participants.filter(p => p.isActive);
          console.log(`Active participants count: ${activeParticipants.length}`);
          
          activeParticipants.forEach((p, index) => {
            const userId = p.userId && p.userId._id ? p.userId._id : p.userId;
            const participant = {
              id: userId,
              name: (p.userId && p.userId.displayName) || (p.userId && p.userId.email) || 'Anonymous',
              avatar: (p.userId && p.userId.avatar) || '👤',
              role: p.role,
              isActive: p.isActive,
              joinedAt: p.joinedAt,
              lastSeen: p.lastSeen,
              elapsedSeconds: p.joinedAt ? Math.floor((now - new Date(p.joinedAt).getTime()) / 1000) : null,
              ready: false
            };
            dbParticipants.push(participant);
            console.log(`Participant ${index + 1}:`, participant);
          });
        } else {
          console.log('❌ Room not found in database');
        }
      } catch (dbError) {
        console.log('❌ Database query failed:', dbError.message);
        console.log('Stack:', dbError.stack);
      }
    } else {
      console.log('⚠️ Database not connected, skipping DB participant query');
    }
    
    // Step 6: Get in-memory users
    console.log('\n📋 STEP 6: Get In-Memory Users');
    const inMemoryUsers = state.users ? Array.from(state.users) : [];
    console.log(`In-memory users count: ${inMemoryUsers.length}`);
    console.log(`In-memory users: ${inMemoryUsers.join(', ')}`);
    
    // Step 7: Merge participants
    console.log('\n📋 STEP 7: Merge Participants from DB and Memory');
    const participants = [...dbParticipants];
    const dbUserIds = participants.map(p => p.id.toString());
    console.log(`DB user IDs: ${dbUserIds.join(', ')}`);
    
    // Add in-memory users that aren't in DB participants
    for (const userId of inMemoryUsers) {
      if (!dbUserIds.includes(userId.toString())) {
        const inMemoryParticipant = {
          id: userId,
          name: 'Anonymous User',
          avatar: '👤',
          role: userId === (state.battle?.host) ? 'host' : 'participant',
          isActive: true,
          joinedAt: new Date(),
          lastSeen: new Date(),
          elapsedSeconds: 0,
          ready: false
        };
        participants.push(inMemoryParticipant);
        console.log(`Added in-memory participant:`, inMemoryParticipant);
      } else {
        console.log(`User ${userId} already exists in DB participants`);
      }
    }
    
    console.log(`Total participants after merge: ${participants.length}`);
    
    // Step 8: Get room info
    console.log('\n📋 STEP 8: Get Room Info');
    let room = null;
    if (isDbConnected) {
      try {
        console.log('Querying Room.findById for room info...');
        room = await Room.findById(roomId).select('roomCode status createdBy');
        console.log(`Room found in DB: ${!!room}`);
        if (room) {
          console.log(`Room code: ${room.roomCode}`);
          console.log(`Room status: ${room.status}`);
          console.log(`Room createdBy: ${room.createdBy}`);
        }
      } catch (dbError) {
        console.log('❌ Database query failed for room info:', dbError.message);
      }
    }
    
    // If no room found in DB, create from in-memory state
    if (!room) {
      console.log('⚠️ No room found in DB, creating from in-memory state');
      room = {
        _id: roomId,
        roomCode: 'TEST' + roomId.slice(-4).toUpperCase(),
        status: 'active',
        createdBy: battleState.host || null
      };
      console.log('Created room from state:', room);
    }
    
    // Step 9: Handle ready status
    console.log('\n📋 STEP 9: Handle Ready Status');
    const readyMap = battleState.ready || {};
    console.log(`Ready map:`, readyMap);
    
    // Update ready status for participants
    const finalParticipants = participants.map(p => {
      const ready = Boolean(readyMap[p.id.toString()]);
      console.log(`Participant ${p.id} ready status: ${ready}`);
      return {
        ...p,
        ready
      };
    });
    
    // Step 10: Build response
    console.log('\n📋 STEP 10: Build Response');
    const response = {
      success: true,
      roomId,
      roomCode: room.roomCode,
      hostId: room.createdBy?.toString?.() || null,
      status: room.status,
      mode: 'battle',
      participants: finalParticipants,
      battle: {
        started: Boolean(battleState.started),
        ended: Boolean(battleState.ended),
        durationMinutes: battleState.durationMinutes || null,
        problemId: battleState.problemId || null,
        difficulty: battleState.difficulty || null,
        numReady: finalParticipants.filter(p => p.ready).length,
        total: finalParticipants.length
      }
    };
    
    console.log('\n✅ FINAL RESPONSE:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
    
  } catch (error) {
    console.log('\n❌ UNEXPECTED ERROR:');
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    return { 
      success: false, 
      error: 'Unexpected error', 
      step: 'unexpected', 
      details: error.message,
      stack: error.stack
    };
  }
}

// Test with the specific roomId
async function testSpecificRoom() {
  const roomId = '68ba83f471e14644d1f9736e';
  console.log(`\n🧪 Testing with roomId: ${roomId}`);
  
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform');
      console.log('✅ Connected to MongoDB');
    }
    
    const result = await debugLobbyEndpoint(roomId);
    
    console.log('\n🏁 FINAL RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.log(`\n💥 ENDPOINT FAILED AT STEP: ${result.step}`);
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details: ${result.details}`);
      }
    } else {
      console.log('\n🎉 ENDPOINT SUCCESSFUL!');
    }
    
  } catch (error) {
    console.log('\n💥 CRITICAL ERROR:');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    // Don't close connection as it might be used by the main app
    console.log('\n🔚 Debug session completed');
  }
}

// Run the test
if (require.main === module) {
  testSpecificRoom();
}

module.exports = { debugLobbyEndpoint, testSpecificRoom };

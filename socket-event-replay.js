const mongoose = require('mongoose');
const Room = require('./server/models/Room');
const roomStateManager = require('./server/utils/roomStateManager');
const io = require('socket.io-client');

// Enhanced socket event replay for roomId 68ba83f471e14644d1f9736e
class SocketEventReplay {
  constructor(roomId) {
    this.roomId = roomId;
    this.events = [];
    this.stateSnapshots = [];
    this.participantSnapshots = [];
  }

  // Log event with timestamp
  logEvent(eventType, data, step) {
    const timestamp = new Date().toISOString();
    const event = {
      timestamp,
      eventType,
      step,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      roomId: this.roomId
    };
    this.events.push(event);
    console.log(`\n🔔 [${timestamp}] ${eventType} - Step ${step}`);
    console.log(JSON.stringify(data, null, 2));
  }

  // Take state snapshot
  async takeStateSnapshot(label) {
    try {
      const state = await roomStateManager.getRoomState(this.roomId);
      const room = await Room.findById(this.roomId);
      
      const snapshot = {
        timestamp: new Date().toISOString(),
        label,
        roomId: this.roomId,
        state: state ? {
          ...state,
          users: state.users ? Array.from(state.users) : [],
          cursors: state.cursors ? Array.from(state.cursors.entries()) : []
        } : null,
        room: room ? {
          _id: room._id,
          roomCode: room.roomCode,
          participants: room.participants,
          status: room.status,
          createdBy: room.createdBy
        } : null,
        memoryState: {
          roomStates: Array.from(roomStateManager.roomStates.entries()).map(([id, state]) => ({
            roomId: id,
            users: Array.from(state.users || []),
            mode: state.mode,
            battle: state.battle
          })),
          roomCodeToId: Array.from(roomStateManager.roomCodeToId.entries())
        }
      };
      
      this.stateSnapshots.push(snapshot);
      console.log(`\n📸 STATE SNAPSHOT [${label}]`);
      console.log(`State exists: ${!!state}`);
      console.log(`Room exists: ${!!room}`);
      if (state) {
        console.log(`State users: ${Array.from(state.users || []).join(', ')}`);
        console.log(`State battle: ${JSON.stringify(state.battle, null, 2)}`);
      }
      if (room) {
        console.log(`Room participants: ${room.participants.length}`);
        console.log(`Room participants:`, room.participants.map(p => ({
          userId: p.userId,
          role: p.role,
          isActive: p.isActive
        })));
      }
      
      return snapshot;
    } catch (error) {
      console.error(`Error taking state snapshot [${label}]:`, error.message);
      return null;
    }
  }

  // Simulate battle room creation
  async simulateBattleRoomCreation() {
    console.log(`\n🏗️ === SIMULATING BATTLE ROOM CREATION ===`);
    
    // Step 1: Initial state
    await this.takeStateSnapshot('BEFORE_CREATION');
    
    // Step 2: Simulate POST /battle/create
    const creatorId = '68ba83f471e14644d1f9736e'; // Using roomId as creator for testing
    const battleData = {
      difficulty: 'Easy',
      questionSelection: 'random',
      battleTime: 10
    };
    
    this.logEvent('BATTLE_CREATE_REQUEST', battleData, '1');
    
    try {
      // Simulate room creation
      const { room, state } = await roomStateManager.createRoom({
        name: `Battle: Two Sum`,
        description: `Battle room for Two Sum (Easy)`,
        language: 'javascript',
        mode: 'battle',
        createdBy: creatorId,
        isTemporary: true
      });
      
      this.logEvent('ROOM_CREATED', {
        roomId: room._id,
        roomCode: room.roomCode,
        createdBy: room.createdBy,
        mode: room.mode
      }, '2');
      
      // Step 3: Update room state with battle info
      await roomStateManager.updateRoomState(room._id.toString(), {
        mode: 'battle',
        battle: {
          problemId: 'two-sum',
          difficulty: 'Easy',
          host: creatorId,
          durationMinutes: 10,
          started: false,
          startedAt: null,
          ended: false,
          endedAt: null,
          submissions: {}
        }
      });
      
      this.logEvent('BATTLE_STATE_UPDATED', {
        roomId: room._id,
        battle: {
          problemId: 'two-sum',
          difficulty: 'Easy',
          host: creatorId,
          durationMinutes: 10,
          started: false,
          ended: false
        }
      }, '3');
      
      await this.takeStateSnapshot('AFTER_CREATION');
      
      return { room, state };
    } catch (error) {
      this.logEvent('BATTLE_CREATE_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  }

  // Simulate user joining battle room
  async simulateUserJoin(roomCode, userId) {
    console.log(`\n👥 === SIMULATING USER JOIN ===`);
    
    await this.takeStateSnapshot('BEFORE_JOIN');
    
    // Step 1: Simulate POST /battle/join
    this.logEvent('BATTLE_JOIN_REQUEST', { roomCode, userId }, '4');
    
    try {
      const { room, state } = await roomStateManager.joinRoomByCode(roomCode, userId);
      
      this.logEvent('USER_JOINED_ROOM', {
        roomId: room._id,
        userId,
        roomCode: room.roomCode
      }, '5');
      
      await this.takeStateSnapshot('AFTER_JOIN');
      
      return { room, state };
    } catch (error) {
      this.logEvent('BATTLE_JOIN_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  }

  // Simulate socket join-room event
  async simulateSocketJoinRoom(roomId, userId) {
    console.log(`\n🔌 === SIMULATING SOCKET JOIN-ROOM EVENT ===`);
    
    await this.takeStateSnapshot('BEFORE_SOCKET_JOIN');
    
    // Step 1: Simulate socket join-room event
    this.logEvent('SOCKET_JOIN_ROOM', { roomId, userId }, '6');
    
    try {
      // Simulate the socket handler logic
      const room = await Room.findById(roomId);
      if (!room) {
        this.logEvent('SOCKET_JOIN_ERROR', { error: 'Room not found' }, 'ERROR');
        return;
      }
      
      // Add user to room participants (simulate room.addParticipant)
      await room.addParticipant(userId);
      
      this.logEvent('USER_ADDED_TO_PARTICIPANTS', {
        roomId,
        userId,
        participantsCount: room.participants.length
      }, '7');
      
      // Simulate socket room join
      this.logEvent('SOCKET_ROOM_JOINED', { roomId, socketRoom: `room:${roomId}` }, '8');
      
      // Simulate participant-joined event emission
      this.logEvent('PARTICIPANT_JOINED_EMITTED', {
        userId,
        roomId,
        event: 'participant-joined'
      }, '9');
      
      await this.takeStateSnapshot('AFTER_SOCKET_JOIN');
      
      return room;
    } catch (error) {
      this.logEvent('SOCKET_JOIN_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  }

  // Simulate lobby fetch
  async simulateLobbyFetch() {
    console.log(`\n📋 === SIMULATING LOBBY FETCH ===`);
    
    await this.takeStateSnapshot('BEFORE_LOBBY_FETCH');
    
    // Step 1: Simulate GET /battle/:roomId/lobby
    this.logEvent('LOBBY_FETCH_REQUEST', { roomId: this.roomId }, '10');
    
    try {
      // Simulate the lobby endpoint logic
      const state = await roomStateManager.getRoomState(this.roomId);
      if (!state) {
        this.logEvent('LOBBY_FETCH_ERROR', { error: 'Room not found' }, 'ERROR');
        return null;
      }
      
      this.logEvent('ROOM_STATE_RETRIEVED', {
        roomId: this.roomId,
        stateExists: !!state,
        users: state.users ? Array.from(state.users) : [],
        battle: state.battle
      }, '11');
      
      // Get participants from database
      const room = await Room.findById(this.roomId);
      const participants = room ? room.participants.filter(p => p.isActive) : [];
      
      this.logEvent('PARTICIPANTS_RETRIEVED', {
        roomId: this.roomId,
        participantsCount: participants.length,
        participants: participants.map(p => ({
          userId: p.userId,
          role: p.role,
          isActive: p.isActive
        }))
      }, '12');
      
      // Build response
      const response = {
        success: true,
        roomId: this.roomId,
        roomCode: room ? room.roomCode : 'UNKNOWN',
        participants: participants.length,
        battle: state.battle || null
      };
      
      this.logEvent('LOBBY_RESPONSE_BUILT', response, '13');
      
      await this.takeStateSnapshot('AFTER_LOBBY_FETCH');
      
      return response;
    } catch (error) {
      this.logEvent('LOBBY_FETCH_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  }

  // Run complete replay
  async runCompleteReplay() {
    console.log(`\n🚀 === COMPLETE SOCKET EVENT REPLAY FOR ROOM ${this.roomId} ===`);
    
    try {
      // Connect to MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform');
        console.log('✅ Connected to MongoDB');
      }
      
      // Initialize room state manager
      await roomStateManager.initialize();
      
      // Step 1: Create battle room
      const { room, state } = await this.simulateBattleRoomCreation();
      const roomCode = room.roomCode;
      const roomId = room._id.toString();
      
      // Step 2: Join with first user (creator)
      await this.simulateUserJoin(roomCode, room.createdBy.toString());
      
      // Step 3: Socket join for creator
      await this.simulateSocketJoinRoom(roomId, room.createdBy.toString());
      
      // Step 4: Join with second user
      const secondUserId = '507f1f77bcf86cd799439011'; // Mock user ID
      await this.simulateUserJoin(roomCode, secondUserId);
      
      // Step 5: Socket join for second user
      await this.simulateSocketJoinRoom(roomId, secondUserId);
      
      // Step 6: Fetch lobby status
      const lobbyResponse = await this.simulateLobbyFetch();
      
      // Final analysis
      await this.analyzeResults();
      
      return {
        success: true,
        roomId,
        roomCode,
        events: this.events,
        stateSnapshots: this.stateSnapshots,
        lobbyResponse
      };
      
    } catch (error) {
      console.error('\n💥 REPLAY FAILED:', error.message);
      console.error('Stack:', error.stack);
      return {
        success: false,
        error: error.message,
        events: this.events,
        stateSnapshots: this.stateSnapshots
      };
    }
  }

  // Analyze results and identify issues
  async analyzeResults() {
    console.log(`\n🔍 === ANALYSIS RESULTS ===`);
    
    // Check for state consistency issues
    const stateIssues = [];
    const participantIssues = [];
    
    for (let i = 1; i < this.stateSnapshots.length; i++) {
      const prev = this.stateSnapshots[i - 1];
      const curr = this.stateSnapshots[i];
      
      // Check state consistency
      if (prev.state && curr.state) {
        const prevUsers = prev.state.users || [];
        const currUsers = curr.state.users || [];
        
        if (prevUsers.length !== currUsers.length) {
          stateIssues.push({
            step: `${prev.label} -> ${curr.label}`,
            issue: 'User count mismatch',
            prev: prevUsers.length,
            curr: currUsers.length
          });
        }
      }
      
      // Check participant consistency
      if (prev.room && curr.room) {
        const prevParticipants = prev.room.participants || [];
        const currParticipants = curr.room.participants || [];
        
        if (prevParticipants.length !== currParticipants.length) {
          participantIssues.push({
            step: `${prev.label} -> ${curr.label}`,
            issue: 'Participant count mismatch',
            prev: prevParticipants.length,
            curr: currParticipants.length
          });
        }
      }
    }
    
    console.log('\n📊 STATE CONSISTENCY ISSUES:');
    if (stateIssues.length === 0) {
      console.log('✅ No state consistency issues found');
    } else {
      stateIssues.forEach(issue => {
        console.log(`❌ ${issue.step}: ${issue.issue} (${issue.prev} -> ${issue.curr})`);
      });
    }
    
    console.log('\n👥 PARTICIPANT CONSISTENCY ISSUES:');
    if (participantIssues.length === 0) {
      console.log('✅ No participant consistency issues found');
    } else {
      participantIssues.forEach(issue => {
        console.log(`❌ ${issue.step}: ${issue.issue} (${issue.prev} -> ${issue.curr})`);
      });
    }
    
    // Check for specific roomId issues
    const targetRoomSnapshots = this.stateSnapshots.filter(s => s.roomId === this.roomId);
    console.log(`\n🎯 TARGET ROOM SNAPSHOTS: ${targetRoomSnapshots.length}`);
    
    if (targetRoomSnapshots.length === 0) {
      console.log('❌ No snapshots found for target roomId - this indicates the room was never created or state was lost');
    } else {
      console.log('✅ Target room found in snapshots');
      targetRoomSnapshots.forEach(snapshot => {
        console.log(`  - ${snapshot.label}: State=${!!snapshot.state}, Room=${!!snapshot.room}`);
      });
    }
  }

  // Generate detailed report
  generateReport() {
    const report = {
      roomId: this.roomId,
      timestamp: new Date().toISOString(),
      totalEvents: this.events.length,
      totalSnapshots: this.stateSnapshots.length,
      events: this.events,
      stateSnapshots: this.stateSnapshots,
      summary: {
        creationEvents: this.events.filter(e => e.eventType.includes('CREATE')).length,
        joinEvents: this.events.filter(e => e.eventType.includes('JOIN')).length,
        socketEvents: this.events.filter(e => e.eventType.includes('SOCKET')).length,
        lobbyEvents: this.events.filter(e => e.eventType.includes('LOBBY')).length,
        errorEvents: this.events.filter(e => e.eventType.includes('ERROR')).length
      }
    };
    
    return report;
  }
}

// Test with specific roomId
async function testSocketEventReplay() {
  const roomId = '68ba83f471e14644d1f9736e';
  console.log(`\n🧪 Testing socket event replay for roomId: ${roomId}`);
  
  const replay = new SocketEventReplay(roomId);
  const result = await replay.runCompleteReplay();
  
  console.log('\n📋 FINAL REPORT:');
  const report = replay.generateReport();
  console.log(JSON.stringify(report.summary, null, 2));
  
  if (result.success) {
    console.log('\n🎉 REPLAY COMPLETED SUCCESSFULLY!');
  } else {
    console.log('\n💥 REPLAY FAILED!');
    console.log('Error:', result.error);
  }
  
  return result;
}

// Run the test
if (require.main === module) {
  testSocketEventReplay().then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { SocketEventReplay, testSocketEventReplay };

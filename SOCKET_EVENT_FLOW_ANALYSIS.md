# Socket Event Flow Analysis for Room 68ba83f471e14644d1f9736e

## Overview
This document analyzes the complete socket event flow for battle room creation, joining, and lobby status fetching to identify where participant and state updates might be inconsistent.

## Socket Event Flow

### 1. Battle Room Creation Flow

#### HTTP Endpoint: `POST /battle/create`
```javascript
// Step 1: Create room via roomStateManager
const { room, state } = await roomStateManager.createRoom({
  name: `Battle: ${problem.title}`,
  description: `Battle room for ${problem.title} (${difficulty})`,
  language: 'javascript',
  mode: 'battle',
  createdBy: creatorId,
  isTemporary: true
});

// Step 2: Update room state with battle info
await roomStateManager.updateRoomState(room._id.toString(), {
  mode: 'battle',
  battle: {
    problemId,
    difficulty: safeDifficulty,
    host: creatorId.toString(),
    durationMinutes: Math.max(1, Math.min(Number(battleTime) || 10, 180)),
    started: false,
    startedAt: null,
    ended: false,
    endedAt: null,
    submissions: {}
  }
});
```

#### Room State Manager: `createRoom()`
```javascript
// Database creation
room = new Room({
  name,
  description,
  roomCode,
  language,
  mode,
  createdBy,
  participants: [{ userId: createdBy, role: 'host' }], // ✅ Creator added to DB
  codeExpiresAt: isTemporary ? new Date(Date.now() + (24 * 60 * 60 * 1000)) : null
});

// In-memory state creation
const state = createRoomState(room._id.toString(), language, mode);
roomStates.set(room._id.toString(), state); // ✅ State stored in memory
roomCodeToId.set(roomCode, room._id.toString()); // ✅ Room code mapping

// Redis storage (if available)
if (redisClient) {
  await redisClient.setEx(`room:${room._id}`, 24 * 60 * 60, JSON.stringify(state));
  await redisClient.setEx(`roomcode:${roomCode}`, 24 * 60 * 60, room._id.toString());
}
```

### 2. User Join Flow

#### HTTP Endpoint: `POST /battle/join`
```javascript
// Step 1: Join room via roomStateManager
const { room, state } = await roomStateManager.joinRoomByCode(safeCode, userId);
```

#### Room State Manager: `joinRoomByCode()`
```javascript
// Database join
if (isDbConnected) {
  room = await Room.findByCode(roomCode);
  if (room) {
    await room.addParticipant(userId); // ✅ User added to DB participants
  }
}

// In-memory state join
let state = roomStates.get(room._id.toString());
if (!state) {
  // Try to load from Redis
  if (redisClient) {
    const redisState = await redisClient.get(`room:${room._id}`);
    if (redisState) {
      const parsedState = JSON.parse(redisState);
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
state.users.add(userId.toString()); // ✅ User added to in-memory state

// Update Redis
if (redisClient) {
  const stateForRedis = {
    ...state,
    users: Array.from(state.users),
    cursors: Array.from(state.cursors.entries())
  };
  await redisClient.setEx(`room:${room._id}`, 24 * 60 * 60, JSON.stringify(stateForRedis));
}
```

### 3. Socket Join Flow

#### Socket Event: `join-room`
```javascript
socket.on('join-room', async (data) => {
  const { roomId } = data;
  
  // Step 1: Find room in database
  const room = await Room.findById(roomId);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  // Step 2: Add user to room participants
  await room.addParticipant(socket.user._id); // ✅ User added to DB participants
  
  // Step 3: Join socket to room
  socket.join(`room:${roomId}`);
  
  // Step 4: Notify other participants
  socket.to(`room:${roomId}`).emit('user-joined-room', {
    userId: socket.user._id,
    displayName: socket.user.displayName,
    avatar: socket.user.avatar,
    joinedAt: new Date()
  });

  // Step 5: Emit participant-joined for battle rooms
  socket.to(`room:${roomId}`).emit('participant-joined', {
    userId: socket.user._id,
    displayName: socket.user.displayName,
    avatar: socket.user.avatar,
    joinedAt: new Date(),
    roomId: roomId
  });

  // Step 6: Send room info to user
  socket.emit('room-joined', {
    roomId,
    participants: room.participants.filter(p => p.isActive),
    currentActivity: room.currentActivity
  });
});
```

### 4. Lobby Fetch Flow

#### HTTP Endpoint: `GET /battle/:roomId/lobby`
```javascript
// Step 1: Get room state from memory/Redis
const state = await roomStateManager.getRoomState(roomId);

// Step 2: Get consistent participants
const participants = await getConsistentParticipants(roomId, state);

// Step 3: Get room info
let room = null;
if (isDbConnected) {
  room = await Room.findById(roomId).select('roomCode status createdBy');
}

// Step 4: Build response
const response = {
  success: true,
  roomId,
  roomCode: room.roomCode,
  participants,
  battle: {
    started: Boolean(battleState.started),
    ended: Boolean(battleState.ended),
    // ... other battle info
  }
};
```

#### Helper Function: `getConsistentParticipants()`
```javascript
const getConsistentParticipants = async (roomId, state) => {
  const participants = [];
  const isDbConnected = mongoose.connection.readyState === 1;
  
  // Get participants from database
  if (isDbConnected) {
    const room = await Room.findById(roomId).populate('participants.userId', 'displayName email avatar');
    if (room) {
      room.participants
        .filter(p => p.isActive)
        .forEach(p => {
          participants.push({
            id: p.userId._id,
            name: p.userId.displayName || p.userId.email || 'Anonymous',
            role: p.role,
            isActive: p.isActive,
            // ... other participant data
          });
        });
    }
  }
  
  // Merge in-memory users
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
        // ... other participant data
      });
    }
  }
  
  return participants;
};
```

## Potential Issues and Race Conditions

### 1. **State Synchronization Issues**

#### Issue: Database vs In-Memory State Mismatch
- **Problem**: User added to database participants but not to in-memory state
- **Cause**: `room.addParticipant()` updates DB but doesn't update `state.users`
- **Impact**: Lobby shows inconsistent participant counts

#### Issue: Redis State Corruption
- **Problem**: Redis state becomes corrupted or expires
- **Cause**: JSON serialization/deserialization issues with Sets and Maps
- **Impact**: Room state lost, lobby returns 404

### 2. **Socket Event Timing Issues**

#### Issue: Socket Join Before HTTP Join
- **Problem**: Socket `join-room` event fired before HTTP `POST /battle/join`
- **Cause**: Client-side race condition
- **Impact**: User appears in socket room but not in participants

#### Issue: Multiple Socket Connections
- **Problem**: Same user joins multiple times via socket
- **Cause**: Client reconnection or multiple tabs
- **Impact**: Duplicate participants or state corruption

### 3. **Database Transaction Issues**

#### Issue: Partial Database Updates
- **Problem**: `room.addParticipant()` fails but in-memory state is updated
- **Cause**: Database connection issues or validation errors
- **Impact**: Inconsistent state between DB and memory

#### Issue: Participant Cleanup Issues
- **Problem**: Inactive participants not properly cleaned up
- **Cause**: `pruneInactiveParticipants()` not running or failing
- **Impact**: Stale participants in lobby

### 4. **Room State Manager Issues**

#### Issue: Room State Not Found
- **Problem**: `getRoomState()` returns null for existing room
- **Cause**: Room state expired from memory and Redis
- **Impact**: Lobby endpoint returns 404

#### Issue: Room Code Mapping Lost
- **Problem**: `roomCodeToId` mapping lost
- **Cause**: Server restart or memory corruption
- **Impact**: Join by room code fails

## Specific Analysis for Room 68ba83f471e14644d1f9736e

### Most Likely Issues:

1. **Room State Expired**: The room state may have expired from both memory and Redis
2. **Database Connection Issues**: MongoDB connection problems during room creation/join
3. **Socket Event Race Conditions**: Socket events fired before HTTP operations completed
4. **Participant State Mismatch**: Users in database but not in in-memory state

### Debugging Steps:

1. **Check Room State**:
   ```javascript
   const state = await roomStateManager.getRoomState('68ba83f471e14644d1f9736e');
   console.log('Room state:', state);
   ```

2. **Check Database Room**:
   ```javascript
   const room = await Room.findById('68ba83f471e14644d1f9736e');
   console.log('Room in DB:', room);
   ```

3. **Check Memory State**:
   ```javascript
   console.log('Memory states:', Array.from(roomStateManager.roomStates.entries()));
   console.log('Room code mappings:', Array.from(roomStateManager.roomCodeToId.entries()));
   ```

4. **Check Redis State**:
   ```javascript
   if (roomStateManager.redisClient) {
     const redisState = await roomStateManager.redisClient.get('room:68ba83f471e14644d1f9736e');
     console.log('Redis state:', redisState);
   }
   ```

## Recommendations

### 1. **Improve State Synchronization**
- Ensure `room.addParticipant()` also updates in-memory state
- Add transaction-like behavior for state updates
- Implement state validation before returning lobby data

### 2. **Add Comprehensive Logging**
- Log all state changes with timestamps
- Log participant additions/removals
- Log socket event sequences

### 3. **Implement State Recovery**
- Add fallback mechanisms when state is lost
- Implement state reconstruction from database
- Add health checks for room state consistency

### 4. **Fix Race Conditions**
- Ensure proper event ordering
- Add locks for critical state updates
- Implement retry mechanisms for failed operations

## Conclusion

The most likely issue for roomId `68ba83f471e14644d1f9736e` is that the room state has been lost from both memory and Redis, while the database room may still exist. This creates a situation where:

1. The room exists in the database
2. The room state is missing from memory/Redis
3. The lobby endpoint fails to find the room state
4. Participants cannot be properly retrieved

The socket event replay script will help identify exactly where this breakdown occurs and provide detailed logging of the entire flow.

# GET /battle/:roomId/lobby Endpoint Documentation

## Overview
The enhanced GET /battle/:roomId/lobby endpoint now includes comprehensive fallback mechanisms and detailed room/participant information documentation.

## Enhanced Features

### 1. **Database Fallback Reconstruction**
When room state is not found in memory or Redis, the endpoint automatically attempts to reconstruct the state from MongoDB.

#### Fallback Process:
1. **Room Lookup**: Find room in MongoDB with populated participants
2. **State Creation**: Create base room state structure
3. **User Reconstruction**: Rebuild users set from active participants
4. **Battle State Reconstruction**: Reconstruct battle state from submissions
5. **Memory Storage**: Store reconstructed state in memory
6. **Redis Storage**: Store in Redis if available

#### Battle State Reconstruction:
- Extracts battle info from submissions
- Determines battle start/end status
- Reconstructs submission summaries
- Calculates participant readiness

### 2. **Comprehensive Response Structure**

#### Room Information (`room` object):
```json
{
  "roomId": "68ba83f471e14644d1f9736e",
  "roomCode": "ABC123",
  "hostId": "507f1f77bcf86cd799439011",
  "status": "active",
  "mode": "battle",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "language": "javascript",
  "isActive": true,
  "totalParticipants": 3,
  "activeParticipants": 2,
  "readyParticipants": 1
}
```

#### Participant Information (`participants` array):
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "avatar": "👤",
    "role": "host",
    "isActive": true,
    "ready": true,
    "joinedAt": "2024-01-15T10:30:00.000Z",
    "lastSeen": "2024-01-15T10:35:00.000Z",
    "elapsedSeconds": 300
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "avatar": "👩",
    "role": "participant",
    "isActive": true,
    "ready": false,
    "joinedAt": "2024-01-15T10:32:00.000Z",
    "lastSeen": "2024-01-15T10:35:00.000Z",
    "elapsedSeconds": 180
  }
]
```

#### Battle Information (`battle` object):
```json
{
  "started": true,
  "ended": false,
  "durationMinutes": 10,
  "problemId": "two-sum",
  "difficulty": "Easy",
  "host": "507f1f77bcf86cd799439011",
  "startedAt": "2024-01-15T10:30:00.000Z",
  "endedAt": null,
  "numReady": 1,
  "total": 2,
  "submissions": 0
}
```

### 3. **Enhanced Error Handling**

#### Fallback Attempted:
```json
{
  "success": false,
  "error": "Room not found",
  "details": "Room state not found in memory, Redis, or database",
  "debug": {
    "redisClient": false,
    "memoryStates": 2,
    "availableRooms": ["68ba88a4cab1196c31fdb884", "68ba88a4cab1196c31fdb888"],
    "fallbackAttempted": true,
    "fallbackSuccess": false
  }
}
```

#### Fallback Error:
```json
{
  "success": false,
  "error": "Failed to reconstruct room state",
  "details": "Database connection error",
  "debug": {
    "redisClient": false,
    "memoryStates": 2,
    "availableRooms": ["68ba88a4cab1196c31fdb884"],
    "fallbackAttempted": true,
    "fallbackError": "Connection timeout"
  }
}
```

## State Reconstruction Logic

### 1. **Room State Structure**
```javascript
const state = {
  roomId: room._id.toString(),
  language: room.language || 'javascript',
  mode: room.mode || 'collaborative',
  code: getDefaultCode(room.language || 'javascript'),
  version: 0,
  lastModified: new Date(),
  lastModifiedBy: null,
  users: new Set(), // Reconstructed from participants
  cursors: new Map(),
  chatMessages: [],
  isActive: true,
  createdAt: room.createdAt || new Date(),
  battle: undefined // Reconstructed for battle rooms
};
```

### 2. **User Reconstruction**
```javascript
// Reconstruct users from active participants
const activeParticipants = room.participants.filter(p => p.isActive);
activeParticipants.forEach(participant => {
  const userId = participant.userId._id || participant.userId;
  state.users.add(userId.toString());
});
```

### 3. **Battle State Reconstruction**
```javascript
// Find submissions for battle reconstruction
const submissions = await Submission.find({ 
  sessionId: roomId,
  isPractice: false 
}).sort({ createdAt: -1 });

// Reconstruct battle info from submissions
const battleInfo = {
  problemId: null,
  difficulty: 'Easy',
  host: room.createdBy?.toString() || null,
  durationMinutes: 10,
  started: submissions.length > 0,
  startedAt: submissions.length > 0 ? submissions[0].createdAt : null,
  ended: false,
  endedAt: null,
  submissions: {}
};

// Group submissions by user
submissions.forEach(submission => {
  const userId = submission.user.toString();
  battleInfo.submissions[userId] = {
    userId: userId,
    passed: submission.passedTestCases || 0,
    total: submission.totalTestCases || 0,
    codeLength: submission.code?.length || 0,
    totalTimeMs: submission.executionTime || 0,
    compositeScore: submission.score || 0
  };
});
```

## Error Scenarios and Handling

### 1. **Room Not Found in Database**
- **Response**: 404 with detailed debug info
- **Action**: No fallback possible, room doesn't exist

### 2. **Database Connection Error**
- **Response**: 500 with error details
- **Action**: Log error, return failure

### 3. **State Reconstruction Failure**
- **Response**: 500 with reconstruction error
- **Action**: Log error, return failure

### 4. **Redis Storage Failure**
- **Response**: 200 (success) with warning
- **Action**: Continue with memory-only state

## Performance Considerations

### 1. **Database Queries**
- Room lookup with populated participants
- Submission queries for battle reconstruction
- Optimized with proper indexing

### 2. **Memory Usage**
- Reconstructed state stored in memory
- Automatic cleanup after TTL
- Efficient Set/Map usage for users/cursors

### 3. **Redis Integration**
- Conditional Redis storage
- Graceful fallback on Redis errors
- TTL-based expiration

## Testing the Fallback

### Test with Missing Room State:
```bash
# Test with roomId that exists in DB but not in memory/Redis
curl -X GET "http://localhost:5001/api/battle/68ba83f471e14644d1f9736e/lobby"
```

### Expected Behavior:
1. **Memory Check**: Room not found in memory
2. **Redis Check**: Room not found in Redis (or Redis down)
3. **Database Fallback**: Attempt reconstruction from MongoDB
4. **State Recovery**: Reconstruct and store in memory/Redis
5. **Response**: Return detailed room/participant information

## Monitoring and Debugging

### Enhanced Logging:
- Step-by-step reconstruction process
- Database query results
- State reconstruction details
- Error handling and fallback attempts

### Debug Information:
- Redis client status
- Memory state counts
- Available room IDs
- Fallback attempt results

## Backward Compatibility

The endpoint maintains backward compatibility by including legacy fields:
- `roomId`
- `roomCode`
- `hostId`
- `status`
- `mode`

New clients can use the structured `room`, `participants`, and `battle` objects for better data organization.

## Conclusion

The enhanced lobby endpoint now provides:
1. **Robust fallback mechanisms** for state recovery
2. **Comprehensive room/participant documentation**
3. **Detailed error handling and debugging**
4. **Performance optimization** with caching
5. **Backward compatibility** with existing clients

This ensures that even when room states are lost from memory/Redis, the system can recover and provide complete lobby information by reconstructing the state from the persistent database.

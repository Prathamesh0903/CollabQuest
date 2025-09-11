const mongoose = require('mongoose');
const Room = require('./models/Room');
const roomStateManager = require('./utils/roomStateManager');

async function createTestRoom() {
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
    console.log(`\n🏗️ Creating test room with ID: ${roomId}`);
    
    // Create a room with the specific ID
    const room = new Room({
      _id: new mongoose.Types.ObjectId(roomId),
      name: 'Test Battle Room',
      description: 'Test room for fallback testing',
      roomCode: 'TEST123',
      language: 'javascript',
      mode: 'battle',
      createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      participants: [
        {
          userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          role: 'host',
          isActive: true,
          joinedAt: new Date(),
          lastSeen: new Date()
        },
        {
          userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
          role: 'participant',
          isActive: true,
          joinedAt: new Date(),
          lastSeen: new Date()
        }
      ],
      status: 'active',
      codeExpiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000))
    });
    
    await room.save();
    console.log('✅ Room created successfully:', {
      _id: room._id,
      roomCode: room.roomCode,
      mode: room.mode,
      participants: room.participants.length
    });
    
    // Create room state
    const state = {
      roomId: room._id.toString(),
      language: 'javascript',
      mode: 'battle',
      code: '// Test battle room',
      version: 0,
      lastModified: new Date(),
      lastModifiedBy: null,
      users: new Set(['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']),
      cursors: new Map(),
      chatMessages: [],
      isActive: true,
      createdAt: new Date(),
      battle: {
        problemId: 'two-sum',
        difficulty: 'Easy',
        host: '507f1f77bcf86cd799439011',
        durationMinutes: 10,
        started: false,
        ended: false,
        submissions: {}
      }
    };
    
    // Store in memory
    roomStateManager.roomStates.set(room._id.toString(), state);
    roomStateManager.roomCodeToId.set(room.roomCode, room._id.toString());
    
    console.log('✅ Room state created in memory');
    console.log('✅ Room and state ready for testing');
    
    return { room, state };
    
  } catch (error) {
    console.error('Error creating test room:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

createTestRoom();

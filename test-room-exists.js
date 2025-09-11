const mongoose = require('mongoose');
const Room = require('./server/models/Room');

async function testRoomExists() {
  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform');
      console.log('✅ Connected to MongoDB');
    }
    
    const roomId = '68ba83f471e14644d1f9736e';
    console.log(`\n🔍 Checking if room ${roomId} exists in database...`);
    
    // Check if room exists
    const room = await Room.findById(roomId);
    console.log('Room found:', !!room);
    
    if (room) {
      console.log('Room details:', {
        _id: room._id,
        roomCode: room.roomCode,
        mode: room.mode,
        participants: room.participants?.length || 0,
        createdBy: room.createdBy,
        status: room.status
      });
      
      // Check participants
      if (room.participants && room.participants.length > 0) {
        console.log('Participants:');
        room.participants.forEach((p, index) => {
          console.log(`  ${index}:`, {
            userId: p.userId,
            role: p.role,
            isActive: p.isActive
          });
        });
      }
    } else {
      console.log('❌ Room not found in database');
      
      // List some existing rooms
      const rooms = await Room.find().limit(5);
      console.log('Sample existing rooms:');
      rooms.forEach(room => {
        console.log(`  ${room._id} - ${room.roomCode} - ${room.mode}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testRoomExists();

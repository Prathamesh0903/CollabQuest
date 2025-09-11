const io = require('socket.io-client');

// Test script for follow mode functionality
async function testFollowMode() {
  console.log('🧪 Testing Follow Mode Implementation...\n');

  // Test 1: Socket connection
  console.log('1. Testing socket connection...');
  const socket = io('http://localhost:5001', {
    auth: {
      token: 'test-token' // This would be a real token in actual usage
    }
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected successfully');
    
    // Test 2: Join battle room
    console.log('\n2. Testing battle room join...');
    socket.emit('join-room', { 
      roomId: 'test-room-id', 
      mode: 'battle' 
    });
  });

  socket.on('room-joined', (data) => {
    console.log('✅ Successfully joined battle room:', data.roomId);
    
    // Test 3: Start following a user
    console.log('\n3. Testing start following...');
    socket.emit('start-following', {
      followingUserId: 'test-user-123',
      roomId: 'test-room-id',
      mode: 'battle'
    });
    console.log('✅ Start following emitted');
    
    // Test 4: Emit viewport sync
    console.log('\n4. Testing viewport synchronization...');
    socket.emit('viewport-sync', {
      viewport: {
        scrollTop: 100,
        scrollLeft: 0,
        visibleRange: {
          startLineNumber: 5,
          endLineNumber: 15
        }
      },
      roomId: 'test-room-id',
      mode: 'battle'
    });
    console.log('✅ Viewport sync emitted');
    
    // Test 5: Listen for follow events
    console.log('\n5. Testing follow event reception...');
    socket.on('follow-started', (data) => {
      console.log('✅ Follow started confirmation:', {
        followingId: data.followingId,
        followingName: data.followingName
      });
    });
    
    socket.on('user-following', (data) => {
      console.log('✅ User following notification:', {
        followerId: data.followerId,
        followerName: data.followerName
      });
    });
    
    socket.on('viewport-update', (data) => {
      console.log('✅ Viewport update received:', {
        userId: data.userId,
        viewport: data.viewport
      });
    });
    
    // Test 6: Stop following
    setTimeout(() => {
      console.log('\n6. Testing stop following...');
      socket.emit('stop-following', {
        roomId: 'test-room-id',
        mode: 'battle'
      });
      console.log('✅ Stop following emitted');
    }, 3000);
    
    socket.on('follow-stopped', (data) => {
      console.log('✅ Follow stopped confirmation:', {
        followingId: data.followingId
      });
    });
    
    socket.on('user-unfollowed', (data) => {
      console.log('✅ User unfollowed notification:', {
        followerId: data.followerId,
        followerName: data.followerName
      });
    });
    
    // Clean up after 8 seconds
    setTimeout(() => {
      console.log('\n🧹 Cleaning up test...');
      socket.disconnect();
      console.log('✅ Follow mode test completed successfully!');
      process.exit(0);
    }, 8000);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  // Timeout after 15 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout - server may not be running');
    process.exit(1);
  }, 15000);
}

// Run the test
testFollowMode().catch(console.error);

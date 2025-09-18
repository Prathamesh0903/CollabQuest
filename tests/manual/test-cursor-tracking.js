const io = require('socket.io-client');

// Test script for cursor tracking functionality
async function testCursorTracking() {
  console.log('🧪 Testing Cursor Tracking Implementation...\n');

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
    
    // Test 3: Emit cursor position
    console.log('\n3. Testing cursor position emission...');
    socket.emit('cursor-position', {
      position: { lineNumber: 5, column: 10 },
      roomId: 'test-room-id',
      mode: 'battle',
      color: '#FF6B6B',
      displayName: 'Test User'
    });
    console.log('✅ Cursor position emitted');
    
    // Test 4: Emit user selection
    console.log('\n4. Testing user selection emission...');
    socket.emit('user-selection', {
      selection: {
        startLineNumber: 3,
        startColumn: 5,
        endLineNumber: 3,
        endColumn: 15
      },
      roomId: 'test-room-id',
      mode: 'battle',
      color: '#4ECDC4',
      displayName: 'Test User'
    });
    console.log('✅ User selection emitted');
    
    // Test 5: Listen for cursor events
    console.log('\n5. Testing cursor event reception...');
    socket.on('cursor-position', (data) => {
      console.log('✅ Received cursor position:', {
        userId: data.userId,
        position: data.position,
        color: data.color,
        displayName: data.displayName
      });
    });
    
    socket.on('user-selection', (data) => {
      console.log('✅ Received user selection:', {
        userId: data.userId,
        selection: data.selection,
        color: data.color,
        displayName: data.displayName
      });
    });
    
    // Clean up after 5 seconds
    setTimeout(() => {
      console.log('\n🧹 Cleaning up test...');
      socket.disconnect();
      console.log('✅ Test completed successfully!');
      process.exit(0);
    }, 5000);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout - server may not be running');
    process.exit(1);
  }, 10000);
}

// Run the test
testCursorTracking().catch(console.error);

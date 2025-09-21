const io = require('socket.io-client');

// Test collaboration functionality
async function testCollaboration() {
  console.log('🧪 Testing Collaboration System...\n');

  // Test 1: Create multiple socket connections
  console.log('1. Creating multiple socket connections...');
  
  const socket1 = io('http://localhost:5001', {
    auth: { token: 'test-token-1' }
  });

  const socket2 = io('http://localhost:5001', {
    auth: { token: 'test-token-2' }
  });

  const socket3 = io('http://localhost:5001', {
    auth: { token: 'test-token-3' }
  });

  // Test 2: Join room events
  console.log('2. Testing room join events...');
  
  socket1.on('connect', () => {
    console.log('✅ Socket 1 connected');
    socket1.emit('join-collab-room', { roomId: 'test-room-123', language: 'javascript' });
  });

  socket2.on('connect', () => {
    console.log('✅ Socket 2 connected');
    socket2.emit('join-collab-room', { roomId: 'test-room-123', language: 'javascript' });
  });

  socket3.on('connect', () => {
    console.log('✅ Socket 3 connected');
    socket3.emit('join-collab-room', { roomId: 'test-room-123', language: 'javascript' });
  });

  // Test 3: Listen for user join notifications
  console.log('3. Listening for user join notifications...');
  
  socket1.on('user-joined-room', (data) => {
    console.log('👥 User joined room (Socket 1):', data.displayName);
  });

  socket2.on('user-joined-room', (data) => {
    console.log('👥 User joined room (Socket 2):', data.displayName);
  });

  socket3.on('user-joined-room', (data) => {
    console.log('👥 User joined room (Socket 3):', data.displayName);
  });

  // Test 4: Listen for user join confirmations
  socket1.on('user-joined-confirmation', (data) => {
    console.log('✅ Socket 1 joined confirmation:', data.message);
    console.log('   Existing users:', data.existingUsers.length);
  });

  socket2.on('user-joined-confirmation', (data) => {
    console.log('✅ Socket 2 joined confirmation:', data.message);
    console.log('   Existing users:', data.existingUsers.length);
  });

  socket3.on('user-joined-confirmation', (data) => {
    console.log('✅ Socket 3 joined confirmation:', data.message);
    console.log('   Existing users:', data.existingUsers.length);
  });

  // Test 5: Listen for users-in-room updates
  socket1.on('users-in-room', (users) => {
    console.log('👥 Users in room updated (Socket 1):', users.length, 'users');
    users.forEach(user => console.log(`   - ${user.displayName} (${user.userId})`));
  });

  socket2.on('users-in-room', (users) => {
    console.log('👥 Users in room updated (Socket 2):', users.length, 'users');
  });

  socket3.on('users-in-room', (users) => {
    console.log('👥 Users in room updated (Socket 3):', users.length, 'users');
  });

  // Test 6: Test leaving room
  setTimeout(() => {
    console.log('\n4. Testing room leave events...');
    socket2.emit('leave-collab-room', { roomId: 'test-room-123' });
  }, 3000);

  // Test 7: Listen for user leave notifications
  socket1.on('user-left-room', (data) => {
    console.log('👋 User left room (Socket 1):', data.displayName);
  });

  socket3.on('user-left-room', (data) => {
    console.log('👋 User left room (Socket 3):', data.displayName);
  });

  // Test 8: Cleanup after test
  setTimeout(() => {
    console.log('\n5. Cleaning up test connections...');
    socket1.disconnect();
    socket2.disconnect();
    socket3.disconnect();
    console.log('✅ Test completed');
    process.exit(0);
  }, 8000);

  // Error handling
  socket1.on('error', (error) => {
    console.error('❌ Socket 1 error:', error);
  });

  socket2.on('error', (error) => {
    console.error('❌ Socket 2 error:', error);
  });

  socket3.on('error', (error) => {
    console.error('❌ Socket 3 error:', error);
  });

  socket1.on('connect_error', (error) => {
    console.error('❌ Socket 1 connection error:', error);
  });

  socket2.on('connect_error', (error) => {
    console.error('❌ Socket 2 connection error:', error);
  });

  socket3.on('connect_error', (error) => {
    console.error('❌ Socket 3 connection error:', error);
  });
}

// Run the test
testCollaboration().catch(console.error);


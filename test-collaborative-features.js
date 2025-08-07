const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const ROOM_ID = 'test-collab-room';
const TEST_CODE = `console.log("Hello from collaborative test!");
console.log("Current time:", new Date().toISOString());`;

// Simulate multiple users
const users = [
  { id: 'user1', name: 'Alice', token: 'test-token-1' },
  { id: 'user2', name: 'Bob', token: 'test-token-2' },
  { id: 'user3', name: 'Charlie', token: 'test-token-3' }
];

let connections = [];
let testResults = {
  connections: 0,
  codeChanges: 0,
  cursorMoves: 0,
  executions: 0,
  errors: 0
};

// Helper function to create a socket connection
function createConnection(user) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      query: { roomId: ROOM_ID },
      auth: { token: user.token },
      reconnection: false
    });

    socket.on('connect', () => {
      console.log(`✅ ${user.name} connected`);
      testResults.connections++;
      
      // Join collaborative room
      socket.emit('join-collab-room', { roomId: ROOM_ID, language: 'javascript' });
    });

    socket.on('room-state-sync', (state) => {
      console.log(`📄 ${user.name} received room state:`, state.code.substring(0, 50) + '...');
    });

    socket.on('users-in-room', (users) => {
      console.log(`👥 ${user.name} sees ${users.length} users in room`);
    });

    socket.on('code-change', (change) => {
      console.log(`✏️ ${user.name} received code change from ${change.displayName}`);
      testResults.codeChanges++;
    });

    socket.on('cursor-move', (cursor) => {
      console.log(`🖱️ ${user.name} received cursor move from ${cursor.displayName}`);
      testResults.cursorMoves++;
    });

    socket.on('code-execution-started', (data) => {
      console.log(`⚡ ${user.name} sees execution started by ${data.displayName}`);
    });

    socket.on('code-execution-completed', (data) => {
      console.log(`✅ ${user.name} sees execution completed by ${data.displayName}`);
      testResults.executions++;
    });

    socket.on('error', (error) => {
      console.error(`❌ ${user.name} received error:`, error.message);
      testResults.errors++;
    });

    socket.on('disconnect', () => {
      console.log(`🔌 ${user.name} disconnected`);
    });

    resolve(socket);
  });
}

// Test collaborative features
async function testCollaborativeFeatures() {
  console.log('🚀 Starting collaborative features test...\n');

  try {
    // 1. Connect all users
    console.log('📡 Connecting users...');
    for (const user of users) {
      const socket = await createConnection(user);
      connections.push({ user, socket });
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between connections
    }

    // 2. Test code changes
    console.log('\n✏️ Testing code changes...');
    const aliceSocket = connections[0].socket;
    aliceSocket.emit('code-change', {
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
      text: TEST_CODE,
      roomId: ROOM_ID,
      version: 0
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Test cursor movements
    console.log('\n🖱️ Testing cursor movements...');
    const bobSocket = connections[1].socket;
    bobSocket.emit('cursor-move', {
      position: { lineNumber: 2, column: 10 },
      roomId: ROOM_ID,
      color: '#FF6B6B',
      displayName: 'Bob'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Test code execution
    console.log('\n⚡ Testing code execution...');
    const charlieSocket = connections[2].socket;
    charlieSocket.emit('execute-code', {
      roomId: ROOM_ID,
      language: 'javascript',
      code: TEST_CODE,
      input: ''
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Test language change
    console.log('\n🔄 Testing language change...');
    aliceSocket.emit('language-change', {
      roomId: ROOM_ID,
      language: 'python',
      code: 'print("Hello from Python!")'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Test user leaving
    console.log('\n👋 Testing user leaving...');
    bobSocket.emit('leave-collab-room', { roomId: ROOM_ID });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. Test reconnection
    console.log('\n🔄 Testing reconnection...');
    const newBobSocket = await createConnection(users[1]);
    newBobSocket.emit('reconnect-request', { roomId: ROOM_ID });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 8. Clean up
    console.log('\n🧹 Cleaning up...');
    for (const { socket } of connections) {
      socket.disconnect();
    }
    newBobSocket.disconnect();

    // 9. Print results
    console.log('\n📊 Test Results:');
    console.log(`✅ Connections: ${testResults.connections}`);
    console.log(`✏️ Code Changes: ${testResults.codeChanges}`);
    console.log(`🖱️ Cursor Moves: ${testResults.cursorMoves}`);
    console.log(`⚡ Executions: ${testResults.executions}`);
    console.log(`❌ Errors: ${testResults.errors}`);

    if (testResults.errors === 0) {
      console.log('\n🎉 All collaborative features working correctly!');
    } else {
      console.log('\n⚠️ Some errors occurred during testing.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test code execution API
async function testCodeExecution() {
  console.log('\n🔧 Testing code execution API...');

  try {
    const response = await axios.post(`${SERVER_URL}/api/rooms/${ROOM_ID}/execute`, {
      language: 'javascript',
      code: 'console.log("Hello from API test!");',
      input: ''
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-1'
      }
    });

    console.log('✅ Code execution API working:', response.data.success);
    if (response.data.success) {
      console.log('📄 Output:', response.data.result.stdout);
    }
  } catch (error) {
    console.error('❌ Code execution API failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Collaborative Coding System Test Suite\n');
  console.log('=' .repeat(50));

  await testCollaborativeFeatures();
  await testCodeExecution();

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test suite completed!');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${SERVER_URL}/api/health`);
    console.log('✅ Server is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.');
    console.error('Run: docker-compose up --build');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCollaborativeFeatures,
  testCodeExecution,
  runTests
}; 
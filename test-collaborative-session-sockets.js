const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const SESSION_ID = 'ABC12345'; // Replace with actual session ID from your test
const TEST_CODE = `console.log("Hello from collaborative session!");
console.log("Current time:", new Date().toISOString());`;

// Simulate multiple users joining via session link
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
  fileChanges: 0,
  collaboratorUpdates: 0,
  executions: 0,
  errors: 0
};

// Helper function to create a socket connection for collaborative session
function createSessionConnection(user) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      query: { sessionId: SESSION_ID },
      auth: { token: user.token },
      reconnection: false
    });

    socket.on('connect', () => {
      console.log(`✅ ${user.name} connected to session ${SESSION_ID}`);
      testResults.connections++;
      
      // Join collaborative session
      socket.emit('join-collaborative-session', { 
        sessionId: SESSION_ID,
        accessCode: null // No access code for this test
      });
    });

    socket.on('session-state-sync', (state) => {
      console.log(`📄 ${user.name} received session state:`, {
        sessionId: state.sessionId,
        name: state.name,
        language: state.language,
        files: state.files.length,
        currentFile: state.currentFile
      });
    });

    socket.on('users-in-session', (users) => {
      console.log(`👥 ${user.name} sees ${users.length} users in session`);
    });

    socket.on('user-joined-session', (userInfo) => {
      console.log(`👋 ${user.name} sees ${userInfo.displayName} joined the session`);
    });

    socket.on('session-code-change', (change) => {
      console.log(`✏️ ${user.name} received code change from ${change.displayName} in file ${change.fileName}`);
      testResults.codeChanges++;
    });

    socket.on('session-cursor-move', (cursor) => {
      console.log(`🖱️ ${user.name} received cursor move from ${cursor.displayName}`);
      testResults.cursorMoves++;
    });

    socket.on('session-selection-change', (selection) => {
      console.log(`📝 ${user.name} received selection change from ${selection.displayName}`);
    });

    socket.on('session-file-created', (data) => {
      console.log(`📄 ${user.name} sees file created: ${data.file.fileName} by ${data.displayName}`);
      testResults.fileChanges++;
    });

    socket.on('session-file-deleted', (data) => {
      console.log(`🗑️ ${user.name} sees file deleted: ${data.fileName} by ${data.displayName}`);
      testResults.fileChanges++;
    });

    socket.on('session-file-switched', (data) => {
      console.log(`🔄 ${user.name} sees file switched to: ${data.fileName} by ${data.displayName}`);
      testResults.fileChanges++;
    });

    socket.on('collaborator-update', (data) => {
      console.log(`👥 ${user.name} sees collaborator update: ${data.updateType} by ${data.displayName}`);
      testResults.collaboratorUpdates++;
    });

    socket.on('collaborators-info', (data) => {
      console.log(`📊 ${user.name} received collaborators info: ${data.totalCollaborators} collaborators`);
      testResults.collaboratorUpdates++;
    });

    socket.on('code-execution-started', (data) => {
      console.log(`⚡ ${user.name} sees execution started by ${data.displayName}`);
    });

    socket.on('code-execution-completed', (result) => {
      console.log(`✅ ${user.name} sees execution completed by ${result.displayName}`);
      testResults.executions++;
    });

    socket.on('error', (error) => {
      console.error(`❌ ${user.name} received error:`, error.message);
      testResults.errors++;
    });

    socket.on('disconnect', () => {
      console.log(`🔌 ${user.name} disconnected`);
    });

    // Store socket for later use
    connections.push({ user, socket });
    resolve(socket);
  });
}

// Test collaborative session features
async function testCollaborativeSession() {
  console.log('🧪 Testing Collaborative Session Socket Features\n');
  console.log('=' .repeat(60));

  try {
    // Connect all users
    console.log('🔗 Connecting users to collaborative session...\n');
    
    for (const user of users) {
      await createSessionConnection(user);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between connections
    }

    // Wait for all connections to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test code changes
    console.log('\n✏️ Testing code changes...\n');
    
    const aliceSocket = connections.find(c => c.user.name === 'Alice')?.socket;
    if (aliceSocket) {
      aliceSocket.emit('session-code-change', {
        sessionId: SESSION_ID,
        fileName: 'main.js',
        range: { start: 0, end: 0 },
        text: '// Alice added this comment\n',
        version: 0
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const bobSocket = connections.find(c => c.user.name === 'Bob')?.socket;
    if (bobSocket) {
      bobSocket.emit('session-code-change', {
        sessionId: SESSION_ID,
        fileName: 'main.js',
        range: { start: 50, end: 50 },
        text: '// Bob added this line\n',
        version: 1
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test cursor movements
    console.log('\n🖱️ Testing cursor movements...\n');
    
    for (let i = 0; i < 3; i++) {
      aliceSocket?.emit('session-cursor-move', {
        sessionId: SESSION_ID,
        position: { line: i, ch: i * 10 },
        color: '#FF6B6B',
        displayName: 'Alice'
      });

      bobSocket?.emit('session-cursor-move', {
        sessionId: SESSION_ID,
        position: { line: i + 1, ch: (i + 1) * 5 },
        color: '#4ECDC4',
        displayName: 'Bob'
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test selections
    console.log('\n📝 Testing text selections...\n');
    
    aliceSocket?.emit('session-selection-change', {
      sessionId: SESSION_ID,
      selection: { start: { line: 0, ch: 0 }, end: { line: 0, ch: 20 } },
      color: '#FF6B6B',
      displayName: 'Alice'
    });

    bobSocket?.emit('session-selection-change', {
      sessionId: SESSION_ID,
      selection: { start: { line: 1, ch: 0 }, end: { line: 1, ch: 15 } },
      color: '#4ECDC4',
      displayName: 'Bob'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test file management
    console.log('\n📁 Testing file management...\n');
    
    const aliceSocket = connections.find(c => c.user.name === 'Alice')?.socket;
    if (aliceSocket) {
      // Create a new file
      aliceSocket.emit('session-file-create', {
        sessionId: SESSION_ID,
        fileName: 'utils.js',
        language: 'javascript',
        content: '// Utility functions\nfunction helper() {\n  return "Hello";\n}'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const bobSocket = connections.find(c => c.user.name === 'Bob')?.socket;
    if (bobSocket) {
      // Switch to the new file
      bobSocket.emit('session-file-switch', {
        sessionId: SESSION_ID,
        fileName: 'utils.js'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test collaborator status tracking
    console.log('\n👥 Testing collaborator status tracking...\n');
    
    const aliceSocket = connections.find(c => c.user.name === 'Alice')?.socket;
    if (aliceSocket) {
      // Start typing
      aliceSocket.emit('session-typing-start', { sessionId: SESSION_ID });
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    if (aliceSocket) {
      // Stop typing
      aliceSocket.emit('session-typing-stop', { sessionId: SESSION_ID });
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const bobSocket = connections.find(c => c.user.name === 'Bob')?.socket;
    if (bobSocket) {
      // Get collaborators info
      bobSocket.emit('get-collaborators', { sessionId: SESSION_ID });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test leaving session
    console.log('\n👋 Testing session leaving...\n');
    
    const charlieSocket = connections.find(c => c.user.name === 'Charlie')?.socket;
    if (charlieSocket) {
      charlieSocket.emit('leave-collaborative-session', { sessionId: SESSION_ID });
      console.log('Charlie left the session');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Disconnect all users
    console.log('\n🔌 Disconnecting all users...\n');
    
    for (const connection of connections) {
      connection.socket.disconnect();
    }

    // Wait for disconnections
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Print test results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Test Results:');
    console.log(`✅ Connections: ${testResults.connections}`);
    console.log(`✏️ Code Changes: ${testResults.codeChanges}`);
    console.log(`🖱️ Cursor Moves: ${testResults.cursorMoves}`);
    console.log(`📁 File Changes: ${testResults.fileChanges}`);
    console.log(`👥 Collaborator Updates: ${testResults.collaboratorUpdates}`);
    console.log(`⚡ Executions: ${testResults.executions}`);
    console.log(`❌ Errors: ${testResults.errors}`);
    console.log('\n🎉 Collaborative session socket tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Example usage with curl commands
function showCurlExamples() {
  console.log('\n📖 Example cURL Commands for Collaborative Sessions:\n');
  
  console.log('1. Create a new collaborative session:');
  console.log(`curl -X POST ${SERVER_URL}/api/collaborative-sessions \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Collaborative Session",
    "description": "A test session for collaborative coding",
    "defaultLanguage": "javascript",
    "isPublic": false
  }'`);
  
  console.log('\n2. Get sharable URL for a session:');
  console.log(`curl -X GET ${SERVER_URL}/api/collaborative-sessions/SESSION_ID/share-url \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`);
  
  console.log('\n3. Join a session via REST API:');
  console.log(`curl -X POST ${SERVER_URL}/api/collaborative-sessions/SESSION_ID/join \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accessCode": "ABC123"
  }'`);
  
  console.log('\n4. Set access code for a session:');
  console.log(`curl -X POST ${SERVER_URL}/api/collaborative-sessions/SESSION_ID/access-code \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accessCode": "ABC123",
    "expiresInHours": 24
  }'`);
}

// Socket event documentation
function showSocketEvents() {
  console.log('\n🔌 Socket.IO Events for Collaborative Sessions:\n');
  
  console.log('📤 Client to Server Events:');
  console.log('- join-collaborative-session: Join a session by sessionId');
  console.log('- session-code-change: Send code changes to other users');
  console.log('- session-cursor-move: Send cursor position updates');
  console.log('- session-selection-change: Send text selection updates');
  console.log('- session-file-create: Create a new file in the session');
  console.log('- session-file-delete: Delete a file from the session');
  console.log('- session-file-switch: Switch to a different file');
  console.log('- session-typing-start/stop: Update typing status');
  console.log('- session-editing-start/stop: Update editing status');
  console.log('- get-collaborators: Get detailed collaborator information');
  console.log('- leave-collaborative-session: Leave the session');
  
  console.log('\n📥 Server to Client Events:');
  console.log('- session-state-sync: Receive current session state');
  console.log('- users-in-session: Receive list of users in session');
  console.log('- user-joined-session: Notify when user joins');
  console.log('- user-left-session: Notify when user leaves');
  console.log('- session-code-change: Receive code changes from others');
  console.log('- session-cursor-move: Receive cursor updates from others');
  console.log('- session-selection-change: Receive selection updates from others');
  console.log('- session-file-created: Notify when a file is created');
  console.log('- session-file-deleted: Notify when a file is deleted');
  console.log('- session-file-switched: Notify when active file changes');
  console.log('- collaborator-update: Real-time collaborator status updates');
  console.log('- collaborators-info: Detailed collaborator information');
  console.log('- cursors-sync: Receive all current cursors');
  console.log('- selections-sync: Receive all current selections');
}

// Run tests if this file is executed directly
if (require.main === module) {
  if (SESSION_ID === 'ABC12345') {
    console.log('⚠️  Please set a valid session ID in the SESSION_ID variable');
    console.log('   You can create a session using the REST API first');
    showCurlExamples();
    showSocketEvents();
  } else {
    testCollaborativeSession();
  }
}

module.exports = {
  testCollaborativeSession,
  createSessionConnection,
  showCurlExamples,
  showSocketEvents
};

const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const SESSION_ID = 'ABC12345'; // Replace with actual session ID

// Simulate users for testing
const users = [
  { id: 'user1', name: 'Alice', token: 'test-token-1' },
  { id: 'user2', name: 'Bob', token: 'test-token-2' }
];

let connections = [];
let testResults = {
  saves: 0,
  recoveries: 0,
  codeChanges: 0,
  errors: 0
};

// Helper function to create a socket connection
function createConnection(user) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      query: { sessionId: SESSION_ID },
      auth: { token: user.token },
      reconnection: false
    });

    socket.on('connect', () => {
      console.log(`✅ ${user.name} connected`);
      
      // Join collaborative session
      socket.emit('join-collaborative-session', { 
        sessionId: SESSION_ID,
        accessCode: null
      });
    });

    socket.on('session-state-sync', (state) => {
      console.log(`📄 ${user.name} received session state`);
    });

    socket.on('session-state-recovered', (data) => {
      console.log(`🔄 ${user.name} recovered session state from ${data.source}`);
      testResults.recoveries++;
    });

    socket.on('session-saved', (data) => {
      console.log(`💾 ${user.name} session saved (${data.saveCount} total saves)`);
      testResults.saves++;
    });

    socket.on('session-stats', (stats) => {
      console.log(`📊 ${user.name} received session stats:`, {
        totalFiles: stats.totalFiles,
        isDirty: stats.isDirty,
        saveCount: stats.saveCount,
        timeSinceLastSave: Math.round(stats.timeSinceLastSave / 1000) + 's'
      });
    });

    socket.on('session-code-change', (change) => {
      console.log(`✏️ ${user.name} received code change from ${change.displayName}`);
      testResults.codeChanges++;
    });

    socket.on('error', (error) => {
      console.error(`❌ ${user.name} received error:`, error.message);
      testResults.errors++;
    });

    socket.on('disconnect', () => {
      console.log(`🔌 ${user.name} disconnected`);
    });

    connections.push({ user, socket });
    resolve(socket);
  });
}

// Test code persistence features
async function testCodePersistence() {
  console.log('🧪 Testing Enhanced Code Persistence Features\n');
  console.log('=' .repeat(60));

  try {
    // Connect users
    console.log('🔗 Connecting users...\n');
    
    for (const user of users) {
      await createConnection(user);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Code changes with auto-save
    console.log('\n📝 Test 1: Code changes with auto-save...\n');
    
    const aliceSocket = connections.find(c => c.user.name === 'Alice')?.socket;
    if (aliceSocket) {
      // Make multiple code changes to trigger auto-save
      for (let i = 0; i < 5; i++) {
        aliceSocket.emit('session-code-change', {
          sessionId: SESSION_ID,
          fileName: 'main.js',
          range: { start: i * 20, end: i * 20 },
          text: `// Change ${i + 1}\n`,
          version: i
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for auto-save
      }
    }

    // Test 2: Force save
    console.log('\n💾 Test 2: Force save...\n');
    
    if (aliceSocket) {
      aliceSocket.emit('force-save-session', { sessionId: SESSION_ID });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 3: Get session statistics
    console.log('\n📊 Test 3: Session statistics...\n');
    
    const bobSocket = connections.find(c => c.user.name === 'Bob')?.socket;
    if (bobSocket) {
      bobSocket.emit('get-session-stats', { sessionId: SESSION_ID });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 4: Simulate reconnection and recovery
    console.log('\n🔄 Test 4: Session recovery...\n');
    
    if (aliceSocket) {
      // Simulate reconnection by requesting recovery
      aliceSocket.emit('recover-session-state', { 
        sessionId: SESSION_ID,
        fileName: 'main.js'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 5: Multiple file operations
    console.log('\n📁 Test 5: Multiple file operations...\n');
    
    if (aliceSocket) {
      // Create a new file
      aliceSocket.emit('session-file-create', {
        sessionId: SESSION_ID,
        fileName: 'utils.js',
        language: 'javascript',
        content: '// Utility functions\nfunction helper() {\n  return "Hello";\n}'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make changes to the new file
      aliceSocket.emit('session-code-change', {
        sessionId: SESSION_ID,
        fileName: 'utils.js',
        range: { start: 0, end: 0 },
        text: '// Enhanced utilities\n',
        version: 0
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 6: Batch operations and final save
    console.log('\n🔄 Test 6: Batch operations and final save...\n');
    
    if (aliceSocket) {
      // Make several rapid changes
      for (let i = 0; i < 3; i++) {
        aliceSocket.emit('session-code-change', {
          sessionId: SESSION_ID,
          fileName: 'main.js',
          range: { start: 100 + i * 10, end: 100 + i * 10 },
          text: `// Rapid change ${i + 1}\n`,
          version: 5 + i
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for auto-save
      
      // Force final save
      aliceSocket.emit('force-save-session', { sessionId: SESSION_ID });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 7: Recovery after disconnection simulation
    console.log('\n🔄 Test 7: Recovery after disconnection...\n');
    
    if (bobSocket) {
      // Simulate recovery after network issues
      bobSocket.emit('recover-session-state', { 
        sessionId: SESSION_ID 
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get final statistics
      bobSocket.emit('get-session-stats', { sessionId: SESSION_ID });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait for any pending auto-saves
    console.log('\n⏳ Waiting for pending auto-saves...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Disconnect users
    console.log('\n🔌 Disconnecting users...\n');
    
    for (const connection of connections) {
      connection.socket.disconnect();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Print test results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Code Persistence Test Results:');
    console.log(`💾 Auto-saves: ${testResults.saves}`);
    console.log(`🔄 Recoveries: ${testResults.recoveries}`);
    console.log(`✏️ Code Changes: ${testResults.codeChanges}`);
    console.log(`❌ Errors: ${testResults.errors}`);
    console.log('\n🎉 Code persistence tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Example usage with curl commands
function showCurlExamples() {
  console.log('\n📖 Example cURL Commands for Code Persistence:\n');
  
  console.log('1. Create a collaborative session:');
  console.log(`curl -X POST ${SERVER_URL}/api/collaborative-sessions \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Code Persistence Test",
    "description": "Testing enhanced code persistence",
    "defaultLanguage": "javascript",
    "isPublic": false
  }'`);
  
  console.log('\n2. Get session files:');
  console.log(`curl -X GET ${SERVER_URL}/api/collaborative-sessions/SESSION_ID/files \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`);
  
  console.log('\n3. Update file content:');
  console.log(`curl -X PUT ${SERVER_URL}/api/collaborative-sessions/SESSION_ID/files/main.js \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "console.log(\\"Updated content\\");",
    "version": 1
  }'`);
}

// Socket event documentation
function showSocketEvents() {
  console.log('\n🔌 Socket.IO Events for Code Persistence:\n');
  
  console.log('📤 Client to Server Events:');
  console.log('- recover-session-state: Recover session state after reconnection');
  console.log('- force-save-session: Force immediate save of session state');
  console.log('- get-session-stats: Get session persistence statistics');
  console.log('- session-code-change: Send code changes (triggers auto-save)');
  console.log('- session-file-create: Create new file (triggers auto-save)');
  console.log('- session-file-delete: Delete file (triggers auto-save)');
  
  console.log('\n📥 Server to Client Events:');
  console.log('- session-state-recovered: Receive recovered session state');
  console.log('- session-saved: Confirm session was saved');
  console.log('- session-stats: Receive session persistence statistics');
  console.log('- session-code-change: Receive code changes from others');
  console.log('- session-file-created: Notify when file is created');
  console.log('- session-file-deleted: Notify when file is deleted');
}

// Auto-save intervals documentation
function showAutoSaveInfo() {
  console.log('\n⏰ Auto-Save Configuration:\n');
  console.log('- Frequent: Every 5 seconds (active sessions)');
  console.log('- Normal: Every 30 seconds (moderate activity)');
  console.log('- Infrequent: Every 2 minutes (idle sessions)');
  console.log('- Auto-adjustment based on user activity');
  console.log('- Force save available on demand');
  console.log('- Graceful shutdown with emergency save');
}

// Run tests if this file is executed directly
if (require.main === module) {
  if (SESSION_ID === 'ABC12345') {
    console.log('⚠️  Please set a valid session ID in the SESSION_ID variable');
    console.log('   You can create a session using the REST API first');
    showCurlExamples();
    showSocketEvents();
    showAutoSaveInfo();
  } else {
    testCodePersistence();
  }
}

module.exports = {
  testCodePersistence,
  createConnection,
  showCurlExamples,
  showSocketEvents,
  showAutoSaveInfo
};

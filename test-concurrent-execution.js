const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:5000';
const ROOM_ID = 'test-room-123';

// Test users
const users = [
  { id: 'user1', name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { id: 'user2', name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 'user3', name: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  { id: 'user4', name: 'Diana', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana' },
  { id: 'user5', name: 'Eve', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve' }
];

// Test code samples
const codeSamples = [
  {
    language: 'javascript',
    code: `
console.log('Hello from Alice!');
for (let i = 0; i < 3; i++) {
  console.log('Count:', i);
  // Simulate some work
  const start = Date.now();
  while (Date.now() - start < 1000) {}
}
console.log('Alice finished!');
    `,
    input: ''
  },
  {
    language: 'python',
    code: `
import time
print("Hello from Bob!")
for i in range(3):
    print(f"Count: {i}")
    time.sleep(1)  # Simulate work
print("Bob finished!")
    `,
    input: ''
  },
  {
    language: 'javascript',
    code: `
console.log('Hello from Charlie!');
setTimeout(() => {
  console.log('Charlie async work done!');
}, 2000);
console.log('Charlie finished!');
    `,
    input: ''
  },
  {
    language: 'python',
    code: `
print("Hello from Diana!")
import random
numbers = [random.randint(1, 100) for _ in range(5)]
print(f"Random numbers: {numbers}")
print("Diana finished!")
    `,
    input: ''
  },
  {
    language: 'javascript',
    code: `
console.log('Hello from Eve!');
const result = Array.from({length: 5}, () => Math.floor(Math.random() * 100));
console.log('Random numbers:', result);
console.log('Eve finished!');
    `,
    input: ''
  }
];

// Store socket connections
const sockets = new Map();
const executionResults = new Map();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logUser(userId, message, color = 'reset') {
  const user = users.find(u => u.id === userId);
  const userColor = colors[color] || colors.blue;
  console.log(`${userColor}[${user.name}]${colors.reset} ${message}`);
}

// Create socket connection for a user
async function createUserSocket(userId) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      auth: {
        token: `mock-token-${userId}` // Mock authentication
      }
    });

    socket.on('connect', () => {
      logUser(userId, 'Connected to server', 'green');
      
      // Join the collaborative room
      socket.emit('join-collab-room', {
        roomId: ROOM_ID,
        language: 'javascript'
      });
    });

    socket.on('room-state-sync', (data) => {
      logUser(userId, 'Received room state sync', 'cyan');
    });

    socket.on('users-in-room', (users) => {
      logUser(userId, `Users in room: ${users.length}`, 'cyan');
    });

    // Execution events
    socket.on('execution-queued', (data) => {
      logUser(userId, `Execution queued (position: ${data.position})`, 'yellow');
      if (data.userId === userId) {
        executionResults.set(userId, { status: 'queued', position: data.position });
      }
    });

    socket.on('execution-started', (data) => {
      logUser(userId, `Execution started for ${data.displayName}`, 'blue');
      if (data.userId === userId) {
        executionResults.set(userId, { status: 'executing', startTime: new Date() });
      }
    });

    socket.on('execution-completed', (data) => {
      logUser(userId, `Execution completed for ${data.displayName} (${data.executionTime}ms)`, 'green');
      if (data.userId === userId) {
        executionResults.set(userId, { 
          status: 'completed', 
          result: data.result,
          executionTime: data.executionTime 
        });
      }
    });

    socket.on('execution-failed', (data) => {
      logUser(userId, `Execution failed for ${data.displayName}: ${data.error}`, 'red');
      if (data.userId === userId) {
        executionResults.set(userId, { 
          status: 'failed', 
          error: data.error,
          executionTime: data.executionTime 
        });
      }
    });

    socket.on('execution-status', (status) => {
      logUser(userId, `Status: ${status.activeCount} executing, ${status.queueLength} queued`, 'magenta');
    });

    socket.on('error', (error) => {
      logUser(userId, `Error: ${error.message}`, 'red');
    });

    socket.on('disconnect', () => {
      logUser(userId, 'Disconnected from server', 'red');
    });

    socket.on('connect_error', (error) => {
      logUser(userId, `Connection error: ${error.message}`, 'red');
      reject(error);
    });

    // Wait for connection
    socket.on('connect', () => {
      setTimeout(() => resolve(socket), 1000); // Give time for room join
    });
  });
}

// Execute code for a user
async function executeCode(userId, codeSample) {
  const socket = sockets.get(userId);
  if (!socket) {
    logUser(userId, 'Socket not found', 'red');
    return;
  }

  logUser(userId, `Requesting code execution (${codeSample.language})`, 'yellow');
  
  socket.emit('execute-code', {
    roomId: ROOM_ID,
    language: codeSample.language,
    code: codeSample.code,
    input: codeSample.input
  });
}

// Get execution status
async function getExecutionStatus(userId) {
  const socket = sockets.get(userId);
  if (!socket) return;

  socket.emit('get-execution-status', { roomId: ROOM_ID });
}

// Cancel execution
async function cancelExecution(userId) {
  const socket = sockets.get(userId);
  if (!socket) return;

  logUser(userId, 'Cancelling execution', 'yellow');
  socket.emit('cancel-execution', { roomId: ROOM_ID });
}

// Monitor execution results
function monitorResults() {
  const interval = setInterval(() => {
    log('\n=== Execution Status ===', 'bright');
    
    for (const [userId, result] of executionResults.entries()) {
      const user = users.find(u => u.id === userId);
      const status = result.status || 'unknown';
      const statusColor = status === 'completed' ? 'green' : 
                         status === 'failed' ? 'red' : 
                         status === 'executing' ? 'blue' : 'yellow';
      
      logUser(userId, `Status: ${status}`, statusColor);
      
      if (result.position) {
        logUser(userId, `Queue position: ${result.position}`, 'cyan');
      }
      
      if (result.executionTime) {
        logUser(userId, `Execution time: ${result.executionTime}ms`, 'cyan');
      }
      
      if (result.error) {
        logUser(userId, `Error: ${result.error}`, 'red');
      }
    }
    
    // Check if all executions are complete
    const allComplete = Array.from(executionResults.values()).every(
      result => result.status === 'completed' || result.status === 'failed'
    );
    
    if (allComplete) {
      log('\n=== All executions completed ===', 'bright');
      clearInterval(interval);
      
      // Disconnect all sockets
      setTimeout(() => {
        log('\n=== Disconnecting all users ===', 'bright');
        for (const [userId, socket] of sockets.entries()) {
          socket.disconnect();
          logUser(userId, 'Disconnected', 'red');
        }
        process.exit(0);
      }, 2000);
    }
  }, 2000);
}

// Main test function
async function runConcurrentExecutionTest() {
  log('=== Concurrent Code Execution Test ===', 'bright');
  log(`Server: ${SERVER_URL}`, 'cyan');
  log(`Room: ${ROOM_ID}`, 'cyan');
  log(`Users: ${users.length}`, 'cyan');
  log('', 'reset');

  try {
    // Create socket connections for all users
    log('Creating socket connections...', 'yellow');
    for (const user of users) {
      const socket = await createUserSocket(user.id);
      sockets.set(user.id, socket);
    }
    
    log('All users connected successfully!', 'green');
    
    // Wait a moment for all connections to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start monitoring results
    monitorResults();
    
    // Execute code for all users simultaneously
    log('\n=== Starting concurrent executions ===', 'bright');
    
    const executionPromises = users.map((user, index) => {
      const codeSample = codeSamples[index];
      return executeCode(user.id, codeSample);
    });
    
    // Execute all requests
    await Promise.all(executionPromises);
    
    log('All execution requests sent!', 'green');
    
    // Periodically check execution status
    const statusInterval = setInterval(() => {
      for (const user of users) {
        getExecutionStatus(user.id);
      }
    }, 5000);
    
    // Clean up status interval after 30 seconds
    setTimeout(() => {
      clearInterval(statusInterval);
    }, 30000);
    
  } catch (error) {
    log(`Test failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n=== Test interrupted by user ===', 'bright');
  for (const [userId, socket] of sockets.entries()) {
    socket.disconnect();
    logUser(userId, 'Disconnected', 'red');
  }
  process.exit(0);
});

// Run the test
if (require.main === module) {
  runConcurrentExecutionTest();
}

module.exports = {
  runConcurrentExecutionTest,
  createUserSocket,
  executeCode,
  getExecutionStatus,
  cancelExecution
};

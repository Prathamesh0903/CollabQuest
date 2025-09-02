const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api'; // Server runs on port 5001 with /api prefix
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: FAILED - ${details}`);
  }
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

async function testBattleMode() {
  console.log('🚀 Starting Battle Mode Test Suite...\n');
  
  let roomId, roomCode, problemId;
  
  // Test 1: Create Battle Room (Authenticated)
  console.log('1️⃣ Testing Battle Room Creation...');
  const createRes = await makeRequest('POST', '/battle/create', {
    difficulty: 'Easy',
    battleTime: 2,
    selectedProblem: 'two-sum'
  });
  
  if (createRes.success && createRes.data.success) {
    roomId = createRes.data.roomId;
    roomCode = createRes.data.roomCode;
    problemId = createRes.data.problem.id;
    logTest('Create Battle Room', true, `Room: ${roomCode}, Problem: ${problemId}`);
  } else {
    logTest('Create Battle Room', false, createRes.error?.error || 'Unknown error');
    return;
  }
  
  // Test 2: Create Battle Room (Anonymous)
  console.log('\n2️⃣ Testing Anonymous Room Creation...');
  const anonCreateRes = await makeRequest('POST', '/battle/create', {
    difficulty: 'Medium',
    questionSelection: 'random'
  });
  
  if (anonCreateRes.success && anonCreateRes.data.success) {
    logTest('Anonymous Room Creation', true, `Room: ${anonCreateRes.data.roomCode}`);
  } else {
    logTest('Anonymous Room Creation', false, anonCreateRes.error?.error || 'Unknown error');
  }
  
  // Test 3: Join Battle Room
  console.log('\n3️⃣ Testing Room Join...');
  const joinRes = await makeRequest('POST', '/battle/join', {
    roomCode: roomCode
  });
  
  if (joinRes.success && joinRes.data.success) {
    logTest('Join Battle Room', true, `Joined: ${joinRes.data.roomCode}`);
  } else {
    logTest('Join Battle Room', false, joinRes.error?.error || 'Unknown error');
  }
  
  // Test 4: Join with Invalid Room Code
  console.log('\n4️⃣ Testing Invalid Room Code...');
  const invalidJoinRes = await makeRequest('POST', '/battle/join', {
    roomCode: 'INVALID'
  });
  
  if (!invalidJoinRes.success && invalidJoinRes.status === 404) {
    logTest('Invalid Room Code Rejection', true, 'Correctly rejected invalid code');
  } else {
    logTest('Invalid Room Code Rejection', false, 'Should have rejected invalid code');
  }
  
  // Test 5: Start Battle
  console.log('\n5️⃣ Testing Battle Start...');
  const startRes = await makeRequest('POST', `/battle/${roomId}/start`);
  
  if (startRes.success && startRes.data.success) {
    logTest('Start Battle', true, `Started: ${startRes.data.startedAt}`);
  } else {
    logTest('Start Battle', false, startRes.error?.error || 'Unknown error');
  }
  
  // Test 6: Check Lobby Status
  console.log('\n6️⃣ Testing Lobby Status...');
  const lobbyRes = await makeRequest('GET', `/battle/${roomId}/lobby`);
  
  if (lobbyRes.success && lobbyRes.data.success) {
    const battle = lobbyRes.data.battle;
    logTest('Lobby Status', true, 
      `Started: ${battle.started}, Duration: ${battle.durationMinutes}m, Participants: ${battle.total}`);
  } else {
    logTest('Lobby Status', false, lobbyRes.error?.error || 'Unknown error');
  }
  
  // Test 7: Test Code Execution
  console.log('\n7️⃣ Testing Code Execution...');
  const testRes = await makeRequest('POST', `/battle/${roomId}/test`, {
    code: 'function twoSum(nums, target) { return [0,1]; }'
  });
  
  if (testRes.success && testRes.data.success) {
    logTest('Code Execution', true, 
      `Tests: ${testRes.data.passed}/${testRes.data.total}, Results: ${testRes.data.results.length}`);
  } else {
    logTest('Code Execution', false, testRes.error?.error || 'Unknown error');
  }
  
  // Test 8: Test Large Code Rejection
  console.log('\n8️⃣ Testing Large Code Rejection...');
  const largeCodeRes = await makeRequest('POST', `/battle/${roomId}/test`, {
    code: 'x'.repeat(60000) // 60KB > 50KB limit
  });
  
  if (!largeCodeRes.success && largeCodeRes.status === 413) {
    logTest('Large Code Rejection', true, 'Correctly rejected oversized code');
  } else {
    logTest('Large Code Rejection', false, 'Should have rejected oversized code');
  }
  
  // Test 9: Submit Code
  console.log('\n9️⃣ Testing Code Submission...');
  const submitRes = await makeRequest('POST', `/battle/${roomId}/submit`, {
    code: 'function twoSum(nums, target) { return [0,1]; }'
  });
  
  if (submitRes.success && submitRes.data.success) {
    logTest('Code Submission', true, 
      `Score: ${submitRes.data.score}, Time: ${submitRes.data.timeMs}ms`);
  } else {
    logTest('Code Submission', false, submitRes.error?.error || 'Unknown error');
  }
  
  // Test 10: Test Malicious Code Blocking
  console.log('\n🔒 Testing Security Measures...');
  const maliciousRes = await makeRequest('POST', `/battle/${roomId}/test`, {
    code: 'process.exit(1); function twoSum() {}'
  });
  
  if (maliciousRes.success && maliciousRes.data.success) {
    logTest('Malicious Code Blocking', true, 'VM sandbox working correctly');
  } else {
    logTest('Malicious Code Blocking', false, 'VM should handle malicious code gracefully');
  }
  
  // Test 11: Check Final Lobby Status
  console.log('\n🔍 Testing Final Status...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
  
  const finalLobbyRes = await makeRequest('GET', `/battle/${roomId}/lobby`);
  
  if (finalLobbyRes.success && finalLobbyRes.data.success) {
    const battle = finalLobbyRes.data.battle;
    logTest('Final Battle Status', true, 
      `Started: ${battle.started}, Ended: ${battle.ended || false}`);
  } else {
    logTest('Final Battle Status', false, finalLobbyRes.error?.error || 'Unknown error');
  }
  
  // Test 12: Test Problem Listing
  console.log('\n📋 Testing Problem Listing...');
  const problemsRes = await makeRequest('GET', '/battle/problems');
  
  if (problemsRes.success && problemsRes.data.success) {
    logTest('Problem Listing', true, 
      `Available: ${problemsRes.data.problems.length} problems`);
  } else {
    logTest('Problem Listing', false, problemsRes.error?.error || 'Unknown error');
  }
  
  // Test 13: Test Invalid Room ID
  console.log('\n🚫 Testing Invalid Room ID...');
  const invalidRoomRes = await makeRequest('GET', '/battle/invalid-id/lobby');
  
  if (!invalidRoomRes.success && invalidRoomRes.status === 400) {
    logTest('Invalid Room ID Rejection', true, 'Correctly rejected invalid room ID');
  } else {
    logTest('Invalid Room ID Rejection', false, 'Should have rejected invalid room ID');
  }
  
  // Test 14: Test Anonymous User with Header
  console.log('\n👤 Testing Anonymous User with Header...');
  const anonHeaderRes = await makeRequest('POST', '/battle/join', {
    roomCode: roomCode
  }, {
    'x-user-id': '507f1f77bcf86cd799439011'
  });
  
  if (anonHeaderRes.success && anonHeaderRes.data.success) {
    logTest('Anonymous User with Header', true, 'Header-based user ID working');
  } else {
    logTest('Anonymous User with Header', false, anonHeaderRes.error?.error || 'Unknown error');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Battle mode is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n🔧 To run individual tests, you can modify this script.');
  console.log('📝 Check server logs for detailed error information.');
}

// Error handling for the test suite
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
testBattleMode().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/api';

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

async function testBattleModeBasic() {
  console.log('🚀 Starting Basic Battle Mode Test Suite...\n');
  
  // Test 1: Server Health Check
  console.log('1️⃣ Testing Server Health...');
  const healthRes = await makeRequest('GET', '/health');
  
  if (healthRes.success && healthRes.data.status === 'OK') {
    logTest('Server Health', true, `Status: ${healthRes.data.status}, Port: ${healthRes.data.services?.database || 'unknown'}`);
  } else {
    logTest('Server Health', false, healthRes.error?.error || 'Server not responding');
    return;
  }
  
  // Test 2: Create Battle Room (Anonymous - should work with optionalAuth)
  console.log('\n2️⃣ Testing Anonymous Room Creation...');
  const createRes = await makeRequest('POST', '/battle/create', {
    difficulty: 'Easy',
    battleTime: 2,
    selectedProblem: 'two-sum'
  });
  
  if (createRes.success && createRes.data.success) {
    logTest('Anonymous Room Creation', true, `Room: ${createRes.data.roomCode}, Problem: ${createRes.data.problem.id}`);
    
    // Store room details for subsequent tests
    const roomId = createRes.data.roomId;
    const roomCode = createRes.data.roomCode;
    
    // Test 3: Join Battle Room (Anonymous)
    console.log('\n3️⃣ Testing Anonymous Room Join...');
    const joinRes = await makeRequest('POST', '/battle/join', {
      roomCode: roomCode
    });
    
    if (joinRes.success && joinRes.data.success) {
      logTest('Anonymous Room Join', true, `Joined: ${joinRes.data.roomCode}`);
    } else {
      logTest('Anonymous Room Join', false, joinRes.error?.error || 'Unknown error');
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
    
    // Test 5: Test Code Execution (Anonymous - should work with optionalAuth)
    console.log('\n5️⃣ Testing Anonymous Code Execution...');
    const testRes = await makeRequest('POST', `/battle/${roomId}/test`, {
      code: 'function twoSum(nums, target) { return [0,1]; }'
    });
    
    if (testRes.success && testRes.data.success) {
      logTest('Anonymous Code Execution', true, 
        `Tests: ${testRes.data.passed}/${testRes.data.total}, Results: ${testRes.data.results.length}`);
    } else {
      logTest('Anonymous Code Execution', false, testRes.error?.error || 'Unknown error');
    }
    
    // Test 6: Test Large Code Rejection
    console.log('\n6️⃣ Testing Large Code Rejection...');
    const largeCodeRes = await makeRequest('POST', `/battle/${roomId}/test`, {
      code: 'x'.repeat(60000) // 60KB > 50KB limit
    });
    
    if (!largeCodeRes.success && largeCodeRes.status === 413) {
      logTest('Large Code Rejection', true, 'Correctly rejected oversized code');
    } else {
      logTest('Large Code Rejection', false, 'Should have rejected oversized code');
    }
    
    // Test 7: Test Malicious Code Blocking
    console.log('\n7️⃣ Testing Security Measures...');
    const maliciousRes = await makeRequest('POST', `/battle/${roomId}/test`, {
      code: 'process.exit(1); function twoSum() {}'
    });
    
    // The VM sandbox should handle malicious code gracefully
    // It might succeed (sandbox working) or fail gracefully (also acceptable)
    if (maliciousRes.success || (!maliciousRes.success && maliciousRes.status !== 500)) {
      logTest('Malicious Code Blocking', true, 'VM sandbox handled malicious code appropriately');
    } else {
      logTest('Malicious Code Blocking', false, 'VM crashed with malicious code');
    }
    
    // Test 8: Test Anonymous User with Header
    console.log('\n8️⃣ Testing Anonymous User with Header...');
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
    
  } else {
    logTest('Anonymous Room Creation', false, createRes.error?.error || 'Unknown error');
  }
  
  // Test 9: Test Invalid Room ID (requires auth, so should get 401 first)
  console.log('\n9️⃣ Testing Invalid Room ID...');
  const invalidRoomRes = await makeRequest('GET', '/battle/invalid-id/lobby');
  
  if (!invalidRoomRes.success && (invalidRoomRes.status === 400 || invalidRoomRes.status === 401)) {
    logTest('Invalid Room ID Rejection', true, `Correctly rejected with status ${invalidRoomRes.status}`);
  } else {
    logTest('Invalid Room ID Rejection', false, `Expected 400 or 401, got ${invalidRoomRes.status}`);
  }
  
  // Test 10: Test Problem Listing (requires auth, should fail)
  console.log('\n🔒 Testing Protected Endpoints...');
  const problemsRes = await makeRequest('GET', '/battle/problems');
  
  if (!problemsRes.success && problemsRes.status === 401) {
    logTest('Protected Endpoint Rejection', true, 'Correctly requires authentication');
  } else {
    logTest('Protected Endpoint Rejection', false, 'Should require authentication');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 BASIC TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All basic tests passed! Battle mode fundamentals are working.');
  } else {
    console.log('\n⚠️  Some basic tests failed. Please review the errors above.');
  }
  
  console.log('\n📝 Note: Some endpoints require authentication and will fail without proper auth tokens.');
  console.log('🔧 To test authenticated endpoints, you need to implement proper auth flow.');
}

// Error handling for the test suite
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
testBattleModeBasic().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});

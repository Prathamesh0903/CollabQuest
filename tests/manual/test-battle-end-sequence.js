const axios = require('axios');
const mongoose = require('mongoose');

// Test the end-of-battle sequence specifically
async function testBattleEndSequence() {
  const BASE_URL = 'http://localhost:5000/api/battle';
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-platform';
  
  console.log('🔍 Testing Battle End Sequence and Data Consistency\n');
  console.log('==================================================');

  let roomId = null;
  let roomCode = null;

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create battle
    console.log('1️⃣ Creating battle...');
    const createResponse = await axios.post(`${BASE_URL}/create`, {
      difficulty: 'Easy',
      questionSelection: 'selected',
      selectedProblem: 'two-sum',
      battleTime: 1 // 1 minute for quick test
    });
    
    roomId = createResponse.data.roomId;
    roomCode = createResponse.data.roomCode;
    console.log(`✅ Battle created: ${roomId}\n`);

    // Step 2: Join participants
    const users = [
      { id: '507f1f77bcf86cd799439011', name: 'Alice' },
      { id: '507f1f77bcf86cd799439012', name: 'Bob' }
    ];

    for (const user of users) {
      console.log(`2️⃣ ${user.name} joining...`);
      await axios.post(`${BASE_URL}/join`, {
        roomCode: roomCode
      }, {
        headers: { 'x-user-id': user.id }
      });
      console.log(`✅ ${user.name} joined`);
    }

    // Step 3: Start battle
    console.log('\n3️⃣ Starting battle...');
    await axios.post(`${BASE_URL}/${roomId}/start`);
    console.log('✅ Battle started\n');

    // Step 4: Submit solutions
    const solutions = [
      {
        user: users[0],
        code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        expectedResult: 'perfect'
      },
      {
        user: users[1],
        code: `function twoSum(nums, target) {
  return [0, 1]; // Wrong solution
}`,
        expectedResult: 'wrong'
      }
    ];

    const submissions = [];
    for (const solution of solutions) {
      console.log(`4️⃣ ${solution.user.name} submitting solution...`);
      const response = await axios.post(`${BASE_URL}/${roomId}/submit`, {
        code: solution.code
      }, {
        headers: { 'x-user-id': solution.user.id }
      });
      
      submissions.push({
        user: solution.user,
        ...response.data
      });
      
      console.log(`✅ ${solution.user.name}: ${response.data.passed}/${response.data.total} passed, score: ${response.data.score}`);
    }

    // Step 5: Wait a moment for any async processing
    console.log('\n5️⃣ Waiting for async processing...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 6: Check if battle auto-ended
    console.log('\n6️⃣ Checking if battle auto-ended...');
    const resultsResponse = await axios.get(`${BASE_URL}/${roomId}/results`);
    const battleEnded = resultsResponse.data.battleInfo.ended;
    console.log(`Battle ended: ${battleEnded}`);

    // Step 7: If not ended, end manually
    if (!battleEnded) {
      console.log('\n7️⃣ Manually ending battle...');
      await axios.post(`${BASE_URL}/${roomId}/end`);
      console.log('✅ Battle ended manually');
    }

    // Step 8: Verify final results
    console.log('\n8️⃣ Verifying final results...');
    const finalResultsResponse = await axios.get(`${BASE_URL}/${roomId}/results`);
    const finalResults = finalResultsResponse.data.results;
    
    console.log(`✅ Final results: ${finalResults.length} participants`);
    finalResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name} - Score: ${result.score}, Rank: ${result.rank}, Winner: ${result.isWinner}`);
    });

    // Step 9: Verify database consistency
    console.log('\n9️⃣ Verifying database consistency...');
    const Room = require('./server/models/Room');
    const Submission = require('./server/models/Submission');

    // Check room state
    const room = await Room.findById(roomId).populate('participants.userId', 'displayName email');
    console.log(`✅ Room in database:`);
    console.log(`   Status: ${room?.status}`);
    console.log(`   Mode: ${room?.mode}`);
    console.log(`   Participants: ${room?.participants?.length || 0}`);

    // Check submissions
    const dbSubmissions = await Submission.find({ sessionId: roomId });
    console.log(`✅ Submissions in database: ${dbSubmissions.length}`);
    
    dbSubmissions.forEach((sub, index) => {
      console.log(`   [${index}] User: ${sub.user}, Score: ${sub.score}, Status: ${sub.status}, Tests: ${sub.passedTestCases}/${sub.totalTestCases}`);
    });

    // Step 10: Data consistency checks
    console.log('\n🔟 Data consistency checks...');
    
    // Check 1: Results count matches submissions count
    const resultsCount = finalResults.length;
    const submissionsCount = dbSubmissions.length;
    console.log(`✅ Results count (${resultsCount}) matches submissions count (${submissionsCount}): ${resultsCount === submissionsCount ? 'PASS' : 'FAIL'}`);

    // Check 2: All submissions have required data
    let allSubmissionsValid = true;
    finalResults.forEach(result => {
      if (result.score === undefined || result.score === null) {
        console.log(`❌ Result for ${result.name} missing score`);
        allSubmissionsValid = false;
      }
      if (result.passed === undefined || result.passed === null) {
        console.log(`❌ Result for ${result.name} missing passed count`);
        allSubmissionsValid = false;
      }
      if (result.total === undefined || result.total === null) {
        console.log(`❌ Result for ${result.name} missing total count`);
        allSubmissionsValid = false;
      }
    });
    console.log(`✅ All results have required data: ${allSubmissionsValid ? 'PASS' : 'FAIL'}`);

    // Check 3: Database submissions match in-memory results
    let dbMemoryMatch = true;
    for (const result of finalResults) {
      const dbSubmission = dbSubmissions.find(sub => sub.user?.toString() === result.userId);
      if (!dbSubmission) {
        console.log(`❌ No database submission found for user ${result.userId}`);
        dbMemoryMatch = false;
      } else if (dbSubmission.score !== result.score) {
        console.log(`❌ Score mismatch for user ${result.userId}: DB=${dbSubmission.score}, Memory=${result.score}`);
        dbMemoryMatch = false;
      }
    }
    console.log(`✅ Database submissions match in-memory results: ${dbMemoryMatch ? 'PASS' : 'FAIL'}`);

    // Check 4: Battle state consistency
    const lobbyResponse = await axios.get(`${BASE_URL}/${roomId}/lobby`);
    const lobbyBattleEnded = lobbyResponse.data.battle.ended;
    const resultsBattleEnded = finalResultsResponse.data.battleInfo.ended;
    console.log(`✅ Battle end state consistent (Lobby: ${lobbyBattleEnded}, Results: ${resultsBattleEnded}): ${lobbyBattleEnded === resultsBattleEnded ? 'PASS' : 'FAIL'}`);

    // Step 11: Test results endpoint multiple times
    console.log('\n1️⃣1️⃣ Testing results endpoint consistency...');
    const results1 = await axios.get(`${BASE_URL}/${roomId}/results`);
    const results2 = await axios.get(`${BASE_URL}/${roomId}/results`);
    
    const resultsConsistent = JSON.stringify(results1.data.results) === JSON.stringify(results2.data.results);
    console.log(`✅ Results endpoint returns consistent data: ${resultsConsistent ? 'PASS' : 'FAIL'}`);

    // Final summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`Room ID: ${roomId}`);
    console.log(`Battle Ended: ${finalResultsResponse.data.battleInfo.ended}`);
    console.log(`Results Count: ${finalResults.length}`);
    console.log(`Database Submissions: ${dbSubmissions.length}`);
    console.log(`Data Consistency: ${allSubmissionsValid && dbMemoryMatch && resultsConsistent ? 'PASS' : 'FAIL'}`);

    if (allSubmissionsValid && dbMemoryMatch && resultsConsistent) {
      console.log('\n🎉 ALL TESTS PASSED! Battle end sequence is working correctly.');
    } else {
      console.log('\n❌ SOME TESTS FAILED! There are data consistency issues.');
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testBattleEndSequence();

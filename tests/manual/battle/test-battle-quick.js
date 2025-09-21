const axios = require('axios');

// Quick battle simulation test
async function quickBattleTest() {
  const BASE_URL = 'http://localhost:5000/api/battle';
  
  console.log('🚀 Quick Battle Test Starting...\n');

  try {
    // Step 1: Create battle
    console.log('1️⃣ Creating battle...');
    const createResponse = await axios.post(`${BASE_URL}/create`, {
      difficulty: 'Easy',
      questionSelection: 'selected',
      selectedProblem: 'two-sum',
      battleTime: 2 // 2 minutes for quick test
    });
    
    const roomId = createResponse.data.roomId;
    const roomCode = createResponse.data.roomCode;
    console.log(`✅ Battle created: ${roomId} (${roomCode})`);

    // Step 2: Join as user 1
    console.log('\n2️⃣ User 1 joining...');
    const user1Id = '507f1f77bcf86cd799439011';
    await axios.post(`${BASE_URL}/join`, {
      roomCode: roomCode
    }, {
      headers: { 'x-user-id': user1Id }
    });
    console.log('✅ User 1 joined');

    // Step 3: Join as user 2
    console.log('\n3️⃣ User 2 joining...');
    const user2Id = '507f1f77bcf86cd799439012';
    await axios.post(`${BASE_URL}/join`, {
      roomCode: roomCode
    }, {
      headers: { 'x-user-id': user2Id }
    });
    console.log('✅ User 2 joined');

    // Step 4: Check lobby
    console.log('\n4️⃣ Checking lobby...');
    const lobbyResponse = await axios.get(`${BASE_URL}/${roomId}/lobby`);
    console.log(`✅ Lobby: ${lobbyResponse.data.participants.length} participants`);
    console.log(`   Battle started: ${lobbyResponse.data.battle.started}`);
    console.log(`   Battle ended: ${lobbyResponse.data.battle.ended}`);

    // Step 5: Start battle
    console.log('\n5️⃣ Starting battle...');
    await axios.post(`${BASE_URL}/${roomId}/start`);
    console.log('✅ Battle started');

    // Step 6: Submit perfect solution (user 1)
    console.log('\n6️⃣ User 1 submitting perfect solution...');
    const perfectCode = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;
    
    const submit1Response = await axios.post(`${BASE_URL}/${roomId}/submit`, {
      code: perfectCode
    }, {
      headers: { 'x-user-id': user1Id }
    });
    console.log(`✅ User 1 submitted: ${submit1Response.data.passed}/${submit1Response.data.total} passed, score: ${submit1Response.data.score}`);

    // Step 7: Submit partial solution (user 2)
    console.log('\n7️⃣ User 2 submitting partial solution...');
    const partialCode = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`;
    
    const submit2Response = await axios.post(`${BASE_URL}/${roomId}/submit`, {
      code: partialCode
    }, {
      headers: { 'x-user-id': user2Id }
    });
    console.log(`✅ User 2 submitted: ${submit2Response.data.passed}/${submit2Response.data.total} passed, score: ${submit2Response.data.score}`);

    // Step 8: Check results
    console.log('\n8️⃣ Checking results...');
    const resultsResponse = await axios.get(`${BASE_URL}/${roomId}/results`);
    console.log(`✅ Results retrieved: ${resultsResponse.data.results.length} participants`);
    console.log(`   Battle ended: ${resultsResponse.data.battleInfo.ended}`);
    
    resultsResponse.data.results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name} - Score: ${result.score}, Rank: ${result.rank}`);
    });

    // Step 9: If not ended, end manually
    if (!resultsResponse.data.battleInfo.ended) {
      console.log('\n9️⃣ Manually ending battle...');
      await axios.post(`${BASE_URL}/${roomId}/end`);
      console.log('✅ Battle ended manually');
      
      // Check results again
      const finalResultsResponse = await axios.get(`${BASE_URL}/${roomId}/results`);
      console.log('\n🔟 Final results:');
      finalResultsResponse.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name} - Score: ${result.score}, Rank: ${result.rank}`);
      });
    }

    console.log('\n🎉 Quick Battle Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n💥 Quick Battle Test Failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
quickBattleTest();

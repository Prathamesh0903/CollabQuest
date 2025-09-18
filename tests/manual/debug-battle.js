const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function debugBattleMode() {
  console.log('🔍 Debugging Battle Mode Participant Tracking...\n');
  
  // Step 1: Create room
  console.log('1️⃣ Creating battle room...');
  const createRes = await axios.post(`${BASE_URL}/battle/create`, {
    difficulty: 'Easy',
    battleTime: 2,
    selectedProblem: 'two-sum'
  });
  
  if (!createRes.data.success) {
    console.log('❌ Failed to create room:', createRes.data);
    return;
  }
  
  const roomId = createRes.data.roomId;
  const roomCode = createRes.data.roomCode;
  console.log(`✅ Room created: ${roomCode} (ID: ${roomId})`);
  
  // Step 2: Join room
  console.log('\n2️⃣ Joining room...');
  const joinRes = await axios.post(`${BASE_URL}/battle/join`, {
    roomCode: roomCode
  });
  
  if (!joinRes.data.success) {
    console.log('❌ Failed to join room:', joinRes.data);
    return;
  }
  
  console.log('✅ Joined room successfully');
  
  // Step 3: Check room state
  console.log('\n3️⃣ Checking room state...');
  try {
    const stateRes = await axios.get(`${BASE_URL}/battle/${roomId}/lobby`);
    console.log('✅ Lobby response:', JSON.stringify(stateRes.data, null, 2));
  } catch (error) {
    console.log('❌ Lobby failed (expected for auth):', error.response?.status, error.response?.data);
  }
  
  // Step 4: Try to execute code
  console.log('\n4️⃣ Testing code execution...');
  try {
    const testRes = await axios.post(`${BASE_URL}/battle/${roomId}/test`, {
      code: 'function twoSum(nums, target) { return [0,1]; }'
    });
    console.log('✅ Code execution succeeded:', testRes.data);
  } catch (error) {
    console.log('❌ Code execution failed:', error.response?.status, error.response?.data);
  }
  
  // Step 5: Check what user ID was generated
  console.log('\n5️⃣ Checking request details...');
  console.log('Create response user ID:', createRes.data.state?.users);
  console.log('Join response user ID:', joinRes.data.state?.users);
  
  console.log('\n🔍 Debug complete. Check the responses above to understand the issue.');
}

debugBattleMode().catch(console.error);

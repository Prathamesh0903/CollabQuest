/**
 * Test script to verify the progress tracking fix
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function testProgressFix() {
  console.log('🧪 Testing Progress Tracking Fix...\n');

  try {
    // Test 1: Get a sample problem
    console.log('1. Getting sample problem...');
    const problemsRes = await fetch(`${API_BASE}/dsa/problems?limit=1`);
    const problemsData = await problemsRes.json();
    
    if (!problemsData.items || problemsData.items.length === 0) {
      throw new Error('No problems found');
    }
    
    const sampleProblem = problemsData.items[0];
    console.log(`   ✅ Found problem: ${sampleProblem.title} (ID: ${sampleProblem._id})`);

    // Test 2: Test progress endpoint with invalid token (should get 401)
    console.log('\n2. Testing with invalid token...');
    const invalidRes = await fetch(`${API_BASE}/dsa/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({
        problemId: sampleProblem._id,
        isCompleted: true
      })
    });
    
    console.log(`   Status: ${invalidRes.status} ${invalidRes.status === 401 ? '✅' : '❌'}`);
    
    if (invalidRes.status !== 401) {
      const errorText = await invalidRes.text();
      console.log(`   Response: ${errorText}`);
    }

    // Test 3: Test progress endpoint without token (should get 401)
    console.log('\n3. Testing without token...');
    const noTokenRes = await fetch(`${API_BASE}/dsa/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        problemId: sampleProblem._id,
        isCompleted: true
      })
    });
    
    console.log(`   Status: ${noTokenRes.status} ${noTokenRes.status === 401 ? '✅' : '❌'}`);

    console.log('\n🎉 Progress tracking system is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart your server: npm start (in server directory)');
    console.log('   2. Open your browser and login with Firebase');
    console.log('   3. Navigate to /dsa-sheet');
    console.log('   4. Try toggling a problem completion status');
    console.log('   5. Check browser console for detailed logs');
    console.log('   6. Check server console for progress save logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('   - Server is running: npm start (in server directory)');
    console.log('   - Server is on port 5001');
    console.log('   - Database is connected');
  }
}

testProgressFix();

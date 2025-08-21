const axios = require('axios');

async function testServerConnection() {
  console.log('🔍 Testing server connection...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health', {
      timeout: 5000
    });
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Code execution
    console.log('\n2. Testing code execution...');
    const executionResponse = await axios.post('http://localhost:5000/api/execute', {
      language: 'javascript',
      code: 'console.log("Hello from test!");',
      input: ''
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Code execution passed:', executionResponse.data);
    
    // Test 3: Supported languages
    console.log('\n3. Testing supported languages...');
    const languagesResponse = await axios.get('http://localhost:5000/api/execute/languages', {
      timeout: 5000
    });
    console.log('✅ Languages endpoint passed:', languagesResponse.data);
    
    console.log('\n🎉 All tests passed! Server is running correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution: Make sure the server is running on port 5000');
      console.error('   Run: cd server && npm start');
    } else if (error.response) {
      console.error('\n💡 Server responded with error:', error.response.status, error.response.data);
    }
  }
}

testServerConnection();

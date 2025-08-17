const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Headers for authenticated requests
const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test function to create a collaborative session
async function createCollaborativeSession() {
  try {
    console.log('🚀 Creating a new collaborative session...\n');

    const sessionData = {
      name: 'My First Collaborative Session',
      description: 'A test session for collaborative coding',
      type: 'collaborative',
      mode: 'real-time',
      defaultLanguage: 'javascript',
      isPublic: false,
      tags: ['javascript', 'collaborative', 'test'],
      category: 'Programming',
      difficulty: 'intermediate',
      settings: {
        maxCollaborators: 10,
        allowCodeExecution: true,
        allowFileCreation: true,
        allowFileDeletion: false,
        requireApproval: false,
        autoSave: true,
        autoSaveInterval: 30
      }
    };

    const response = await axios.post(`${BASE_URL}/collaborative-sessions`, sessionData, { headers });

    if (response.data.success) {
      const { data: session, sharableUrl } = response.data;
      
      console.log('✅ Session created successfully!');
      console.log(`📋 Session ID: ${session.sessionId}`);
      console.log(`📝 Name: ${session.name}`);
      console.log(`🔗 Sharable URL: ${sharableUrl}`);
      console.log(`👥 Max Collaborators: ${session.settings.maxCollaborators}`);
      console.log(`🌐 Public: ${session.isPublic}`);
      console.log(`📅 Created: ${session.createdAt}`);
      console.log('\n📋 Full Session Data:');
      console.log(JSON.stringify(session, null, 2));
      
      return session.sessionId;
    }
  } catch (error) {
    console.error('❌ Error creating session:', error.response?.data || error.message);
  }
}

// Test function to get sharable URL for an existing session
async function getSharableUrl(sessionId) {
  try {
    console.log(`\n🔗 Getting sharable URL for session: ${sessionId}...\n`);

    const response = await axios.get(`${BASE_URL}/collaborative-sessions/${sessionId}/share-url`, { headers });

    if (response.data.success) {
      const { data } = response.data;
      
      console.log('✅ Sharable URL retrieved successfully!');
      console.log(`📋 Session ID: ${data.sessionId}`);
      console.log(`📝 Name: ${data.name}`);
      console.log(`🔗 Sharable URL: ${data.sharableUrl}`);
      console.log(`🌐 Public: ${data.isPublic}`);
      console.log(`🔐 Access Code: ${data.accessCode || 'None'}`);
      console.log(`⏰ Access Code Expires: ${data.accessCodeExpiresAt || 'Never'}`);
    }
  } catch (error) {
    console.error('❌ Error getting sharable URL:', error.response?.data || error.message);
  }
}

// Test function to set access code for a session
async function setAccessCode(sessionId) {
  try {
    console.log(`\n🔐 Setting access code for session: ${sessionId}...\n`);

    const accessCodeData = {
      accessCode: 'ABC123',
      expiresInHours: 24
    };

    const response = await axios.post(`${BASE_URL}/collaborative-sessions/${sessionId}/access-code`, accessCodeData, { headers });

    if (response.data.success) {
      const { data } = response.data;
      
      console.log('✅ Access code set successfully!');
      console.log(`📋 Session ID: ${data.sessionId}`);
      console.log(`📝 Name: ${data.name}`);
      console.log(`🔗 Sharable URL: ${data.sharableUrl}`);
      console.log(`🔐 Access Code: ${data.accessCode}`);
      console.log(`⏰ Expires In: ${data.expiresInHours} hours`);
      console.log(`📅 Expires At: ${data.accessCodeExpiresAt}`);
    }
  } catch (error) {
    console.error('❌ Error setting access code:', error.response?.data || error.message);
  }
}

// Test function to join a session
async function joinSession(sessionId, accessCode = null) {
  try {
    console.log(`\n👥 Joining session: ${sessionId}...\n`);

    const joinData = accessCode ? { accessCode } : {};

    const response = await axios.post(`${BASE_URL}/collaborative-sessions/${sessionId}/join`, joinData, { headers });

    if (response.data.success) {
      const { data: session, message } = response.data;
      
      console.log('✅ Joined session successfully!');
      console.log(`📋 Session ID: ${session.sessionId}`);
      console.log(`📝 Name: ${session.name}`);
      console.log(`👥 Collaborators: ${session.collaborators.length}`);
      console.log(`📅 Message: ${message}`);
    }
  } catch (error) {
    console.error('❌ Error joining session:', error.response?.data || error.message);
  }
}

// Test function to get session details
async function getSessionDetails(sessionId) {
  try {
    console.log(`\n📋 Getting session details: ${sessionId}...\n`);

    const response = await axios.get(`${BASE_URL}/collaborative-sessions/${sessionId}`, { headers });

    if (response.data.success) {
      const { data: session } = response.data;
      
      console.log('✅ Session details retrieved successfully!');
      console.log(`📋 Session ID: ${session.sessionId}`);
      console.log(`📝 Name: ${session.name}`);
      console.log(`📄 Description: ${session.description}`);
      console.log(`👤 Created By: ${session.createdBy.displayName}`);
      console.log(`👥 Collaborators: ${session.collaborators.length}`);
      console.log(`📁 Files: ${session.files.length}`);
      console.log(`🌐 Public: ${session.isPublic}`);
      console.log(`📅 Created: ${session.createdAt}`);
      console.log(`📅 Updated: ${session.updatedAt}`);
    }
  } catch (error) {
    console.error('❌ Error getting session details:', error.response?.data || error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing Collaborative Session Endpoints\n');
  console.log('=' .repeat(50));

  // Test 1: Create a new session
  const sessionId = await createCollaborativeSession();
  
  if (sessionId) {
    // Test 2: Get sharable URL
    await getSharableUrl(sessionId);
    
    // Test 3: Set access code
    await setAccessCode(sessionId);
    
    // Test 4: Get session details
    await getSessionDetails(sessionId);
    
    // Test 5: Join session (rejoin as creator)
    await joinSession(sessionId);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ All tests completed!');
}

// Example usage with curl commands
function showCurlExamples() {
  console.log('\n📖 Example cURL Commands:\n');
  
  console.log('1. Create a new collaborative session:');
  console.log(`curl -X POST ${BASE_URL}/collaborative-sessions \\
  -H "Authorization: Bearer ${AUTH_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Collaborative Session",
    "description": "A test session",
    "defaultLanguage": "javascript",
    "isPublic": false
  }'`);
  
  console.log('\n2. Get sharable URL for a session:');
  console.log(`curl -X GET ${BASE_URL}/collaborative-sessions/SESSION_ID/share-url \\
  -H "Authorization: Bearer ${AUTH_TOKEN}"`);
  
  console.log('\n3. Set access code for a session:');
  console.log(`curl -X POST ${BASE_URL}/collaborative-sessions/SESSION_ID/access-code \\
  -H "Authorization: Bearer ${AUTH_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accessCode": "ABC123",
    "expiresInHours": 24
  }'`);
  
  console.log('\n4. Join a session:');
  console.log(`curl -X POST ${BASE_URL}/collaborative-sessions/SESSION_ID/join \\
  -H "Authorization: Bearer ${AUTH_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accessCode": "ABC123"
  }'`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  if (AUTH_TOKEN === 'your-jwt-token-here') {
    console.log('⚠️  Please set a valid JWT token in the AUTH_TOKEN variable');
    console.log('   You can get a token by logging in through the auth endpoint');
    showCurlExamples();
  } else {
    runTests();
  }
}

module.exports = {
  createCollaborativeSession,
  getSharableUrl,
  setAccessCode,
  joinSession,
  getSessionDetails
};

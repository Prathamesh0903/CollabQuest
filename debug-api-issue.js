const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const EXECUTOR_URL = 'http://localhost:5001';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}[DEBUG]${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

async function testEndpoint(url, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    // Check if response is HTML
    const contentType = response.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html') || 
                   (response.data && typeof response.data === 'string' && response.data.includes('<!DOCTYPE'));
    
    if (isHtml) {
      logError(`Endpoint ${url} returned HTML instead of JSON`);
      log(`Content-Type: ${contentType}`, 'yellow');
      log(`Response preview: ${response.data.substring(0, 200)}...`, 'yellow');
      return { success: false, error: 'HTML response', data: response.data };
    }

    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      const isHtml = contentType.includes('text/html') || 
                     (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE'));
      
      if (isHtml) {
        logError(`Endpoint ${url} returned HTML error page`);
        log(`Status: ${error.response.status}`, 'yellow');
        log(`Content-Type: ${contentType}`, 'yellow');
        log(`Response preview: ${error.response.data.substring(0, 200)}...`, 'yellow');
        return { success: false, error: 'HTML error page', status: error.response.status, data: error.response.data };
      }
      
      return { success: false, error: error.response.data, status: error.response.status };
    }
    
    return { success: false, error: error.message };
  }
}

async function diagnoseIssue() {
  console.log('🔍 Diagnosing API Issue: "Unexpected token \'<\', <!DOCTYPE..."');
  console.log('=============================================================\n');

  // Test 1: Check if main server is running
  log('Testing main server availability...', 'blue');
  const mainServerTest = await testEndpoint(`${BASE_URL}/api/health`);
  
  if (!mainServerTest.success) {
    logError('Main server is not responding correctly');
    log(`Error: ${mainServerTest.error}`, 'yellow');
    console.log('\n🔧 Solutions:');
    console.log('1. Start the main server: cd server && npm run dev');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify server logs for errors');
    return;
  }
  
  logSuccess('Main server is responding correctly');
  log(`Health status: ${JSON.stringify(mainServerTest.data, null, 2)}`, 'green');

  // Test 2: Check if executor service is running
  log('\nTesting executor service availability...', 'blue');
  const executorTest = await testEndpoint(`${EXECUTOR_URL}/health`);
  
  if (!executorTest.success) {
    logWarning('Executor service is not responding correctly');
    log(`Error: ${executorTest.error}`, 'yellow');
    console.log('\n🔧 Solutions:');
    console.log('1. Start the executor service: cd executor && npm start');
    console.log('2. Check if Node.js and Python are installed');
    console.log('3. Verify executor logs for errors');
  } else {
    logSuccess('Executor service is responding correctly');
  }

  // Test 3: Test the specific code execution endpoint
  log('\nTesting code execution endpoint...', 'blue');
  const executeTest = await testEndpoint(
    `${BASE_URL}/api/rooms/test/execute`,
    'POST',
    {
      language: 'javascript',
      code: 'console.log("Hello World");'
    }
  );

  if (!executeTest.success) {
    logError('Code execution endpoint is not working correctly');
    log(`Error: ${executeTest.error}`, 'yellow');
    
    if (executeTest.error === 'HTML response' || executeTest.error === 'HTML error page') {
      console.log('\n🔧 This is the root cause! The server is returning HTML instead of JSON.');
      console.log('\nPossible causes:');
      console.log('1. Server is crashing and returning error page');
      console.log('2. Wrong route configuration');
      console.log('3. Authentication middleware issue');
      console.log('4. Express error handler returning HTML');
      
      console.log('\n🔧 Solutions:');
      console.log('1. Check server logs for errors');
      console.log('2. Verify the route is properly configured');
      console.log('3. Check authentication middleware');
      console.log('4. Ensure proper error handling');
    }
  } else {
    logSuccess('Code execution endpoint is working correctly');
    log(`Response: ${JSON.stringify(executeTest.data, null, 2)}`, 'green');
  }

  // Test 4: Test with authentication
  log('\nTesting code execution with authentication...', 'blue');
  const authTest = await testEndpoint(
    `${BASE_URL}/api/rooms/test/execute`,
    'POST',
    {
      language: 'javascript',
      code: 'console.log("Hello World");'
    },
    {
      'Authorization': 'Bearer test-token'
    }
  );

  if (!authTest.success) {
    logWarning('Authentication might be required');
    log(`Error: ${authTest.error}`, 'yellow');
  } else {
    logSuccess('Code execution works with authentication');
  }

  // Test 5: Check specific routes
  log('\nTesting individual routes...', 'blue');
  
  const routes = [
    '/api/rooms',
    '/api/auth',
    '/api/users',
    '/api/health'
  ];

  for (const route of routes) {
    const routeTest = await testEndpoint(`${BASE_URL}${route}`);
    if (routeTest.success) {
      logSuccess(`Route ${route} is working`);
    } else {
      logWarning(`Route ${route} has issues: ${routeTest.error}`);
    }
  }

  // Summary
  console.log('\n📋 Summary:');
  console.log('===========');
  
  if (mainServerTest.success && executeTest.success) {
    logSuccess('All tests passed! The API should be working correctly.');
    console.log('\nIf you\'re still getting HTML responses, check:');
    console.log('1. Browser cache - try hard refresh (Ctrl+F5)');
    console.log('2. Network tab in browser dev tools');
    console.log('3. CORS configuration');
    console.log('4. Frontend fetch configuration');
  } else {
    logError('Issues found. Please fix the problems above.');
  }
}

// Run diagnostics
diagnoseIssue().catch(console.error); 
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const testConfig = {
  timeout: 30000, // 30 seconds
  reporter: 'spec',
  require: ['dotenv/config'],
  env: {
    NODE_ENV: 'test',
    TEST_MONGODB_URI: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/collabquest_test'
  }
};

// Test suites to run
const testSuites = [
  'tests/dsa.critical.test.js',
  'tests/dsa.api.test.js' // Existing test file
];

async function runTests() {
  console.log('🧪 Starting DSA Critical Path Tests...\n');
  
  const results = [];
  
  for (const testFile of testSuites) {
    console.log(`\n📋 Running test suite: ${testFile}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await runTestSuite(testFile);
      results.push({ file: testFile, success: result.success, output: result.output });
      
      if (result.success) {
        console.log(`✅ ${testFile} - PASSED`);
      } else {
        console.log(`❌ ${testFile} - FAILED`);
        console.log(result.output);
      }
    } catch (error) {
      console.log(`💥 ${testFile} - ERROR: ${error.message}`);
      results.push({ file: testFile, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.file}: ${result.error || 'Test failures'}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

function runTestSuite(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, '..', testFile);
    const args = [
      testPath,
      '--timeout', testConfig.timeout.toString(),
      '--reporter', testConfig.reporter,
      '--require', 'dotenv/config'
    ];
    
    const child = spawn('npx', ['mocha', ...args], {
      env: { ...process.env, ...testConfig.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, output: output + errorOutput });
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Health check before running tests
async function healthCheck() {
  console.log('🔍 Performing health check...');
  
  try {
    const mongoose = require('mongoose');
    const testDbUri = testConfig.env.TEST_MONGODB_URI;
    
    await mongoose.connect(testDbUri);
    console.log('✅ Database connection successful');
    
    // Check if test database is accessible
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections in test database`);
    
    await mongoose.connection.close();
    console.log('✅ Health check completed\n');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('\n💡 Make sure MongoDB is running and accessible');
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await healthCheck();
    await runTests();
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests, healthCheck };

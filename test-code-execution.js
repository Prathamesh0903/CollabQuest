const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EXECUTOR_URL = 'http://localhost:5001';

// Test cases for basic functionality
const basicTestCases = [
  {
    name: 'JavaScript Hello World',
    language: 'javascript',
    code: 'console.log("Hello World");',
    expectedOutput: 'Hello World\n'
  },
  {
    name: 'Python Hello World',
    language: 'python',
    code: 'print("Hello World")',
    expectedOutput: 'Hello World\n'
  },
  {
    name: 'JavaScript with Input',
    language: 'javascript',
    code: 'const input = process.argv[2] || "default"; console.log("Input:", input);',
    input: 'test input',
    expectedOutput: 'Input: test input\n'
  },
  {
    name: 'Python with Input',
    language: 'python',
    code: 'import sys; print("Input:", sys.argv[1] if len(sys.argv) > 1 else "default")',
    input: 'test input',
    expectedOutput: 'Input: test input\n'
  },
  {
    name: 'JavaScript Math',
    language: 'javascript',
    code: 'console.log(2 + 2);',
    expectedOutput: '4\n'
  },
  {
    name: 'Python Math',
    language: 'python',
    code: 'print(2 + 2)',
    expectedOutput: '4\n'
  },
  {
    name: 'JavaScript Array Operations',
    language: 'javascript',
    code: 'const arr = [1, 2, 3, 4, 5]; console.log(arr.map(x => x * 2).join(", "));',
    expectedOutput: '2, 4, 6, 8, 10\n'
  },
  {
    name: 'Python List Operations',
    language: 'python',
    code: 'arr = [1, 2, 3, 4, 5]; print(", ".join(str(x * 2) for x in arr))',
    expectedOutput: '2, 4, 6, 8, 10\n'
  }
];

// Enhanced security test cases (should be blocked)
const securityTestCases = [
  {
    name: 'JavaScript Forbidden FS',
    language: 'javascript',
    code: 'const fs = require("fs"); console.log("fs loaded");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'Python Forbidden OS',
    language: 'python',
    code: 'import os; print("os imported")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'JavaScript Eval',
    language: 'javascript',
    code: 'eval("console.log(\'eval executed\')");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Exec',
    language: 'python',
    code: 'exec("print(\'exec executed\')")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  },
  {
    name: 'JavaScript Process Exit',
    language: 'javascript',
    code: 'process.exit(0);',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Exit',
    language: 'python',
    code: 'exit()',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  },
  {
    name: 'JavaScript Child Process',
    language: 'javascript',
    code: 'const cp = require("child_process"); console.log("child_process loaded");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'Python Subprocess',
    language: 'python',
    code: 'import subprocess; print("subprocess imported")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'JavaScript Global',
    language: 'javascript',
    code: 'global.console.log("global accessed");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Input',
    language: 'python',
    code: 'input("Enter something: ")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  },
  {
    name: 'JavaScript Buffer',
    language: 'javascript',
    code: 'Buffer.from("test");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Breakpoint',
    language: 'python',
    code: 'breakpoint()',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  }
];

// Performance and stress tests
const performanceTestCases = [
  {
    name: 'Large Output Test',
    language: 'javascript',
    code: 'for(let i = 0; i < 1000; i++) { console.log("Line " + i); }',
    shouldComplete: true
  },
  {
    name: 'Memory Intensive JavaScript',
    language: 'javascript',
    code: 'const arr = new Array(1000000).fill(1); console.log("Array created");',
    shouldComplete: true
  },
  {
    name: 'Memory Intensive Python',
    language: 'python',
    code: 'arr = [1] * 1000000; print("List created")',
    shouldComplete: true
  },
  {
    name: 'Infinite Loop Test',
    language: 'javascript',
    code: 'while(true) { console.log("infinite"); }',
    shouldTimeout: true
  }
];

// Input validation tests
const inputValidationTests = [
  {
    name: 'Empty Code',
    language: 'javascript',
    code: '',
    shouldFail: true,
    expectedError: 'Language and code are required'
  },
  {
    name: 'Invalid Language',
    language: 'java',
    code: 'System.out.println("Hello");',
    shouldFail: true,
    expectedError: 'Unsupported language'
  },
  {
    name: 'Code Too Long',
    language: 'javascript',
    code: 'console.log("x".repeat(15000));',
    shouldFail: true,
    expectedError: 'Code too long'
  },
  {
    name: 'Input Too Long',
    language: 'javascript',
    code: 'console.log("test");',
    input: 'x'.repeat(1500),
    shouldFail: true,
    expectedError: 'Input too long'
  }
];

async function testHealthChecks() {
  console.log('\n🏥 Testing Health Checks...');
  
  try {
    // Test main server health
    const serverHealth = await axios.get(`${BASE_URL}/api/health`);
    console.log('   ✅ Main server health check passed');
    
    // Test executor health
    const executorHealth = await axios.get(`${EXECUTOR_URL}/health`);
    console.log('   ✅ Executor health check passed');
    
    return true;
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
    return false;
  }
}

async function testCodeExecution(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input || ''
    });
    
    if (response.data.success) {
      const result = response.data.result;
      console.log(`   Output: "${result.stdout.trim()}"`);
      console.log(`   Expected: "${testCase.expectedOutput.trim()}"`);
      
      if (result.stdout.trim() === testCase.expectedOutput.trim()) {
        console.log('   ✅ Test passed');
        return true;
      } else {
        console.log('   ❌ Test failed - output mismatch');
        return false;
      }
    } else {
      console.log('   ❌ Test failed - execution failed');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Test failed - error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testSecurityBlocking(testCase) {
  try {
    console.log(`\n🛡️  Testing security: ${testCase.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code
    });
    
    if (response.data.success) {
      console.log('   ❌ Security test failed - dangerous code was executed');
      return false;
    } else {
      const error = response.data.error;
      if (testCase.expectedError && error.includes(testCase.expectedError)) {
        console.log('   ✅ Security test passed - dangerous code was blocked correctly');
        return true;
      } else {
        console.log('   ⚠️  Security test passed - dangerous code was blocked (different error)');
        return true;
      }
    }
    
  } catch (error) {
    if (error.response?.data?.error) {
      const errorMsg = error.response.data.error;
      if (testCase.expectedError && errorMsg.includes(testCase.expectedError)) {
        console.log('   ✅ Security test passed - dangerous code was blocked correctly');
        return true;
      } else if (errorMsg.includes('Forbidden') || errorMsg.includes('Unsupported')) {
        console.log('   ✅ Security test passed - dangerous code was blocked');
        return true;
      } else {
        console.log('   ❌ Security test failed - unexpected error:', errorMsg);
        return false;
      }
    } else {
      console.log('   ❌ Security test failed - unexpected error:', error.message);
      return false;
    }
  }
}

async function testPerformance(testCase) {
  try {
    console.log(`\n⚡ Testing performance: ${testCase.name}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input || ''
    }, {
      timeout: 10000 // 10 second timeout for performance tests
    });
    
    const executionTime = Date.now() - startTime;
    
    if (response.data.success) {
      console.log(`   ✅ Performance test passed (${executionTime}ms)`);
      return true;
    } else {
      console.log('   ❌ Performance test failed - execution failed');
      return false;
    }
    
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (testCase.shouldTimeout) {
        console.log('   ✅ Performance test passed - correctly timed out');
        return true;
      } else {
        console.log('   ❌ Performance test failed - unexpected timeout');
        return false;
      }
    } else {
      console.log('   ❌ Performance test failed - error:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function testInputValidation(testCase) {
  try {
    console.log(`\n🔍 Testing input validation: ${testCase.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input || ''
    });
    
    if (testCase.shouldFail) {
      if (!response.data.success) {
        const error = response.data.error;
        if (testCase.expectedError && error.includes(testCase.expectedError)) {
          console.log('   ✅ Input validation test passed - correctly rejected');
          return true;
        } else {
          console.log('   ⚠️  Input validation test passed - rejected (different error)');
          return true;
        }
      } else {
        console.log('   ❌ Input validation test failed - should have been rejected');
        return false;
      }
    } else {
      if (response.data.success) {
        console.log('   ✅ Input validation test passed - correctly accepted');
        return true;
      } else {
        console.log('   ❌ Input validation test failed - should have been accepted');
        return false;
      }
    }
    
  } catch (error) {
    if (testCase.shouldFail) {
      const errorMsg = error.response?.data?.error || error.message;
      if (testCase.expectedError && errorMsg.includes(testCase.expectedError)) {
        console.log('   ✅ Input validation test passed - correctly rejected');
        return true;
      } else {
        console.log('   ⚠️  Input validation test passed - rejected (different error)');
        return true;
      }
    } else {
      console.log('   ❌ Input validation test failed - error:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive code execution tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Health checks
  const healthPassed = await testHealthChecks();
  if (healthPassed) passedTests++;
  totalTests++;
  
  // Basic functionality tests
  console.log('\n📋 Running basic functionality tests...');
  for (const testCase of basicTestCases) {
    const passed = await testCodeExecution(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Security tests
  console.log('\n🛡️  Running security tests...');
  for (const testCase of securityTestCases) {
    const passed = await testSecurityBlocking(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Performance tests
  console.log('\n⚡ Running performance tests...');
  for (const testCase of performanceTestCases) {
    const passed = await testPerformance(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Input validation tests
  console.log('\n🔍 Running input validation tests...');
  for (const testCase of inputValidationTests) {
    const passed = await testInputValidation(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The secure code execution system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testCodeExecution,
  testSecurityBlocking,
  testPerformance,
  testInputValidation,
  testHealthChecks
}; const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const EXECUTOR_URL = 'http://localhost:5001';

// Test cases for basic functionality
const basicTestCases = [
  {
    name: 'JavaScript Hello World',
    language: 'javascript',
    code: 'console.log("Hello World");',
    expectedOutput: 'Hello World\n'
  },
  {
    name: 'Python Hello World',
    language: 'python',
    code: 'print("Hello World")',
    expectedOutput: 'Hello World\n'
  },
  {
    name: 'JavaScript with Input',
    language: 'javascript',
    code: 'const input = process.argv[2] || "default"; console.log("Input:", input);',
    input: 'test input',
    expectedOutput: 'Input: test input\n'
  },
  {
    name: 'Python with Input',
    language: 'python',
    code: 'import sys; print("Input:", sys.argv[1] if len(sys.argv) > 1 else "default")',
    input: 'test input',
    expectedOutput: 'Input: test input\n'
  },
  {
    name: 'JavaScript Math',
    language: 'javascript',
    code: 'console.log(2 + 2);',
    expectedOutput: '4\n'
  },
  {
    name: 'Python Math',
    language: 'python',
    code: 'print(2 + 2)',
    expectedOutput: '4\n'
  },
  {
    name: 'JavaScript Array Operations',
    language: 'javascript',
    code: 'const arr = [1, 2, 3, 4, 5]; console.log(arr.map(x => x * 2).join(", "));',
    expectedOutput: '2, 4, 6, 8, 10\n'
  },
  {
    name: 'Python List Operations',
    language: 'python',
    code: 'arr = [1, 2, 3, 4, 5]; print(", ".join(str(x * 2) for x in arr))',
    expectedOutput: '2, 4, 6, 8, 10\n'
  }
];

// Enhanced security test cases (should be blocked)
const securityTestCases = [
  {
    name: 'JavaScript Forbidden FS',
    language: 'javascript',
    code: 'const fs = require("fs"); console.log("fs loaded");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'Python Forbidden OS',
    language: 'python',
    code: 'import os; print("os imported")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'JavaScript Eval',
    language: 'javascript',
    code: 'eval("console.log(\'eval executed\')");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Exec',
    language: 'python',
    code: 'exec("print(\'exec executed\')")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  },
  {
    name: 'JavaScript Process Exit',
    language: 'javascript',
    code: 'process.exit(0);',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Exit',
    language: 'python',
    code: 'exit()',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  },
  {
    name: 'JavaScript Child Process',
    language: 'javascript',
    code: 'const cp = require("child_process"); console.log("child_process loaded");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'Python Subprocess',
    language: 'python',
    code: 'import subprocess; print("subprocess imported")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden code pattern detected'
  },
  {
    name: 'JavaScript Global',
    language: 'javascript',
    code: 'global.console.log("global accessed");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Input',
    language: 'python',
    code: 'input("Enter something: ")',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  },
  {
    name: 'JavaScript Buffer',
    language: 'javascript',
    code: 'Buffer.from("test");',
    shouldBeBlocked: true,
    expectedError: 'Forbidden JavaScript operation'
  },
  {
    name: 'Python Breakpoint',
    language: 'python',
    code: 'breakpoint()',
    shouldBeBlocked: true,
    expectedError: 'Forbidden Python operation'
  }
];

// Performance and stress tests
const performanceTestCases = [
  {
    name: 'Large Output Test',
    language: 'javascript',
    code: 'for(let i = 0; i < 1000; i++) { console.log("Line " + i); }',
    shouldComplete: true
  },
  {
    name: 'Memory Intensive JavaScript',
    language: 'javascript',
    code: 'const arr = new Array(1000000).fill(1); console.log("Array created");',
    shouldComplete: true
  },
  {
    name: 'Memory Intensive Python',
    language: 'python',
    code: 'arr = [1] * 1000000; print("List created")',
    shouldComplete: true
  },
  {
    name: 'Infinite Loop Test',
    language: 'javascript',
    code: 'while(true) { console.log("infinite"); }',
    shouldTimeout: true
  }
];

// Input validation tests
const inputValidationTests = [
  {
    name: 'Empty Code',
    language: 'javascript',
    code: '',
    shouldFail: true,
    expectedError: 'Language and code are required'
  },
  {
    name: 'Invalid Language',
    language: 'java',
    code: 'System.out.println("Hello");',
    shouldFail: true,
    expectedError: 'Unsupported language'
  },
  {
    name: 'Code Too Long',
    language: 'javascript',
    code: 'console.log("x".repeat(15000));',
    shouldFail: true,
    expectedError: 'Code too long'
  },
  {
    name: 'Input Too Long',
    language: 'javascript',
    code: 'console.log("test");',
    input: 'x'.repeat(1500),
    shouldFail: true,
    expectedError: 'Input too long'
  }
];

async function testHealthChecks() {
  console.log('\n🏥 Testing Health Checks...');
  
  try {
    // Test main server health
    const serverHealth = await axios.get(`${BASE_URL}/api/health`);
    console.log('   ✅ Main server health check passed');
    
    // Test executor health
    const executorHealth = await axios.get(`${EXECUTOR_URL}/health`);
    console.log('   ✅ Executor health check passed');
    
    return true;
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
    return false;
  }
}

async function testCodeExecution(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input || ''
    });
    
    if (response.data.success) {
      const result = response.data.result;
      console.log(`   Output: "${result.stdout.trim()}"`);
      console.log(`   Expected: "${testCase.expectedOutput.trim()}"`);
      
      if (result.stdout.trim() === testCase.expectedOutput.trim()) {
        console.log('   ✅ Test passed');
        return true;
      } else {
        console.log('   ❌ Test failed - output mismatch');
        return false;
      }
    } else {
      console.log('   ❌ Test failed - execution failed');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Test failed - error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testSecurityBlocking(testCase) {
  try {
    console.log(`\n🛡️  Testing security: ${testCase.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code
    });
    
    if (response.data.success) {
      console.log('   ❌ Security test failed - dangerous code was executed');
      return false;
    } else {
      const error = response.data.error;
      if (testCase.expectedError && error.includes(testCase.expectedError)) {
        console.log('   ✅ Security test passed - dangerous code was blocked correctly');
        return true;
      } else {
        console.log('   ⚠️  Security test passed - dangerous code was blocked (different error)');
        return true;
      }
    }
    
  } catch (error) {
    if (error.response?.data?.error) {
      const errorMsg = error.response.data.error;
      if (testCase.expectedError && errorMsg.includes(testCase.expectedError)) {
        console.log('   ✅ Security test passed - dangerous code was blocked correctly');
        return true;
      } else if (errorMsg.includes('Forbidden') || errorMsg.includes('Unsupported')) {
        console.log('   ✅ Security test passed - dangerous code was blocked');
        return true;
      } else {
        console.log('   ❌ Security test failed - unexpected error:', errorMsg);
        return false;
      }
    } else {
      console.log('   ❌ Security test failed - unexpected error:', error.message);
      return false;
    }
  }
}

async function testPerformance(testCase) {
  try {
    console.log(`\n⚡ Testing performance: ${testCase.name}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input || ''
    }, {
      timeout: 10000 // 10 second timeout for performance tests
    });
    
    const executionTime = Date.now() - startTime;
    
    if (response.data.success) {
      console.log(`   ✅ Performance test passed (${executionTime}ms)`);
      return true;
    } else {
      console.log('   ❌ Performance test failed - execution failed');
      return false;
    }
    
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (testCase.shouldTimeout) {
        console.log('   ✅ Performance test passed - correctly timed out');
        return true;
      } else {
        console.log('   ❌ Performance test failed - unexpected timeout');
        return false;
      }
    } else {
      console.log('   ❌ Performance test failed - error:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function testInputValidation(testCase) {
  try {
    console.log(`\n🔍 Testing input validation: ${testCase.name}`);
    
    const response = await axios.post(`${BASE_URL}/api/rooms/test/execute`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input || ''
    });
    
    if (testCase.shouldFail) {
      if (!response.data.success) {
        const error = response.data.error;
        if (testCase.expectedError && error.includes(testCase.expectedError)) {
          console.log('   ✅ Input validation test passed - correctly rejected');
          return true;
        } else {
          console.log('   ⚠️  Input validation test passed - rejected (different error)');
          return true;
        }
      } else {
        console.log('   ❌ Input validation test failed - should have been rejected');
        return false;
      }
    } else {
      if (response.data.success) {
        console.log('   ✅ Input validation test passed - correctly accepted');
        return true;
      } else {
        console.log('   ❌ Input validation test failed - should have been accepted');
        return false;
      }
    }
    
  } catch (error) {
    if (testCase.shouldFail) {
      const errorMsg = error.response?.data?.error || error.message;
      if (testCase.expectedError && errorMsg.includes(testCase.expectedError)) {
        console.log('   ✅ Input validation test passed - correctly rejected');
        return true;
      } else {
        console.log('   ⚠️  Input validation test passed - rejected (different error)');
        return true;
      }
    } else {
      console.log('   ❌ Input validation test failed - error:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive code execution tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Health checks
  const healthPassed = await testHealthChecks();
  if (healthPassed) passedTests++;
  totalTests++;
  
  // Basic functionality tests
  console.log('\n📋 Running basic functionality tests...');
  for (const testCase of basicTestCases) {
    const passed = await testCodeExecution(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Security tests
  console.log('\n🛡️  Running security tests...');
  for (const testCase of securityTestCases) {
    const passed = await testSecurityBlocking(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Performance tests
  console.log('\n⚡ Running performance tests...');
  for (const testCase of performanceTestCases) {
    const passed = await testPerformance(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Input validation tests
  console.log('\n🔍 Running input validation tests...');
  for (const testCase of inputValidationTests) {
    const passed = await testInputValidation(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The secure code execution system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testCodeExecution,
  testSecurityBlocking,
  testPerformance,
  testInputValidation,
  testHealthChecks
}; //vipul🎉 All tests passed! The secure code execution system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testCodeExecution,
  testSecurityBlocking,
  testPerformance, 
  testInputValidation,
  testHealthChecks
    };                                  
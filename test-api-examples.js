const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/execute';

// Test cases for different languages
const testCases = [
  {
    name: 'JavaScript - Hello World',
    language: 'javascript',
    code: 'console.log("Hello World");',
    input: '',
    expectedOutput: 'Hello World'
  },
  {
    name: 'Python - Simple Print',
    language: 'python',
    code: 'print("Hello from Python!")',
    input: '',
    expectedOutput: 'Hello from Python!'
  },
  {
    name: 'Python - With Input',
    language: 'python',
    code: 'name = input()\nprint(f"Hello, {name}!")',
    input: 'Alice',
    expectedOutput: 'Hello, Alice!'
  },
  {
    name: 'JavaScript - With Input',
    language: 'javascript',
    code: 'const readline = require("readline");\nconst rl = readline.createInterface({\n  input: process.stdin,\n  output: process.stdout\n});\nrl.question("", (answer) => {\n  console.log(`Hello, ${answer}!`);\n  rl.close();\n});',
    input: 'Bob',
    expectedOutput: 'Hello, Bob!'
  },
  {
    name: 'Python - Math Operation',
    language: 'python',
    code: 'a = int(input())\nb = int(input())\nprint(f"Sum: {a + b}")',
    input: '5\n10',
    expectedOutput: 'Sum: 15'
  },
  {
    name: 'JavaScript - Array Operations',
    language: 'javascript',
    code: 'const numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log(`Sum: ${sum}`);',
    input: '',
    expectedOutput: 'Sum: 15'
  }
];

// Error test cases
const errorTestCases = [
  {
    name: 'JavaScript - Syntax Error',
    language: 'javascript',
    code: 'console.log("Hello World"', // Missing closing parenthesis
    input: '',
    expectedError: 'SyntaxError'
  },
  {
    name: 'Python - Runtime Error',
    language: 'python',
    code: 'print(10 / 0)', // Division by zero
    input: '',
    expectedError: 'ZeroDivisionError'
  },
  {
    name: 'Unsupported Language',
    language: 'unsupported',
    code: 'print("test")',
    input: '',
    expectedError: 'Unsupported language'
  }
];

async function testCodeExecution(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Language: ${testCase.language}`);
    console.log(`   Code: ${testCase.code.substring(0, 50)}${testCase.code.length > 50 ? '...' : ''}`);
    
    const response = await axios.post(`${API_BASE_URL}`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input
    });

    if (response.data.success) {
      const result = response.data;
      console.log(`   ✅ Success!`);
      console.log(`   Output: "${result.stdout.trim()}"`);
      console.log(`   Expected: "${testCase.expectedOutput}"`);
      console.log(`   Execution Time: ${result.metrics.executionDuration}ms`);
      
      if (result.stdout.trim() === testCase.expectedOutput) {
        console.log('   ✅ Output matches expected result');
        return true;
      } else {
        console.log('   ❌ Output does not match expected result');
        return false;
      }
    } else {
      console.log('   ❌ Execution failed');
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Request failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function testErrorCases(testCase) {
  try {
    console.log(`\n🧪 Testing Error Case: ${testCase.name}`);
    console.log(`   Language: ${testCase.language}`);
    console.log(`   Code: ${testCase.code.substring(0, 50)}${testCase.code.length > 50 ? '...' : ''}`);
    
    const response = await axios.post(`${API_BASE_URL}`, {
      language: testCase.language,
      code: testCase.code,
      input: testCase.input
    });

    // If we get here, it means no error was thrown
    console.log('   ❌ Expected error but got success');
    return false;
  } catch (error) {
    if (error.response) {
      const result = error.response.data;
      console.log(`   ✅ Error caught as expected`);
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${result.error}`);
      
      if (result.error.includes(testCase.expectedError)) {
        console.log('   ✅ Error type matches expected');
        return true;
      } else {
        console.log('   ❌ Error type does not match expected');
        return false;
      }
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing Health Check...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.data.success) {
      console.log('   ✅ Health check passed');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Services:`, response.data.services);
      return true;
    } else {
      console.log('   ❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Health check request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testSupportedLanguages() {
  try {
    console.log('\n📚 Testing Supported Languages...');
    const response = await axios.get(`${API_BASE_URL}/languages`);
    
    if (response.data.success) {
      console.log('   ✅ Languages endpoint working');
      console.log(`   Supported languages: ${response.data.count}`);
      response.data.languages.forEach(lang => {
        console.log(`     - ${lang.name} (${lang.id}) - ${lang.version}`);
      });
      return true;
    } else {
      console.log('   ❌ Languages endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Languages request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Code Execution API Tests\n');
  console.log('=' .repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Test health check
  const healthOk = await testHealthCheck();
  if (healthOk) passedTests++;
  totalTests++;

  // Test supported languages
  const languagesOk = await testSupportedLanguages();
  if (languagesOk) passedTests++;
  totalTests++;

  // Test successful code execution
  console.log('\n📝 Testing Successful Code Execution Cases');
  console.log('-'.repeat(50));
  
  for (const testCase of testCases) {
    const result = await testCodeExecution(testCase);
    if (result) passedTests++;
    totalTests++;
  }

  // Test error cases
  console.log('\n❌ Testing Error Cases');
  console.log('-'.repeat(50));
  
  for (const testCase of errorTestCases) {
    const result = await testErrorCases(testCase);
    if (result) passedTests++;
    totalTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Example usage functions
async function executeJavaScriptCode() {
  console.log('\n🔧 Example: Executing JavaScript Code');
  
  try {
    const response = await axios.post(`${API_BASE_URL}`, {
      language: 'javascript',
      code: `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        console.log("Fibonacci sequence:");
        for (let i = 0; i < 10; i++) {
          console.log(\`F(\${i}) = \${fibonacci(i)}\`);
        }
      `,
      input: ''
    });

    if (response.data.success) {
      console.log('✅ Code executed successfully!');
      console.log('Output:');
      console.log(response.data.stdout);
      console.log(`Execution time: ${response.data.metrics.executionDuration}ms`);
    }
  } catch (error) {
    console.error('❌ Error executing code:', error.response?.data?.error || error.message);
  }
}

async function executePythonWithInput() {
  console.log('\n🐍 Example: Executing Python Code with Input');
  
  try {
    const response = await axios.post(`${API_BASE_URL}`, {
      language: 'python',
      code: `
        def calculate_factorial(n):
            if n <= 1:
                return 1
            return n * calculate_factorial(n - 1)
        
        number = int(input("Enter a number: "))
        result = calculate_factorial(number)
        print(f"The factorial of {number} is {result}")
      `,
      input: '5'
    });

    if (response.data.success) {
      console.log('✅ Code executed successfully!');
      console.log('Output:');
      console.log(response.data.stdout);
      console.log(`Execution time: ${response.data.metrics.executionDuration}ms`);
    }
  } catch (error) {
    console.error('❌ Error executing code:', error.response?.data?.error || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n✨ Test execution completed');
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  testCodeExecution,
  testErrorCases,
  testHealthCheck,
  testSupportedLanguages,
  executeJavaScriptCode,
  executePythonWithInput,
  runAllTests
};

const { DockerCodeExecutor } = require('./docker-code-executor');

async function runTests() {
  console.log('🧪 Running Docker Code Executor Tests\n');
  
  const executor = new DockerCodeExecutor();
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const health = await executor.healthCheck();
    if (health.status === 'healthy' && health.docker) {
      console.log('✅ Health check passed');
      passedTests++;
    } else {
      console.log('❌ Health check failed:', health);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
  totalTests++;

  // Test 2: Supported Languages
  console.log('\n2. Testing Supported Languages...');
  try {
    const languages = executor.getSupportedLanguages();
    const expectedLanguages = ['python', 'javascript', 'java'];
    const hasAllLanguages = expectedLanguages.every(lang => 
      languages.some(l => l.id === lang)
    );
    
    if (hasAllLanguages) {
      console.log('✅ Supported languages test passed');
      console.log('   Languages:', languages.map(l => `${l.name} (${l.version})`));
      passedTests++;
    } else {
      console.log('❌ Supported languages test failed');
      console.log('   Expected:', expectedLanguages);
      console.log('   Got:', languages.map(l => l.id));
    }
  } catch (error) {
    console.log('❌ Supported languages error:', error.message);
  }
  totalTests++;

  // Test 3: Python Basic Execution
  console.log('\n3. Testing Python Basic Execution...');
  try {
    const result = await executor.executeCode('python', 'print("Hello, World!")');
    if (result.success && result.stdout.includes('Hello, World!')) {
      console.log('✅ Python basic execution passed');
      console.log(`   Output: "${result.stdout.trim()}"`);
      console.log(`   Execution time: ${result.executionTime}ms`);
      passedTests++;
    } else {
      console.log('❌ Python basic execution failed:', result);
    }
  } catch (error) {
    console.log('❌ Python basic execution error:', error.message);
  }
  totalTests++;

  // Test 4: JavaScript Basic Execution
  console.log('\n4. Testing JavaScript Basic Execution...');
  try {
    const result = await executor.executeCode('javascript', 'console.log("Hello, World!");');
    if (result.success && result.stdout.includes('Hello, World!')) {
      console.log('✅ JavaScript basic execution passed');
      console.log(`   Output: "${result.stdout.trim()}"`);
      console.log(`   Execution time: ${result.executionTime}ms`);
      passedTests++;
    } else {
      console.log('❌ JavaScript basic execution failed:', result);
    }
  } catch (error) {
    console.log('❌ JavaScript basic execution error:', error.message);
  }
  totalTests++;

  // Test 5: Java Basic Execution
  console.log('\n5. Testing Java Basic Execution...');
  try {
    const result = await executor.executeCode('java', `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`);
    if (result.success && result.stdout.includes('Hello, World!')) {
      console.log('✅ Java basic execution passed');
      console.log(`   Output: "${result.stdout.trim()}"`);
      console.log(`   Execution time: ${result.executionTime}ms`);
      passedTests++;
    } else {
      console.log('❌ Java basic execution failed:', result);
    }
  } catch (error) {
    console.log('❌ Java basic execution error:', error.message);
  }
  totalTests++;

  // Test 6: Python with Input
  console.log('\n6. Testing Python with Input...');
  try {
    const result = await executor.executeCode('python', `
name = input()
print(f"Hello, {name}!")
`, 'Alice');
    if (result.success && result.stdout.includes('Hello, Alice!')) {
      console.log('✅ Python with input passed');
      console.log(`   Output: "${result.stdout.trim()}"`);
      passedTests++;
    } else {
      console.log('❌ Python with input failed:', result);
    }
  } catch (error) {
    console.log('❌ Python with input error:', error.message);
  }
  totalTests++;

  // Test 7: JavaScript with Input
  console.log('\n7. Testing JavaScript with Input...');
  try {
    const result = await executor.executeCode('javascript', `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', (answer) => {
  console.log("Hello, " + answer + "!");
  rl.close();
});
`, 'Bob');
    if (result.success && result.stdout.includes('Hello, Bob!')) {
      console.log('✅ JavaScript with input passed');
      console.log(`   Output: "${result.stdout.trim()}"`);
      passedTests++;
    } else {
      console.log('❌ JavaScript with input failed:', result);
    }
  } catch (error) {
    console.log('❌ JavaScript with input error:', error.message);
  }
  totalTests++;

  // Test 8: Python Security (should fail)
  console.log('\n8. Testing Python Security (should fail)...');
  try {
    const result = await executor.executeCode('python', 'import os; os.system("ls")');
    if (!result.success && result.error.includes('Forbidden pattern')) {
      console.log('✅ Python security test passed (correctly blocked)');
      console.log(`   Error: ${result.error}`);
      passedTests++;
    } else {
      console.log('❌ Python security test failed (should have been blocked):', result);
    }
  } catch (error) {
    console.log('❌ Python security test error:', error.message);
  }
  totalTests++;

  // Test 9: JavaScript Security (should fail)
  console.log('\n9. Testing JavaScript Security (should fail)...');
  try {
    const result = await executor.executeCode('javascript', 'require("fs").readFileSync("/etc/passwd")');
    if (!result.success && result.error.includes('Forbidden pattern')) {
      console.log('✅ JavaScript security test passed (correctly blocked)');
      console.log(`   Error: ${result.error}`);
      passedTests++;
    } else {
      console.log('❌ JavaScript security test failed (should have been blocked):', result);
    }
  } catch (error) {
    console.log('❌ JavaScript security test error:', error.message);
  }
  totalTests++;

  // Test 10: Java Security (should fail)
  console.log('\n10. Testing Java Security (should fail)...');
  try {
    const result = await executor.executeCode('java', `
import java.io.File;
public class Main {
    public static void main(String[] args) {
        File file = new File("/etc/passwd");
        System.out.println(file.exists());
    }
}`);
    if (!result.success && result.error.includes('Forbidden pattern')) {
      console.log('✅ Java security test passed (correctly blocked)');
      console.log(`   Error: ${result.error}`);
      passedTests++;
    } else {
      console.log('❌ Java security test failed (should have been blocked):', result);
    }
  } catch (error) {
    console.log('❌ Java security test error:', error.message);
  }
  totalTests++;

  // Test 11: Code Length Validation
  console.log('\n11. Testing Code Length Validation...');
  try {
    const longCode = 'print("test")\n'.repeat(10000); // ~60KB
    const result = await executor.executeCode('python', longCode);
    if (!result.success && result.error.includes('too long')) {
      console.log('✅ Code length validation passed (correctly blocked)');
      console.log(`   Error: ${result.error}`);
      passedTests++;
    } else {
      console.log('❌ Code length validation failed (should have been blocked):', result);
    }
  } catch (error) {
    console.log('❌ Code length validation error:', error.message);
  }
  totalTests++;

  // Test 12: Input Length Validation
  console.log('\n12. Testing Input Length Validation...');
  try {
    const longInput = 'x'.repeat(2000); // 2KB
    const result = await executor.executeCode('python', 'name = input(); print(name)', longInput);
    if (!result.success && result.error.includes('too long')) {
      console.log('✅ Input length validation passed (correctly blocked)');
      console.log(`   Error: ${result.error}`);
      passedTests++;
    } else {
      console.log('❌ Input length validation failed (should have been blocked):', result);
    }
  } catch (error) {
    console.log('❌ Input length validation error:', error.message);
  }
  totalTests++;

  // Test 13: Python Math Operations
  console.log('\n13. Testing Python Math Operations...');
  try {
    const result = await executor.executeCode('python', `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci sequence:")
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
`);
    if (result.success && result.stdout.includes('Fibonacci sequence:')) {
      console.log('✅ Python math operations passed');
      console.log(`   Output: ${result.stdout.split('\n').slice(0, 3).join(' | ')}`);
      passedTests++;
    } else {
      console.log('❌ Python math operations failed:', result);
    }
  } catch (error) {
    console.log('❌ Python math operations error:', error.message);
  }
  totalTests++;

  // Test 14: JavaScript Array Operations
  console.log('\n14. Testing JavaScript Array Operations...');
  try {
    const result = await executor.executeCode('javascript', `
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
const doubled = numbers.map(n => n * 2);
console.log("Original:", numbers);
console.log("Sum:", sum);
console.log("Doubled:", doubled);
`);
    if (result.success && result.stdout.includes('Sum: 15')) {
      console.log('✅ JavaScript array operations passed');
      console.log(`   Output: ${result.stdout.split('\n').slice(0, 2).join(' | ')}`);
      passedTests++;
    } else {
      console.log('❌ JavaScript array operations failed:', result);
    }
  } catch (error) {
    console.log('❌ JavaScript array operations error:', error.message);
  }
  totalTests++;

  // Test 15: Java Object Operations
  console.log('\n15. Testing Java Object Operations...');
  try {
    const result = await executor.executeCode('java', `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
        int sum = numbers.stream().mapToInt(Integer::intValue).sum();
        List<Integer> doubled = numbers.stream()
            .map(n -> n * 2)
            .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
        
        System.out.println("Original: " + numbers);
        System.out.println("Sum: " + sum);
        System.out.println("Doubled: " + doubled);
    }
}`);
    if (result.success && result.stdout.includes('Sum: 15')) {
      console.log('✅ Java object operations passed');
      console.log(`   Output: ${result.stdout.split('\n').slice(0, 2).join(' | ')}`);
      passedTests++;
    } else {
      console.log('❌ Java object operations failed:', result);
    }
  } catch (error) {
    console.log('❌ Java object operations error:', error.message);
  }
  totalTests++;

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
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then((success) => {
      if (success) {
        console.log('\n✨ Test execution completed successfully');
        process.exit(0);
      } else {
        console.log('\n💥 Test execution completed with failures');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runTests };

const { DockerCodeExecutor } = require('./docker-code-executor');

async function main() {
  console.log('🐳 Docker Code Executor - Simple Examples\n');

  // Create executor instance
  const executor = new DockerCodeExecutor();

  // Check health
  console.log('1. Checking Docker health...');
  const health = await executor.healthCheck();
  console.log('Health:', health);
  console.log('');

  // Get supported languages
  console.log('2. Supported languages:');
  const languages = executor.getSupportedLanguages();
  languages.forEach(lang => {
    console.log(`   - ${lang.name} (${lang.version})`);
  });
  console.log('');

  // Example 1: Simple Python
  console.log('3. Running Python code...');
  const pythonResult = await executor.executeCode('python', `
print("Hello from Python!")
print(f"2 + 2 = {2 + 2}")

# Simple function
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
  `);
  
  console.log('Python Result:');
  console.log('Success:', pythonResult.success);
  console.log('Output:', pythonResult.stdout.trim());
  console.log('Execution time:', pythonResult.executionTime + 'ms');
  console.log('');

  // Example 2: JavaScript with arrays
  console.log('4. Running JavaScript code...');
  const jsResult = await executor.executeCode('javascript', `
console.log("Hello from JavaScript!");

// Array operations
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
const doubled = numbers.map(n => n * 2);

console.log("Numbers:", numbers);
console.log("Sum:", sum);
console.log("Doubled:", doubled);
  `);
  
  console.log('JavaScript Result:');
  console.log('Success:', jsResult.success);
  console.log('Output:', jsResult.stdout.trim());
  console.log('Execution time:', jsResult.executionTime + 'ms');
  console.log('');

  // Example 3: Java with objects
  console.log('5. Running Java code...');
  const javaResult = await executor.executeCode('java', `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        
        // List operations
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
        int sum = numbers.stream().mapToInt(Integer::intValue).sum();
        
        System.out.println("Numbers: " + numbers);
        System.out.println("Sum: " + sum);
        
        // Simple calculation
        int result = 2 + 2;
        System.out.println("2 + 2 = " + result);
    }
}
  `);
  
  console.log('Java Result:');
  console.log('Success:', javaResult.success);
  console.log('Output:', javaResult.stdout.trim());
  console.log('Execution time:', javaResult.executionTime + 'ms');
  console.log('');

  // Example 4: Python with input
  console.log('6. Running Python with input...');
  const pythonInputResult = await executor.executeCode('python', `
name = input()
age = int(input())
print(f"Hello, {name}! You are {age} years old.")
print(f"In 10 years, you will be {age + 10} years old.")
  `, 'Alice\n25');
  
  console.log('Python with Input Result:');
  console.log('Success:', pythonInputResult.success);
  console.log('Output:', pythonInputResult.stdout.trim());
  console.log('');

  // Example 5: Security test (should fail)
  console.log('7. Testing security (should fail)...');
  const securityResult = await executor.executeCode('python', 'import os; os.system("ls")');
  
  console.log('Security Test Result:');
  console.log('Success:', securityResult.success);
  console.log('Error:', securityResult.error);
  console.log('');

  console.log('✅ All examples completed!');
}

// Run examples
main().catch(error => {
  console.error('❌ Error running examples:', error);
  process.exit(1);
});

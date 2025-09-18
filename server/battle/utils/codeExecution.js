const { VM } = require('vm2');

class CodeExecutionService {
  constructor() {
    this.defaultTimeout = 5000; // 5 seconds
    this.memoryLimit = 128 * 1024 * 1024; // 128MB
  }

  async executeJavaScript(code, testCases, timeLimit = this.defaultTimeout) {
    const results = [];
    let totalExecutionTime = 0;

    try {
      // Validate code first
      this.validateCode(code);

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = await this.runSingleTest(code, testCase, timeLimit);
        results.push(result);
        totalExecutionTime += result.executionTime;

        // If test fails and it's not a hidden test case, continue to next test
        if (!result.success && !testCase.hidden) {
          break;
        }
      }

      const testsPassed = results.filter(r => r.success).length;
      
      return {
        success: testsPassed > 0,
        results,
        testsPassed,
        totalTests: testCases.length,
        totalExecutionTime,
        output: results.map(r => r.output).join('\n'),
        error: results.find(r => r.error)?.error
      };

    } catch (error) {
      return {
        success: false,
        results: [],
        testsPassed: 0,
        totalTests: testCases.length,
        totalExecutionTime: 0,
        output: '',
        error: error.message
      };
    }
  }

  async runSingleTest(code, testCase, timeLimit) {
    const startTime = Date.now();
    
    try {
      const vm = new VM({
        timeout: timeLimit,
        sandbox: {
          console: {
            log: () => {}, // Capture console.log if needed
          }
        }
      });

      // Prepare test execution
      const fullCode = `
        ${code}
        
        // Execute the function with test input
        const result = solution(${testCase.input});
        result;
      `;

      const output = vm.run(fullCode);
      const executionTime = Date.now() - startTime;
      
      // Compare result with expected output
      const success = this.compareOutputs(output, testCase.expected);
      
      return {
        success,
        output: String(output),
        executionTime,
        input: testCase.input,
        expected: testCase.expected
      };

    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        input: testCase.input,
        expected: testCase.expected
      };
    }
  }

  validateCode(code) {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /global\./,
      /setInterval|setTimeout/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error('Code contains forbidden patterns');
      }
    }

    if (code.length > 5000) {
      throw new Error('Code too long (max 5000 characters)');
    }
  }

  compareOutputs(actual, expected) {
    // Handle different types of comparisons
    if (typeof expected === 'number') {
      return Math.abs(actual - expected) < 1e-9;
    }
    
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}

module.exports = new CodeExecutionService();



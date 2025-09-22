// Local JavaScript Code Executor for Quiz
// This provides a safe way to execute JavaScript code locally without API calls

import { API_BASE } from './api';

interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  error?: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualOutput: string;
}

export class LocalCodeExecutor {
  private static instance: LocalCodeExecutor;
  private executionTimeout = 5000; // 5 seconds timeout

  static getInstance(): LocalCodeExecutor {
    if (!LocalCodeExecutor.instance) {
      LocalCodeExecutor.instance = new LocalCodeExecutor();
    }
    return LocalCodeExecutor.instance;
  }

  // Extract function name from JavaScript code
  private getFunctionName(code: string): string {
    // Look for function declarations
    const functionMatch = code.match(/function\s+(\w+)\s*\(/);
    if (functionMatch) {
      return functionMatch[1];
    }

    // Look for arrow function assignments
    const arrowMatch = code.match(/(\w+)\s*=\s*\(/);
    if (arrowMatch) {
      return arrowMatch[1];
    }

    // Look for const/let/var function assignments
    const constMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(|=>)/);
    if (constMatch) {
      return constMatch[1];
    }

    // Default fallback
    return 'main';
  }

  // Extract function name from Python code
  private getPythonFunctionName(code: string): string {
    const defMatch = code.match(/def\s+(\w+)\s*\(/);
    if (defMatch) {
      return defMatch[1];
    }
    return 'main';
  }

  // Safe code execution with timeout
  private async executeWithTimeout(code: string, timeout: number = this.executionTimeout): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let hasError = false;

      // Create a timeout
      const timeoutId = setTimeout(() => {
        resolve({
          stdout: '',
          stderr: 'Execution timeout: Code took too long to execute',
          executionTime: Date.now() - startTime,
          error: 'timeout'
        });
      }, timeout);

      try {
        // Capture console.log output
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = (...args) => {
          stdout += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') + '\n';
        };

        console.error = (...args) => {
          stderr += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') + '\n';
        };

        // Execute the code
        const result = eval(code);
        
        // If the result is not undefined, add it to stdout
        if (result !== undefined) {
          stdout += typeof result === 'object' ? JSON.stringify(result) : String(result);
        }

        // Restore original console methods
        console.log = originalLog;
        console.error = originalError;

        clearTimeout(timeoutId);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          executionTime: Date.now() - startTime
        });

      } catch (error) {
        // Restore original console methods
        console.log = console.log;
        console.error = console.error;

        clearTimeout(timeoutId);
        hasError = true;
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim() + (stderr ? '\n' : '') + `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  // Execute JavaScript code and run test cases (local eval)
  async executeCode(code: string, testCases?: TestCase[]): Promise<{
    result: ExecutionResult;
    testResults: TestResult[];
  }> {
    const startTime = Date.now();
    
    // First, execute the code to define functions
    const result = await this.executeWithTimeout(code);
    
    let testResults: TestResult[] = [];
    
    // Run test cases if provided
    if (testCases && testCases.length > 0) {
      const functionName = this.getFunctionName(code);
      
      for (const testCase of testCases) {
        try {
          // Create test code that calls the user's function
          const testCode = `
            ${code}
            
            // Test the function
            try {
              const result = ${functionName}(${testCase.input});
              console.log(JSON.stringify(result));
            } catch (error) {
              console.error("Error:", error.message);
            }
          `;

          const testResult = await this.executeWithTimeout(testCode);
          const actualOutput = testResult.stdout?.trim() || testResult.stderr?.trim() || '';
          
          // Normalize both outputs for comparison
          const normalizeOutput = (output: string) => {
            return output
              .replace(/,\s+/g, ',')  // Remove spaces after commas
              .replace(/\s+/g, ' ')   // Normalize multiple spaces to single space
              .replace(/'/g, '"')     // Convert single quotes to double quotes
              .trim();
          };
          
          const normalizedActual = normalizeOutput(actualOutput);
          const normalizedExpected = normalizeOutput(testCase.expectedOutput);
          
          // Also try parsing as JSON arrays for more flexible comparison
          let passed = normalizedActual === normalizedExpected;
          
          if (!passed) {
            try {
              // Try to parse both as JSON arrays
              const actualArray = JSON.parse(actualOutput);
              const expectedArray = JSON.parse(testCase.expectedOutput.replace(/'/g, '"'));
              passed = JSON.stringify(actualArray) === JSON.stringify(expectedArray);
            } catch (e) {
              // If JSON parsing fails, stick with string comparison
            }
          }
          
          testResults.push({
            testCase,
            passed,
            actualOutput
          });
        } catch (error) {
          testResults.push({
            testCase,
            passed: false,
            actualOutput: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    }

    return {
      result: {
        ...result,
        executionTime: Date.now() - startTime
      },
      testResults
    };
  }

  // Simple code execution without test cases
  async execute(code: string): Promise<ExecutionResult> {
    return this.executeWithTimeout(code);
  }

  // Generic executor that supports multiple languages
  async executeCodeGeneric(language: string, code: string, testCases?: TestCase[]): Promise<{
    result: ExecutionResult;
    testResults: TestResult[];
  }> {
    if (!language || language.toLowerCase() === 'javascript') {
      return this.executeCode(code, testCases);
    }

    if (language.toLowerCase() === 'python') {
      const functionName = this.getPythonFunctionName(code);
      const testResults: TestResult[] = [];

      if (!testCases || testCases.length === 0) {
        // Just run the code once
        const pyRes = await this.executeRemote('python', code);
        return {
          result: {
            stdout: pyRes.stdout,
            stderr: pyRes.stderr,
            executionTime: pyRes.executionTime,
            error: pyRes.error
          },
          testResults: []
        };
      }

      for (const testCase of testCases) {
        // Build a small Python harness per test case
        const harness = `\n\nimport json\ntry:\n    _input = ${testCase.input}\n    _result = ${functionName}(_input)\n    try:\n        print(json.dumps(_result))\n    except Exception:\n        print(str(_result))\nexcept Exception as e:\n    print('Error: ' + str(e))\n`;

        const fullCode = `${code}\n${harness}`;
        const pyRes = await this.executeRemote('python', fullCode);
        const actualOutput = (pyRes.stdout || pyRes.stderr || '').trim();

        const normalizeOutput = (output: string) => {
          return output
            .replace(/,\s+/g, ',')
            .replace(/\s+/g, ' ')
            .replace(/'/g, '"')
            .trim();
        };

        const normalizedActual = normalizeOutput(actualOutput);
        const normalizedExpected = normalizeOutput(testCase.expectedOutput);

        let passed = normalizedActual === normalizedExpected;
        if (!passed) {
          try {
            const actualJson = JSON.parse(normalizedActual);
            const expectedJson = JSON.parse(normalizedExpected);
            passed = JSON.stringify(actualJson) === JSON.stringify(expectedJson);
          } catch (_) {
            // keep string compare result
          }
        }

        testResults.push({ testCase, passed, actualOutput });
      }

      return {
        result: { stdout: '', stderr: '', executionTime: 0 },
        testResults
      };
    }

    // Default: try remote execute for other languages
    const remote = await this.executeRemote(language, code);
    return {
      result: {
        stdout: remote.stdout,
        stderr: remote.stderr,
        executionTime: remote.executionTime,
        error: remote.error
      },
      testResults: []
    };
  }

  private async executeRemote(language: string, code: string): Promise<ExecutionResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        const stderr = json?.data?.stderr || json?.error || 'Execution failed';
        return { stdout: '', stderr: typeof stderr === 'string' ? stderr : JSON.stringify(stderr), executionTime: Date.now() - start, error: 'remote_error' };
      }
      return {
        stdout: json?.data?.stdout || '',
        stderr: json?.data?.stderr || '',
        executionTime: json?.execution?.duration_ms || (Date.now() - start)
      };
    } catch (e) {
      return { stdout: '', stderr: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`, executionTime: Date.now() - start, error: 'network_error' };
    }
  }
}

// Export singleton instance
export const localCodeExecutor = LocalCodeExecutor.getInstance();

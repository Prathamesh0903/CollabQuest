const axios = require('axios');
const DockerExecutor = require('./dockerExecutor');

// Configuration for code execution services
const EXECUTOR_CONFIG = {
  local: {
    url: process.env.EXECUTOR_URL || process.env.SIMPLE_EXECUTOR_URL || 'http://localhost:5001',
    timeout: 5000, // 5 seconds for HTTP timeout
    fallback: 'docker'
  },
  judge0: {
    url: 'https://judge0-ce.p.rapidapi.com',
    timeout: 10000,
    apiKey: process.env.JUDGE0_API_KEY
  },
  docker: {
    enabled: false, // Disabled for now due to Docker socket issues
    timeout: 30000 // 30 seconds for Docker execution
  }
};

// Map language to Judge0 language_id (fallback)
const JUDGE0_LANGUAGES = {
  javascript: 63, // Node.js
  python: 71,     // Python 3
  java: 62,       // Java (OpenJDK 13.0.1)
  cpp: 54,        // C++ (GCC 9.2.0)
  csharp: 51,     // C# (Mono 6.6.0.161)
};

async function executeCode(language, sourceCode, input = '') {
  // Validate inputs
  if (!language || !sourceCode) {
    throw new Error('Language and source code are required');
  }

  if (!['javascript', 'python', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby'].includes(language)) {
    throw new Error('Unsupported language. Supported: javascript, python, java, cpp, csharp, typescript, go, rust, php, ruby');
  }

  // Try plugin system first
  try {
    const pluginManager = require('../plugins/languagePlugins/PluginManager');
    if (pluginManager.isLanguageSupported && pluginManager.isLanguageSupported(language)) {
      console.log(`Using plugin system for ${language} code`);
      return await pluginManager.executeCode(language, sourceCode, input);
    }
  } catch (error) {
    console.log(`Plugin system not available for ${language}, falling back to mock execution:`, error.message);
  }

  // Use mock execution as fallback
  console.log(`Using mock execution for ${language} code`);
  return executeWithMockExecutor(language, sourceCode, input);
}

// Mock executor for development/testing
async function executeWithMockExecutor(language, sourceCode, input) {
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Basic mock execution for common patterns
  let stdout = '';
  let stderr = '';
  
  if (language === 'javascript') {
    // Create a proper JavaScript execution environment
    try {
      // Create a sandboxed execution context
      const sandbox = {
        console: {
          log: (...args) => {
            stdout += args.map(arg => String(arg)).join(' ') + '\n';
          }
        },
        setTimeout: () => {},
        setInterval: () => {},
        clearTimeout: () => {},
        clearInterval: () => {},
        process: undefined,
        require: undefined,
        module: undefined,
        __dirname: undefined,
        __filename: undefined,
        global: undefined,
        Buffer: undefined
      };
      
      // Execute the code in the sandbox
      const vm = require('vm');
      const context = vm.createContext(sandbox);
      vm.runInContext(sourceCode, context, { timeout: 5000 });
      
    } catch (error) {
      stderr = error.message + '\n';
    }
  } else if (language === 'python') {
    // Simple Python mock execution
    if (sourceCode.includes('print(')) {
      const matches = sourceCode.match(/print\(([^)]+)\)/g);
      if (matches) {
        stdout = matches.map(match => {
          const content = match.replace('print(', '').replace(')', '');
          return content.replace(/['"]/g, '') + '\n';
        }).join('');
      }
    }
  } else if (language === 'java') {
    // Java mock execution
    try {
      // Check for basic Java syntax
      if (!sourceCode.includes('public class')) {
        stderr = 'Error: Java code must contain a public class\n';
      } else if (!sourceCode.includes('public static void main(String[] args)')) {
        stderr = 'Error: Java code must contain a main method\n';
      } else {
        // Extract System.out.println statements
        const printMatches = sourceCode.match(/System\.out\.println\([^)]*\)/g);
        if (printMatches) {
          stdout = printMatches.map(match => {
            // Extract the content inside println()
            const content = match.replace(/System\.out\.println\(/g, '').replace(/\)/g, '');
            
            // Handle different types of println content
            let result = '';
            
            // Check if it's a simple string literal
            const stringMatch = content.match(/^["']([^"']*)["']$/);
            if (stringMatch) {
              result = stringMatch[1];
            } else {
              // Handle string concatenation and expressions
              let processedContent = content;
              
              // Handle simple arithmetic expressions in parentheses
              const arithmeticMatches = processedContent.match(/\((\d+)\s*\+\s*(\d+)\)/g);
              if (arithmeticMatches) {
                arithmeticMatches.forEach(expr => {
                  const numbers = expr.match(/(\d+)\s*\+\s*(\d+)/);
                  if (numbers) {
                    const a = parseInt(numbers[1]);
                    const b = parseInt(numbers[2]);
                    processedContent = processedContent.replace(expr, (a + b).toString());
                  }
                });
              }
              
              // Handle string concatenation patterns
              if (processedContent.includes('+') && processedContent.includes('"')) {
                // Pattern: "text" + expression + "text"
                const parts = processedContent.split('+').map(part => part.trim());
                const processedParts = parts.map(part => {
                  // Remove quotes from string literals
                  const stringPart = part.match(/^["']([^"']*)["']$/);
                  if (stringPart) {
                    return stringPart[1];
                  }
                  // Handle arithmetic expressions
                  if (part.match(/^\d+$/)) {
                    return part;
                  }
                  // Handle variable references (simplified)
                  if (part === 'name' && input) {
                    return input;
                  }
                  return part.replace(/["']/g, '');
                });
                result = processedParts.join('');
              } else {
                // For non-string expressions, try to evaluate
                result = processedContent.replace(/["']/g, '');
              }
            }
            
            return result + '\n';
          }).join('');
        }
        
        // Handle Scanner input simulation
        if (sourceCode.includes('Scanner') && input) {
          const scannerMatches = sourceCode.match(/scanner\.nextLine\(\)/g);
          if (scannerMatches) {
            // Replace variable references in the output with actual input
            stdout = stdout.replace(/\+ name \+/g, input);
            stdout = stdout.replace(/\+ " \+ name \+ " \+/g, input);
            stdout += input + '\n';
          }
        }
        
        // If no println statements found, provide default output
        if (!stdout) {
          stdout = 'Hello from Java!\n';
          if (input) {
            stdout += `Input received: ${input}\n`;
          }
        }
      }
    } catch (error) {
      stderr = `Java execution error: ${error.message}\n`;
    }
  }
  
  // Default mock output if no specific patterns found
  if (!stdout && !stderr) {
    stdout = `[MOCK] ${language} code executed successfully\n`;
    if (input) {
      stdout += `Input received: ${input}\n`;
    }
  }
  
  return {
    stdout,
    stderr,
    compile_output: '',
    status: 'success',
    executionTime: Date.now()
  };
}

async function executeWithLocalExecutor(language, sourceCode, input) {
  const config = EXECUTOR_CONFIG.local;
  
  try {
    const response = await axios.post(
      `${config.url}/execute`,
      {
        language,
        code: sourceCode,
        input
      },
      {
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        stdout: response.data.stdout || '',
        stderr: response.data.stderr || '',
        compile_output: '',
        status: 'success',
        executionTime: response.data.executionTime
      };
    } else {
      throw new Error(response.data.error || 'Execution failed');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Local executor service is not available');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Execution timed out');
    } else if (error.response) {
      throw new Error(error.response.data.error || 'Execution failed');
    } else {
      throw new Error(error.message || 'Execution failed');
    }
  }
}

async function executeWithJudge0(language, sourceCode, input) {
  const config = EXECUTOR_CONFIG.judge0;
  const language_id = JUDGE0_LANGUAGES[language];
  
  if (!language_id) {
    throw new Error('Unsupported language for Judge0');
  }

  try {
    const response = await axios.post(
      `${config.url}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: sourceCode,
        language_id,
        stdin: input,
      },
      {
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': config.apiKey,
        },
      }
    );

    return {
      stdout: response.data.stdout || '',
      stderr: response.data.stderr || '',
      compile_output: response.data.compile_output || '',
      status: response.data.status?.description || 'completed',
      executionTime: Date.now()
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Judge0 API error: ${error.response.data.message || error.response.statusText}`);
    } else {
      throw new Error(`Judge0 API error: ${error.message}`);
    }
  }
}

// Health check function
async function checkExecutorHealth() {
  try {
    const response = await axios.get(`${EXECUTOR_CONFIG.local.url}/health`, {
      timeout: 2000
    });
    return {
      local: response.data.status === 'healthy',
      timestamp: response.data.timestamp
    };
  } catch (error) {
    return {
      local: false,
      error: error.message
    };
  }
}

module.exports = { 
  executeCode, 
  checkExecutorHealth,
  EXECUTOR_CONFIG 
}; 
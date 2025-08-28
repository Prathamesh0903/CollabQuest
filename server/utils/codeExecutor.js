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
    // Enhanced Python mock execution: handle simple assignments and arithmetic in print
    try {
      const variables = Object.create(null);

      // Parse simple integer/float assignments (e.g., a = 5, b=7)
      const assignmentRegex = /^\s*([a-zA-Z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)\s*$/gm;
      let assignMatch;
      while ((assignMatch = assignmentRegex.exec(sourceCode)) !== null) {
        const name = assignMatch[1];
        const value = assignMatch[2];
        variables[name] = Number(value);
      }

      const printRegex = /print\(([^)]+)\)/g;
      let printMatch;
      while ((printMatch = printRegex.exec(sourceCode)) !== null) {
        let expr = printMatch[1].trim();

        // Replace variables with values
        expr = expr.replace(/[a-zA-Z_]\w*/g, (id) => {
          return Object.prototype.hasOwnProperty.call(variables, id) ? String(variables[id]) : id;
        });

        // Strip quotes for string literals to mimic print behavior in this mock
        const isStringLiteral = /^(?:['"]).*['"]$/.test(expr);
        if (isStringLiteral) {
          stdout += expr.replace(/^['"]/,'').replace(/['"]$/,'') + '\n';
          continue;
        }

        // Allow only safe characters for arithmetic evaluation
        if (/^[0-9+\-*/().\s]+$/.test(expr)) {
          try {
            // eslint-disable-next-line no-eval
            const value = eval(expr);
            stdout += String(value) + '\n';
          } catch (_) {
            stdout += expr + '\n';
          }
        } else {
          stdout += expr.replace(/['"]/g, '') + '\n';
        }
      }
    } catch (error) {
      stderr = 'Python mock error: ' + error.message + '\n';
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
        // Capture simple variable declarations and assignments (int a = 5, b = 7;)
        const variables = Object.create(null);
        const declRegex = /int\s+([^;]+);/g;
        let declMatch;
        while ((declMatch = declRegex.exec(sourceCode)) !== null) {
          const segment = declMatch[1];
          const parts = segment.split(',');
          for (const part of parts) {
            const m = part.match(/([a-zA-Z_]\w*)\s*=\s*(-?\d+)/);
            if (m) {
              variables[m[1]] = Number(m[2]);
            }
          }
        }

        // Extract System.out.println statements and evaluate
        const printMatches = sourceCode.match(/System\.out\.println\(([^)]*)\)/g);
        if (printMatches) {
          stdout = printMatches.map(match => {
            let content = match.replace(/System\.out\.println\(/, '').replace(/\)$/, '').trim();

            // String literal
            const stringMatch = content.match(/^["']([^"']*)["']$/);
            if (stringMatch) {
              return stringMatch[1] + '\n';
            }

            // Replace variable identifiers with values
            content = content.replace(/[a-zA-Z_]\w*/g, (id) => {
              return Object.prototype.hasOwnProperty.call(variables, id) ? String(variables[id]) : id;
            });

            // Allow only arithmetic characters for evaluation
            if (/^[0-9+\-*/().\s]+$/.test(content)) {
              try {
                // eslint-disable-next-line no-eval
                const value = eval(content);
                return String(value) + '\n';
              } catch (_) {
                return content.replace(/["']/g, '') + '\n';
              }
            }

            // Fallback: strip quotes and output
            return content.replace(/["']/g, '') + '\n';
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
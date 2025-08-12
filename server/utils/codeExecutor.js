const axios = require('axios');
const DockerExecutor = require('./dockerExecutor');

// Configuration for code execution services
const EXECUTOR_CONFIG = {
  local: {
    url: process.env.EXECUTOR_URL || 'http://localhost:5001',
    timeout: 5000, // 5 seconds for HTTP timeout
    fallback: 'docker'
  },
  judge0: {
    url: 'https://judge0-ce.p.rapidapi.com',
    timeout: 10000,
    apiKey: process.env.JUDGE0_API_KEY
  },
  docker: {
    enabled: process.env.DOCKER_ENABLED !== 'false',
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

  // Try local executor first
  try {
    console.log(`Executing ${language} code using local executor`);
    const result = await executeWithLocalExecutor(language, sourceCode, input);
    return result;
  } catch (error) {
    console.error('Local executor failed:', error.message);
    
    // Try Docker executor if enabled
    if (EXECUTOR_CONFIG.docker.enabled) {
      try {
        console.log(`Trying Docker executor for ${language} code`);
        const dockerExecutor = new DockerExecutor();
        const result = await dockerExecutor.executeCode(language, sourceCode, input);
        return result;
      } catch (dockerError) {
        console.error('Docker executor failed:', dockerError.message);
      }
    }
    
    // Fallback to Judge0 if configured
    if (EXECUTOR_CONFIG.judge0.apiKey) {
      try {
        console.log(`Falling back to Judge0 for ${language} code`);
        const result = await executeWithJudge0(language, sourceCode, input);
        return result;
      } catch (judge0Error) {
        console.error('Judge0 fallback failed:', judge0Error.message);
        throw new Error(`Code execution failed: ${error.message}`);
      }
    } else {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
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
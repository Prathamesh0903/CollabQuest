const express = require('express');
const router = express.Router();
const { executeCode } = require('../utils/codeExecutor');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = req.params.sessionId || 'temp';
    const uploadDir = path.join(__dirname, '../uploads', sessionId);
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Max 20 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common programming file extensions
    const allowedExtensions = [
      '.py', '.js', '.ts', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb',
      '.html', '.css', '.json', '.xml', '.txt', '.md', '.sql', '.sh', '.bat',
      '.csv', '.dat', '.log', '.cfg', '.ini', '.yml', '.yaml'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || !ext) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}`));
    }
  }
});

/**
 * @route POST /api/execute
 * @desc Execute code with language and optional input
 * @access Public (or Private with auth middleware)
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '', timeout, memoryLimit } = req.body;

  try {
    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Validate language
    const supportedLanguages = [
      'javascript', 'python', 'java', 'cpp', 'csharp', 
      'typescript', 'go', 'rust', 'php', 'ruby'
    ];
    
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
        code: 'UNSUPPORTED_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    // Validate code length
    if (code.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Code too long (max 50KB)',
        code: 'CODE_TOO_LONG',
        timestamp: new Date().toISOString()
      });
    }

    // Validate input length
    if (input.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Input too long (max 1KB)',
        code: 'INPUT_TOO_LONG',
        timestamp: new Date().toISOString()
      });
    }

    // Execute the code with enhanced error handling
    const result = await executeCodeWithEnhancedHandling(language, code, input, timeout, memoryLimit);
    const executionTime = Date.now() - startTime;

    // Prepare comprehensive response
    const response = {
      success: true,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        runtime_logs: result.runtime_logs || [],
        exit_code: result.exit_code || 0
      },
      status: result.status || 'success',
      execution: {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: executionTime,
        language: language,
        timeout_occurred: result.timeout_occurred || false,
        memory_exceeded: result.memory_exceeded || false,
        crashed: result.crashed || false
      },
      metrics: {
        code_length: code.length,
        input_length: input.length,
        memory_used: result.memory_used || 'N/A',
        cpu_usage: result.cpu_usage || 'N/A',
        container_id: result.container_id || null
      },
      timestamp: new Date().toISOString()
    };

    // Log successful execution
    console.log(`Code execution completed: ${language}, ${executionTime}ms, ${code.length} chars`);

    res.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Code execution error:', error);
    
    // Enhanced error response
    const errorResponse = {
      success: false,
      error: {
        message: error.message || 'An error occurred while executing the code',
        type: error.name || 'ExecutionError',
        code: error.code || 'EXECUTION_FAILED',
        details: error.details || null
      },
      data: {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        compile_output: error.compile_output || '',
        runtime_logs: error.runtime_logs || [],
        exit_code: error.exit_code || -1
      },
      execution: {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: executionTime,
        language: language,
        timeout_occurred: error.timeout_occurred || false,
        memory_exceeded: error.memory_exceeded || false,
        crashed: error.crashed || false
      },
      metrics: {
        code_length: code?.length || 0,
        input_length: input?.length || 0,
        memory_used: error.memory_used || 'N/A',
        cpu_usage: error.cpu_usage || 'N/A',
        container_id: error.container_id || null
      },
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * @route POST /api/execute/secure
 * @desc Execute code with authentication required
 * @access Private
 */
router.post('/secure', auth, async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '', timeout, memoryLimit } = req.body;

  try {
    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Language and code are required',
          type: 'ValidationError',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate language
    const supportedLanguages = [
      'javascript', 'python', 'java', 'cpp', 'csharp', 
      'typescript', 'go', 'rust', 'php', 'ruby'
    ];
    
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
          type: 'ValidationError',
          code: 'UNSUPPORTED_LANGUAGE'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Execute the code with enhanced error handling
    const result = await executeCodeWithEnhancedHandling(language, code, input, timeout, memoryLimit);
    const executionTime = Date.now() - startTime;

    // Add user info to response
    const response = {
      success: true,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        runtime_logs: result.runtime_logs || [],
        exit_code: result.exit_code || 0
      },
      status: result.status || 'success',
      execution: {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: executionTime,
        language: language,
        timeout_occurred: result.timeout_occurred || false,
        memory_exceeded: result.memory_exceeded || false,
        crashed: result.crashed || false
      },
      user: {
        id: req.user._id,
        display_name: req.user.displayName,
        email: req.user.email
      },
      metrics: {
        code_length: code.length,
        input_length: input.length,
        memory_used: result.memory_used || 'N/A',
        cpu_usage: result.cpu_usage || 'N/A',
        container_id: result.container_id || null
      },
      timestamp: new Date().toISOString()
    };

    console.log(`Secure code execution by ${req.user.displayName}: ${language}, ${executionTime}ms`);

    res.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Secure code execution error:', error);
    
    const errorResponse = {
      success: false,
      error: {
        message: error.message || 'An error occurred while executing the code',
        type: error.name || 'ExecutionError',
        code: error.code || 'EXECUTION_FAILED',
        details: error.details || null
      },
      data: {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        compile_output: error.compile_output || '',
        runtime_logs: error.runtime_logs || [],
        exit_code: error.exit_code || -1
      },
      execution: {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: executionTime,
        language: language,
        timeout_occurred: error.timeout_occurred || false,
        memory_exceeded: error.memory_exceeded || false,
        crashed: error.crashed || false
      },
      user: {
        id: req.user._id,
        display_name: req.user.displayName,
        email: req.user.email
      },
      metrics: {
        code_length: code?.length || 0,
        input_length: input?.length || 0,
        memory_used: error.memory_used || 'N/A',
        cpu_usage: error.cpu_usage || 'N/A',
        container_id: error.container_id || null
      },
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * @route GET /api/execute/languages
 * @desc Get list of supported programming languages
 * @access Public
 */
router.get('/languages', (req, res) => {
  const languages = [
    { id: 'javascript', name: 'JavaScript', version: 'Node.js 18+', extension: '.js' },
    { id: 'python', name: 'Python', version: '3.11+', extension: '.py' },
    { id: 'java', name: 'Java', version: 'OpenJDK 17', extension: '.java' },
    { id: 'cpp', name: 'C++', version: 'GCC 9.2+', extension: '.cpp' },
    { id: 'csharp', name: 'C#', version: '.NET 7.0', extension: '.cs' },
    { id: 'typescript', name: 'TypeScript', version: 'Node.js 18+', extension: '.ts' },
    { id: 'go', name: 'Go', version: '1.21+', extension: '.go' },
    { id: 'rust', name: 'Rust', version: '1.75+', extension: '.rs' },
    { id: 'php', name: 'PHP', version: '8.2+', extension: '.php' },
    { id: 'ruby', name: 'Ruby', version: '3.2+', extension: '.rb' }
  ];

  res.json({
    success: true,
    data: {
      languages,
      count: languages.length
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/execute/health
 * @desc Check the health of code execution services
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const { checkExecutorHealth } = require('../utils/codeExecutor');
    const health = await checkExecutorHealth();
    
    res.json({
      success: true,
      data: {
        status: health.local ? 'healthy' : 'unhealthy',
        services: {
          local: health.local,
          docker: process.env.DOCKER_ENABLED !== 'false',
          judge0: !!process.env.JUDGE0_API_KEY
        },
        uptime: process.uptime(),
        timestamp: health.timestamp || new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        type: 'HealthCheckError',
        code: 'HEALTH_CHECK_FAILED',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/execute/with-files
 * @desc Execute code with file uploads and downloads
 * @access Public
 */
router.post('/with-files', upload.array('files'), async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '', timeout, memoryLimit, sessionId = 'temp' } = req.body;
  const uploadedFiles = req.files || [];

  try {
    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Validate language
    const supportedLanguages = [
      'javascript', 'python', 'java', 'cpp', 'csharp', 
      'typescript', 'go', 'rust', 'php', 'ruby'
    ];
    
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
        code: 'UNSUPPORTED_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    // Execute the code with files
    const result = await executeCodeWithFiles(language, code, input, uploadedFiles, sessionId, timeout, memoryLimit);
    const executionTime = Date.now() - startTime;

    // Prepare response
    const response = {
      success: true,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        runtime_logs: result.runtime_logs || [],
        exit_code: result.exit_code || 0,
        generated_files: result.generated_files || []
      },
      status: result.status || 'success',
      execution: {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: executionTime,
        language: language,
        files_uploaded: uploadedFiles.length,
        files_generated: result.generated_files?.length || 0
      },
      metrics: {
        code_length: code.length,
        input_length: input.length,
        memory_used: result.memory_used || 'N/A',
        cpu_usage: result.cpu_usage || 'N/A',
        container_id: result.container_id || null
      },
      timestamp: new Date().toISOString()
    };

    console.log(`Code execution with files completed: ${language}, ${executionTime}ms, ${uploadedFiles.length} files`);

    res.json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Code execution with files error:', error);
    
    const errorResponse = {
      success: false,
      error: {
        message: error.message || 'An error occurred while executing the code',
        type: error.name || 'ExecutionError',
        code: error.code || 'EXECUTION_FAILED',
        details: error.details || null
      },
      data: {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        compile_output: error.compile_output || '',
        runtime_logs: error.runtime_logs || [],
        exit_code: error.exit_code || -1
      },
      execution: {
        start_time: new Date(startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: executionTime,
        language: language,
        files_uploaded: uploadedFiles.length
      },
      metrics: {
        code_length: code?.length || 0,
        input_length: input?.length || 0,
        memory_used: error.memory_used || 'N/A',
        cpu_usage: error.cpu_usage || 'N/A',
        container_id: error.container_id || null
      },
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * @route POST /api/execute/interactive
 * @desc Execute code with interactive stdin support
 * @access Public
 */
router.post('/interactive', async (req, res) => {
  const { language, code, sessionId = 'temp', timeout = 30000 } = req.body;

  try {
    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Validate language
    const supportedLanguages = [
      'javascript', 'python', 'java', 'cpp', 'csharp', 
      'typescript', 'go', 'rust', 'php', 'ruby'
    ];
    
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
        code: 'UNSUPPORTED_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    // Create interactive execution session
    const sessionId = uuidv4();
    const result = await createInteractiveSession(language, code, sessionId, timeout);

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        status: 'ready',
        message: 'Interactive session created successfully'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Interactive execution error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create interactive session',
        type: error.name || 'InteractiveError',
        code: error.code || 'INTERACTIVE_FAILED'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/execute/interactive/:sessionId/input
 * @desc Send input to interactive execution session
 * @access Public
 */
router.post('/interactive/:sessionId/input', async (req, res) => {
  const { sessionId } = req.params;
  const { input } = req.body;

  try {
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
        code: 'MISSING_INPUT'
      });
    }

    const result = await sendInteractiveInput(sessionId, input);

    res.json({
      success: true,
      data: {
        output: result.output,
        status: result.status,
        session_id: sessionId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Interactive input error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to send input',
        type: error.name || 'InputError',
        code: error.code || 'INPUT_FAILED'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route DELETE /api/execute/interactive/:sessionId
 * @desc Terminate interactive execution session
 * @access Public
 */
router.delete('/interactive/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    await terminateInteractiveSession(sessionId);

    res.json({
      success: true,
      data: {
        message: 'Interactive session terminated successfully',
        session_id: sessionId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Terminate session error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to terminate session',
        type: error.name || 'TerminationError',
        code: error.code || 'TERMINATION_FAILED'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/execute/files/:sessionId
 * @desc Get list of files in execution session
 * @access Public
 */
router.get('/files/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const files = await getSessionFiles(sessionId);

    res.json({
      success: true,
      data: {
        files,
        session_id: sessionId
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get session files error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get session files',
        type: error.name || 'FileError',
        code: error.code || 'FILE_ACCESS_FAILED'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/execute/files/:sessionId/:filename
 * @desc Download a file from execution session
 * @access Public
 */
router.get('/files/:sessionId/:filename', async (req, res) => {
  const { sessionId, filename } = req.params;

  try {
    const filePath = path.join(__dirname, '../uploads', sessionId, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to download file',
        type: error.name || 'DownloadError',
        code: error.code || 'DOWNLOAD_FAILED'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Enhanced code execution with comprehensive error handling
 */
async function executeCodeWithEnhancedHandling(language, code, input, timeout = 10000, memoryLimit = '256MB') {
  const startTime = Date.now();
  let containerId = null;
  let runtimeLogs = [];
  let memoryUsage = 'N/A';
  let cpuUsage = 'N/A';

  try {
    // Add execution start log
    runtimeLogs.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Starting ${language} code execution`,
      details: {
        code_length: code.length,
        input_length: input.length,
        timeout: timeout,
        memory_limit: memoryLimit
      }
    });

    // Execute the code with timeout handling
    const result = await Promise.race([
      executeCode(language, code, input),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Execution timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);

    // Add successful execution log
    runtimeLogs.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Code execution completed successfully',
      details: {
        execution_time: Date.now() - startTime,
        stdout_length: result.stdout?.length || 0,
        stderr_length: result.stderr?.length || 0
      }
    });

    return {
      ...result,
      runtime_logs: runtimeLogs,
      exit_code: result.status === 'success' ? 0 : 1,
      timeout_occurred: false,
      memory_exceeded: false,
      crashed: false,
      memory_used: memoryUsage,
      cpu_usage: cpuUsage,
      container_id: containerId
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Determine error type and add appropriate logs
    let errorType = 'EXECUTION_ERROR';
    let timeoutOccurred = false;
    let memoryExceeded = false;
    let crashed = false;

    if (error.message.includes('timeout')) {
      errorType = 'TIMEOUT_ERROR';
      timeoutOccurred = true;
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Execution timed out - possible infinite loop detected',
        details: {
          execution_time: executionTime,
          timeout_limit: timeout
        }
      });
    } else if (error.message.includes('memory') || error.message.includes('OOM')) {
      errorType = 'MEMORY_ERROR';
      memoryExceeded = true;
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Memory limit exceeded',
        details: {
          execution_time: executionTime,
          memory_limit: memoryLimit
        }
      });
    } else if (error.message.includes('crashed') || error.message.includes('killed')) {
      errorType = 'CRASH_ERROR';
      crashed = true;
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Process crashed or was killed',
        details: {
          execution_time: executionTime,
          error_message: error.message
        }
      });
    } else {
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Code execution failed',
        details: {
          execution_time: executionTime,
          error_message: error.message
        }
      });
    }

    // Create enhanced error object
    const enhancedError = new Error(error.message);
    enhancedError.name = errorType;
    enhancedError.code = errorType;
    enhancedError.details = {
      execution_time: executionTime,
      language: language,
      timeout_occurred: timeoutOccurred,
      memory_exceeded: memoryExceeded,
      crashed: crashed
    };
    enhancedError.stdout = error.stdout || '';
    enhancedError.stderr = error.stderr || '';
    enhancedError.compile_output = error.compile_output || '';
    enhancedError.runtime_logs = runtimeLogs;
    enhancedError.exit_code = -1;
    enhancedError.timeout_occurred = timeoutOccurred;
    enhancedError.memory_exceeded = memoryExceeded;
    enhancedError.crashed = crashed;
    enhancedError.memory_used = memoryUsage;
    enhancedError.cpu_usage = cpuUsage;
    enhancedError.container_id = containerId;

    throw enhancedError;
  }
}

/**
 * Execute code with file support
 */
async function executeCodeWithFiles(language, code, input, uploadedFiles, sessionId, timeout = 10000, memoryLimit = '256MB') {
  const startTime = Date.now();
  let containerId = null;
  let runtimeLogs = [];
  let memoryUsage = 'N/A';
  let cpuUsage = 'N/A';
  let generatedFiles = [];

  try {
    // Add execution start log
    runtimeLogs.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Starting ${language} code execution with files`,
      details: {
        code_length: code.length,
        input_length: input.length,
        files_uploaded: uploadedFiles.length,
        session_id: sessionId,
        timeout: timeout,
        memory_limit: memoryLimit
      }
    });

    // Use enhanced Docker executor for file support
    const DockerExecutor = require('../utils/dockerExecutor');
    const dockerExecutor = new DockerExecutor();
    
    // Execute with file support
    const result = await dockerExecutor.executeCodeWithFiles(
      language, 
      code, 
      input, 
      uploadedFiles, 
      sessionId, 
      timeout, 
      memoryLimit
    );

    // Add successful execution log
    runtimeLogs.push({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Code execution with files completed successfully',
      details: {
        execution_time: Date.now() - startTime,
        stdout_length: result.stdout?.length || 0,
        stderr_length: result.stderr?.length || 0,
        files_generated: result.generated_files?.length || 0
      }
    });

    return {
      ...result,
      runtime_logs: runtimeLogs,
      exit_code: result.status === 'success' ? 0 : 1,
      timeout_occurred: false,
      memory_exceeded: false,
      crashed: false,
      memory_used: memoryUsage,
      cpu_usage: cpuUsage,
      container_id: containerId,
      generated_files: result.generated_files || []
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Determine error type and add appropriate logs
    let errorType = 'EXECUTION_ERROR';
    let timeoutOccurred = false;
    let memoryExceeded = false;
    let crashed = false;

    if (error.message.includes('timeout')) {
      errorType = 'TIMEOUT_ERROR';
      timeoutOccurred = true;
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Execution timed out - possible infinite loop detected',
        details: {
          execution_time: executionTime,
          timeout_limit: timeout
        }
      });
    } else if (error.message.includes('memory') || error.message.includes('OOM')) {
      errorType = 'MEMORY_ERROR';
      memoryExceeded = true;
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Memory limit exceeded',
        details: {
          execution_time: executionTime,
          memory_limit: memoryLimit
        }
      });
    } else if (error.message.includes('crashed') || error.message.includes('killed')) {
      errorType = 'CRASH_ERROR';
      crashed = true;
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Process crashed or was killed',
        details: {
          execution_time: executionTime,
          error_message: error.message
        }
      });
    } else {
      runtimeLogs.push({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Code execution with files failed',
        details: {
          execution_time: executionTime,
          error_message: error.message
        }
      });
    }

    // Create enhanced error object
    const enhancedError = new Error(error.message);
    enhancedError.name = errorType;
    enhancedError.code = errorType;
    enhancedError.details = {
      execution_time: executionTime,
      language: language,
      timeout_occurred: timeoutOccurred,
      memory_exceeded: memoryExceeded,
      crashed: crashed
    };
    enhancedError.stdout = error.stdout || '';
    enhancedError.stderr = error.stderr || '';
    enhancedError.compile_output = error.compile_output || '';
    enhancedError.runtime_logs = runtimeLogs;
    enhancedError.exit_code = -1;
    enhancedError.timeout_occurred = timeoutOccurred;
    enhancedError.memory_exceeded = memoryExceeded;
    enhancedError.crashed = crashed;
    enhancedError.memory_used = memoryUsage;
    enhancedError.cpu_usage = cpuUsage;
    enhancedError.container_id = containerId;

    throw enhancedError;
  }
}

/**
 * Create interactive execution session
 */
async function createInteractiveSession(language, code, sessionId, timeout = 30000) {
  try {
    // Store session info for interactive execution
    const sessionData = {
      language,
      code,
      sessionId,
      timeout,
      createdAt: new Date(),
      status: 'ready'
    };

    // Store in memory (in production, use Redis or database)
    if (!global.interactiveSessions) {
      global.interactiveSessions = new Map();
    }
    
    global.interactiveSessions.set(sessionId, sessionData);

    return {
      session_id: sessionId,
      status: 'ready'
    };
  } catch (error) {
    throw new Error(`Failed to create interactive session: ${error.message}`);
  }
}

/**
 * Send input to interactive session
 */
async function sendInteractiveInput(sessionId, input) {
  try {
    if (!global.interactiveSessions || !global.interactiveSessions.has(sessionId)) {
      throw new Error('Interactive session not found');
    }

    const session = global.interactiveSessions.get(sessionId);
    
    // Execute code with the new input
    const result = await executeCode(session.language, session.code, input);
    
    return {
      output: result.stdout || '',
      error: result.stderr || '',
      status: result.status || 'completed'
    };
  } catch (error) {
    throw new Error(`Failed to send input: ${error.message}`);
  }
}

/**
 * Terminate interactive session
 */
async function terminateInteractiveSession(sessionId) {
  try {
    if (global.interactiveSessions && global.interactiveSessions.has(sessionId)) {
      global.interactiveSessions.delete(sessionId);
    }
    
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to terminate session: ${error.message}`);
  }
}

/**
 * Get files in session
 */
async function getSessionFiles(sessionId) {
  try {
    const sessionDir = path.join(__dirname, '../uploads', sessionId);
    
    try {
      await fs.access(sessionDir);
    } catch {
      return [];
    }

    const files = [];
    const entries = await fs.readdir(sessionDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(sessionDir, entry.name);
        const stats = await fs.stat(filePath);
        
        files.push({
          name: entry.name,
          size: stats.size,
          modified: stats.mtime,
          path: entry.name
        });
      }
    }
    
    return files;
  } catch (error) {
    throw new Error(`Failed to get session files: ${error.message}`);
  }
}

module.exports = router;

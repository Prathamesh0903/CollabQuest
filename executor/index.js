require('dotenv').config();
const express = require('express');
const Docker = require('dockerode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const docker = new Docker();

// Enhanced security middleware
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Rate limiting (simple in-memory implementation)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimit.has(clientIp)) {
    rateLimit.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const limit = rateLimit.get(clientIp);
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + RATE_LIMIT_WINDOW;
    } else if (limit.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    } else {
      limit.count++;
    }
  }
  next();
});

// Pull image if missing
async function pullImageIfMissing(imageName) {
  try {
    const image = docker.getImage(imageName);
    await image.inspect();
  } catch {
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    });
  }
}

// Enhanced language configurations with security settings
const languageConfigs = {
  javascript: {
    image: 'node:18-alpine',
    timeout: 3000, // 3 seconds
    memory: 256 * 1024 * 1024, // 256MB
    cmd: ['node', '-e'],
    fileExtension: '.js',
    setupCmd: ['sh', '-c', 'apk add --no-cache python3 py3-pip'],
    securityFlags: ['--max-old-space-size=128', '--no-warnings'],
    forbiddenPatterns: [
      /require\s*\(\s*['"]fs['"]\s*\)/m,
      /require\s*\(\s*['"]child_process['"]\s*\)/m,
      /require\s*\(\s*['"]process['"]\s*\)/m,
      /require\s*\(\s*['"]os['"]\s*\)/m,
      /require\s*\(\s*['"]path['"]\s*\)/m,
      /eval\s*\(/m,
      /Function\s*\(/m,
      /setTimeout\s*\(/m,
      /setInterval\s*\(/m,
      /process\.exit/m,
      /process\.kill/m,
      /process\.env/m,
      /__dirname/m,
      /__filename/m,
      /global\./m,
      /Buffer\./m
    ]
  },
  python: {
    image: 'python:3.10-alpine',
    timeout: 3000, // 3 seconds
    memory: 256 * 1024 * 1024, // 256MB
    cmd: ['python', '-c'],
    fileExtension: '.py',
    setupCmd: ['sh', '-c', 'apk add --no-cache gcc musl-dev'],
    securityFlags: ['-B', '-E'], // Disable bytecode and environment
    forbiddenPatterns: [
      /import\s+os\s*$/m,
      /import\s+subprocess\s*$/m,
      /import\s+sys\s*$/m,
      /import\s+shutil\s*$/m,
      /import\s+glob\s*$/m,
      /import\s+pathlib\s*$/m,
      /__import__\s*\(/m,
      /exec\s*\(/m,
      /eval\s*\(/m,
      /open\s*\(/m,
      /file\s*\(/m,
      /subprocess\./m,
      /os\./m,
      /sys\./m,
      /exit\s*\(/m,
      /quit\s*\(/m,
      /breakpoint\s*\(/m,
      /input\s*\(/m
    ]
  }
};

// Enhanced code validation with language-specific checks
function validateCode(code, language) {
  // Check code length
  if (code.length > 10000) {
    throw new Error('Code too long (max 10KB)');
  }

  // Check for null bytes and other dangerous characters
  if (code.includes('\0') || code.includes('\x00')) {
    throw new Error('Code contains null bytes');
  }

  // Language-specific validations
  const config = languageConfigs[language];
  if (!config) {
    throw new Error('Unsupported language');
  }

  // Check for forbidden patterns
  for (const pattern of config.forbiddenPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Forbidden code pattern detected: ${pattern.source}`);
    }
  }

  // Additional language-specific checks
  if (language === 'javascript') {
    // Check for potentially dangerous JavaScript patterns
    const jsDangerousPatterns = [
      'process.exit',
      'process.kill',
      'process.env',
      'global.',
      'Buffer.',
      'setImmediate',
      'setInterval',
      'setTimeout'
    ];
    
    for (const pattern of jsDangerousPatterns) {
      if (code.includes(pattern)) {
        throw new Error(`Forbidden JavaScript operation: ${pattern}`);
      }
    }
  } else if (language === 'python') {
    // Check for potentially dangerous Python patterns
    const pyDangerousPatterns = [
      'exit()',
      'quit()',
      'breakpoint()',
      'input(',
      'raw_input(',
      'compile(',
      'exec(',
      'eval('
    ];
    
    for (const pattern of pyDangerousPatterns) {
      if (code.includes(pattern)) {
        throw new Error(`Forbidden Python operation: ${pattern}`);
      }
    }
  }
}

// Enhanced container creation with better security
async function createSecureContainer(config, code, input = '') {
  // Ensure image is available
  await pullImageIfMissing(config.image);
  const containerId = crypto.randomBytes(16).toString('hex');
  const containerName = `code-exec-${containerId}-${Date.now()}`;
  
  const containerOptions = {
    Image: config.image,
    name: containerName,
    Cmd: [...config.cmd, code],
    Tty: false,
    OpenStdin: true,
    StdinOnce: true,
    HostConfig: {
      Memory: config.memory,
      MemorySwap: config.memory,
      CpuPeriod: 100000,
      CpuQuota: 50000, // 50% CPU limit
      PidsLimit: 50,
      SecurityOpt: ['no-new-privileges'],
      CapDrop: ['ALL'],
      NetworkMode: 'none',
      ReadonlyRootfs: true,
      Binds: [],
      AutoRemove: true,
      Ulimits: [
        { Name: 'nofile', Soft: 64, Hard: 64 },
        { Name: 'nproc', Soft: 50, Hard: 50 }
      ],
      KernelMemory: 128 * 1024 * 1024, // 128MB kernel memory limit
      OomKillDisable: false,
      MemorySwappiness: 0
    },
    Env: [
      'PYTHONUNBUFFERED=1',
      'NODE_OPTIONS=--max-old-space-size=128',
      'PYTHONHASHSEED=random',
      'PYTHONDONTWRITEBYTECODE=1'
    ],
    User: 'nobody:nobody'
  };

  return containerOptions;
}

// Enhanced execution endpoint with better error handling
app.post('/execute', async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '' } = req.body;

  // Input validation
  if (!language || !code) {
    return res.status(400).json({ 
      success: false,
      error: 'Language and code are required.' 
    });
  }

  const config = languageConfigs[language];
  if (!config) {
    return res.status(400).json({ 
      success: false,
      error: 'Unsupported language. Supported: javascript, python' 
    });
  }

  // Validate input length
  if (input.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Input too long (max 1KB)'
    });
  }

  let container;
  let timeoutId;

  try {
    // Validate code for security
    validateCode(code, language);

    // Create container options
    const containerOptions = await createSecureContainer(config, code, input);
    
    try {
      // Create and start container
      container = await docker.createContainer(containerOptions);
      await container.start();

      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            await container.stop({ t: 0 });
            await container.remove();
          } catch (e) {
            console.error('Error stopping timed out container:', e);
          }
          reject(new Error('Execution timed out (3 seconds)'));
        }, config.timeout);
      });

      // Get container logs with enhanced error handling
      const logsPromise = new Promise(async (resolve, reject) => {
        try {
          const logs = await container.logs({ 
            follow: true, 
            stdout: true, 
            stderr: true,
            tail: 1000
          });

          let stdout = '';
          let stderr = '';

          logs.on('data', (chunk) => {
            try {
              const header = chunk.slice(0, 8);
              const streamType = header.readUInt8(0);
              const payload = chunk.slice(8).toString('utf8');

              if (streamType === 1) {
                stdout += payload;
              } else {
                stderr += payload;
              }
            } catch (err) {
              console.error('Error processing log chunk:', err);
            }
          });

          logs.on('end', () => {
            resolve({ stdout, stderr });
          });

          logs.on('error', (err) => {
            reject(err);
          });

        } catch (err) {
          reject(err);
        }
      });

      // Wait for either completion or timeout
      const result = await Promise.race([logsPromise, timeoutPromise]);
      
      clearTimeout(timeoutId);
      
      // Clean up container
      try {
        await container.stop();
        await container.remove();
      } catch (e) {
        console.error('Error cleaning up container:', e);
      }

      // Truncate output if too long
      const maxOutputLength = 10000;
      const truncatedStdout = result.stdout.length > maxOutputLength 
        ? result.stdout.substring(0, maxOutputLength) + '\n... (truncated)'
        : result.stdout;
      const truncatedStderr = result.stderr.length > maxOutputLength 
        ? result.stderr.substring(0, maxOutputLength) + '\n... (truncated)'
        : result.stderr;

      const executionTime = Date.now() - startTime;

      // Log execution metrics
      console.log(`Code execution completed: ${language}, ${executionTime}ms, ${code.length} chars`);

      res.json({
        success: true,
        stdout: truncatedStdout,
        stderr: truncatedStderr,
        executionTime: Date.now(),
        metrics: {
          codeLength: code.length,
          executionDuration: executionTime,
          language: language
        }
      });

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Clean up container if it exists
      if (container) {
        try {
          await container.stop();
          await container.remove();
        } catch (e) {
          console.error('Error cleaning up container after error:', e);
        }
      }

      throw error;
    }

  } catch (error) {
    console.error('Code execution error:', error);
    
    const executionTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while executing the code.',
      executionTime: Date.now(),
      metrics: {
        codeLength: code.length,
        executionDuration: executionTime,
        language: language,
        errorType: error.name
      }
    });
  }
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Docker connectivity
    const containers = await docker.listContainers({ limit: 1 });
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      docker: 'connected',
      activeContainers: containers.length,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      docker: 'disconnected',
      error: error.message
    });
  }
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Secure code executor service listening on port ${PORT}`);
  console.log('🛡️  Security features enabled:');
  console.log('   - Container isolation');
  console.log('   - Memory and CPU limits');
  console.log('   - Network isolation');
  console.log('   - Read-only filesystem');
  console.log('   - Privilege dropping');
  console.log('   - Code validation');
  console.log('   - Rate limiting');
});

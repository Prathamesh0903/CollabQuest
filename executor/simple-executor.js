const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Security validation
function validateCode(code, language) {
  const maxLength = 10000;
  if (code.length > maxLength) {
    throw new Error('Code too long (max 10KB)');
  }

  // Basic security checks
  const dangerousPatterns = {
    javascript: [
      /process\.exit/i,
      /require\s*\(\s*['"]fs['"]/i,
      /require\s*\(\s*['"]child_process['"]/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /\.exec\(/i,
      /\.spawn\(/i,
      /\.fork\(/i,
      /global\.process/i,
      /process\.env/i,
      /process\.kill/i,
      /__dirname/i,
      /__filename/i
    ],
    python: [
      /import\s+os/i,
      /import\s+subprocess/i,
      /import\s+sys/i,
      /import\s+shutil/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /open\s*\(/i,
      /file\s*\(/i,
      /subprocess\./i,
      /os\./i,
      /sys\.exit/i,
      /quit\s*\(/i,
      /__import__/i,
      /breakpoint\s*\(/i
    ]
  };

  const patterns = dangerousPatterns[language] || [];
  for (const pattern of patterns) {
    if (pattern.test(code)) {
      throw new Error(`Security violation: ${pattern.source}`);
    }
  }
}

// Simple code execution
app.post('/execute', async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '' } = req.body;

  try {
    // Validate inputs
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required'
      });
    }

    if (!['javascript', 'python'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language. Use javascript or python'
      });
    }

    // Security validation
    validateCode(code, language);

    let command, args;
    if (language === 'javascript') {
      command = 'node';
      args = ['-e', code];
    } else if (language === 'python') {
      command = 'python';
      args = ['-c', code];
    }

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000, // 5 seconds timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle input
    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.on('close', (code) => {
      const executionTime = Date.now() - startTime;
      
      if (code === null) {
        return res.json({
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          executionTime,
          status: 'timeout'
        });
      }

      res.json({
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTime,
        status: code === 0 ? 'success' : 'error'
      });
    });

    child.on('error', (error) => {
      res.status(500).json({
        success: false,
        error: error.message
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Simple code executor listening on port ${PORT}`);
  console.log('📍 No Docker required - using local Node.js/Python');
});

module.exports = app;

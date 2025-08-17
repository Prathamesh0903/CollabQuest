const Docker = require('dockerode');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class DockerCodeExecutor {
  constructor(options = {}) {
    this.docker = new Docker(options.dockerSocket || '/var/run/docker.sock');
    this.tempDir = options.tempDir || os.tmpdir();
    this.maxExecutionTime = options.maxExecutionTime || 10000; // 10 seconds
    this.maxMemory = options.maxMemory || 256 * 1024 * 1024; // 256MB
    this.maxCodeLength = options.maxCodeLength || 50000; // 50KB
    
    // Language configurations
    this.languageConfigs = {
      python: {
        image: 'python:3.11-alpine',
        extension: '.py',
        command: ['python', '-u'],
        setupCommands: [
          'apk add --no-cache gcc musl-dev'
        ],
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
      },
      javascript: {
        image: 'node:18-alpine',
        extension: '.js',
        command: ['node', '-e'],
        setupCommands: [
          'apk add --no-cache python3 py3-pip'
        ],
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
      java: {
        image: 'openjdk:17-alpine',
        extension: '.java',
        command: ['sh', '-c'],
        setupCommands: [
          'apk add --no-cache gcc musl-dev'
        ],
        forbiddenPatterns: [
          /import\s+java\.io\./m,
          /import\s+java\.nio\./m,
          /import\s+java\.net\./m,
          /import\s+java\.lang\.reflect\./m,
          /import\s+java\.lang\.ProcessBuilder/m,
          /import\s+java\.lang\.Runtime/m,
          /System\.exit/m,
          /Runtime\.getRuntime/m,
          /ProcessBuilder/m,
          /File\s*\(/m,
          /FileInputStream/m,
          /FileOutputStream/m,
          /FileReader/m,
          /FileWriter/m
        ]
      }
    };
  }

  // Validate code for security
  validateCode(code, language) {
    if (!code || typeof code !== 'string') {
      throw new Error('Code must be a non-empty string');
    }

    if (code.length > this.maxCodeLength) {
      throw new Error(`Code too long (max ${this.maxCodeLength} characters)`);
    }

    // Check for null bytes and control characters
    if (code.includes('\0') || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(code)) {
      throw new Error('Code contains invalid characters');
    }

    const config = this.languageConfigs[language];
    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Check for forbidden patterns
    for (const pattern of config.forbiddenPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Forbidden pattern detected: ${pattern.source}`);
      }
    }

    return true;
  }

  // Create secure container configuration
  createContainerConfig(language, code, input = '') {
    const config = this.languageConfigs[language];
    const containerId = crypto.randomBytes(16).toString('hex');
    const containerName = `code-exec-${containerId}-${Date.now()}`;

    let command;
    if (language === 'java') {
      // For Java, we need to create a file and compile it
      command = [
        'sh', '-c',
        `echo '${code.replace(/'/g, "'\"'\"'")}' > Main.java && javac Main.java && java Main`
      ];
    } else {
      command = [...config.command, code];
    }

    return {
      Image: config.image,
      name: containerName,
      Cmd: command,
      Tty: false,
      OpenStdin: true,
      StdinOnce: true,
      HostConfig: {
        // Memory limits
        Memory: this.maxMemory,
        MemorySwap: 0,
        KernelMemory: this.maxMemory / 2,
        MemorySwappiness: 0,
        OomKillDisable: false,

        // CPU limits
        CpuPeriod: 100000,
        CpuQuota: 50000, // 50% CPU
        CpuShares: 512,

        // Process limits
        PidsLimit: 50,

        // Security options
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        CapAdd: [],

        // Network isolation
        NetworkMode: 'none',

        // Filesystem security
        ReadonlyRootfs: true,
        Binds: [],

        // Resource limits
        Ulimits: [
          { Name: 'nofile', Soft: 64, Hard: 64 },
          { Name: 'nproc', Soft: 50, Hard: 50 },
          { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 },
          { Name: 'data', Soft: this.maxMemory, Hard: this.maxMemory },
          { Name: 'stack', Soft: 8 * 1024 * 1024, Hard: 8 * 1024 * 1024 },
          { Name: 'core', Soft: 0, Hard: 0 },
          { Name: 'rss', Soft: this.maxMemory, Hard: this.maxMemory }
        ],

        // Additional security
        AutoRemove: true,
        RestartPolicy: { Name: 'no' },
        Devices: [],
        CgroupParent: 'code-exec.slice'
      },

      // Environment hardening
      Env: [
        'PYTHONUNBUFFERED=1',
        'NODE_OPTIONS=--max-old-space-size=128',
        'PYTHONHASHSEED=random',
        'PYTHONDONTWRITEBYTECODE=1',
        'PYTHONPATH=',
        'NODE_PATH=',
        'PATH=/usr/local/bin:/usr/bin:/bin',
        'HOME=/tmp',
        'TMPDIR=/tmp',
        'TEMP=/tmp'
      ],

      // User isolation
      User: 'nobody:nobody',

      // Working directory
      WorkingDir: '/tmp',

      // Labels for monitoring
      Labels: {
        'security.level': 'high',
        'execution.type': 'user-code',
        'language': language,
        'created.by': 'docker-code-executor'
      }
    };
  }

  // Execute code in a Docker container
  async executeCode(language, code, input = '') {
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!language || !code) {
        throw new Error('Language and code are required');
      }

      // Validate input length
      if (input && input.length > 1000) {
        throw new Error('Input too long (max 1KB)');
      }

      // Validate code for security
      this.validateCode(code, language);

      // Create container configuration
      const containerConfig = this.createContainerConfig(language, code, input);
      
      let container;
      let timeoutId;

      try {
        // Create and start container
        container = await this.docker.createContainer(containerConfig);
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
            reject(new Error(`Execution timed out (${this.maxExecutionTime / 1000} seconds)`));
          }, this.maxExecutionTime);
        });

        // Get container logs
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

        // Wait for completion or timeout
        const result = await Promise.race([logsPromise, timeoutPromise]);
        
        clearTimeout(timeoutId);
        
        // Clean up container
        try {
          await container.stop();
          await container.remove();
        } catch (e) {
          console.error('Error cleaning up container:', e);
        }

        const executionTime = Date.now() - startTime;

        return {
          success: true,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          executionTime,
          language,
          codeLength: code.length
        };

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
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        stderr: error.stderr || '',
        executionTime,
        language,
        codeLength: code.length
      };
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return Object.keys(this.languageConfigs).map(lang => ({
      id: lang,
      name: this.getLanguageName(lang),
      version: this.getLanguageVersion(lang),
      extension: this.languageConfigs[lang].extension
    }));
  }

  getLanguageName(language) {
    const names = {
      python: 'Python',
      javascript: 'JavaScript',
      java: 'Java'
    };
    return names[language] || language;
  }

  getLanguageVersion(language) {
    const versions = {
      python: '3.11',
      javascript: 'Node.js 18',
      java: 'OpenJDK 17'
    };
    return versions[language] || 'Unknown';
  }

  // Health check
  async healthCheck() {
    try {
      await this.docker.ping();
      return { status: 'healthy', docker: true };
    } catch (error) {
      return { status: 'unhealthy', docker: false, error: error.message };
    }
  }
}

// Example usage and test functions
async function runExamples() {
  const executor = new DockerCodeExecutor();

  console.log('🐳 Docker Code Executor Examples\n');

  // Test Python
  console.log('1. Testing Python...');
  const pythonResult = await executor.executeCode('python', `
print("Hello from Python!")
print(f"2 + 2 = {2 + 2}")

# Test input
name = input()
print(f"Hello, {name}!")
  `, 'World');
  
  console.log('Python Result:', pythonResult);

  // Test JavaScript
  console.log('\n2. Testing JavaScript...');
  const jsResult = await executor.executeCode('javascript', `
console.log("Hello from JavaScript!");
console.log("2 + 2 =", 2 + 2);

// Test input
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', (answer) => {
  console.log("Hello,", answer + "!");
  rl.close();
});
  `, 'World');
  
  console.log('JavaScript Result:', jsResult);

  // Test Java
  console.log('\n3. Testing Java...');
  const javaResult = await executor.executeCode('java', `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        System.out.println("2 + 2 = " + (2 + 2));
        
        Scanner scanner = new Scanner(System.in);
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "!");
        scanner.close();
    }
}
  `, 'World');
  
  console.log('Java Result:', javaResult);

  // Test security
  console.log('\n4. Testing Security (should fail)...');
  const securityTest = await executor.executeCode('python', 'import os; os.system("ls")');
  console.log('Security Test Result:', securityTest);

  // Get supported languages
  console.log('\n5. Supported Languages:');
  const languages = executor.getSupportedLanguages();
  console.log(languages);

  // Health check
  console.log('\n6. Health Check:');
  const health = await executor.healthCheck();
  console.log(health);
}

// Export the class and example function
module.exports = {
  DockerCodeExecutor,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
    .then(() => {
      console.log('\n✅ Examples completed successfully');
    })
    .catch(error => {
      console.error('❌ Examples failed:', error);
      process.exit(1);
    });
}

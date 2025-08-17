const Docker = require('dockerode');
const crypto = require('crypto');

class DockerResourceLimiter {
  constructor(options = {}) {
    this.docker = new Docker(options.dockerSocket || '/var/run/docker.sock');
    
    // Default resource limits
    this.defaultLimits = {
      // Time limits
      executionTimeout: options.executionTimeout || 10000, // 10 seconds
      containerTimeout: options.containerTimeout || 15000, // 15 seconds (extra buffer)
      
      // Memory limits
      maxMemory: options.maxMemory || 256 * 1024 * 1024, // 256MB
      maxMemorySwap: options.maxMemorySwap || 0, // No swap
      kernelMemory: options.kernelMemory || 128 * 1024 * 1024, // 128MB kernel memory
      
      // CPU limits
      cpuPeriod: options.cpuPeriod || 100000, // 100ms period
      cpuQuota: options.cpuQuota || 50000, // 50% CPU (50ms per 100ms period)
      cpuShares: options.cpuShares || 512, // CPU weight
      
      // Process limits
      maxProcesses: options.maxProcesses || 50,
      maxFiles: options.maxFiles || 64,
      
      // File size limits
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB
      
      // Stack limits
      maxStackSize: options.maxStackSize || 8 * 1024 * 1024, // 8MB
      
      // Data segment limits
      maxDataSize: options.maxDataSize || 256 * 1024 * 1024, // 256MB
    };
  }

  // Method 1: Basic resource limits with Docker run options
  createBasicContainerConfig(code, language = 'python') {
    const containerId = crypto.randomBytes(16).toString('hex');
    const containerName = `code-exec-${containerId}-${Date.now()}`;

    return {
      Image: this.getLanguageImage(language),
      name: containerName,
      Cmd: this.getLanguageCommand(language, code),
      Tty: false,
      OpenStdin: true,
      StdinOnce: true,
      
      // Host configuration with resource limits
      HostConfig: {
        // Memory limits
        Memory: this.defaultLimits.maxMemory,
        MemorySwap: this.defaultLimits.maxMemorySwap,
        KernelMemory: this.defaultLimits.kernelMemory,
        MemorySwappiness: 0, // Disable swap
        OomKillDisable: false, // Allow OOM killer
        
        // CPU limits
        CpuPeriod: this.defaultLimits.cpuPeriod,
        CpuQuota: this.defaultLimits.cpuQuota,
        CpuShares: this.defaultLimits.cpuShares,
        
        // Process limits
        PidsLimit: this.defaultLimits.maxProcesses,
        
        // Security options
        SecurityOpt: ['no-new-privileges'],
        CapDrop: ['ALL'],
        
        // Network isolation
        NetworkMode: 'none',
        
        // Filesystem security
        ReadonlyRootfs: true,
        
        // Resource limits (ulimits)
        Ulimits: [
          { Name: 'nofile', Soft: this.defaultLimits.maxFiles, Hard: this.defaultLimits.maxFiles },
          { Name: 'nproc', Soft: this.defaultLimits.maxProcesses, Hard: this.defaultLimits.maxProcesses },
          { Name: 'fsize', Soft: this.defaultLimits.maxFileSize, Hard: this.defaultLimits.maxFileSize },
          { Name: 'data', Soft: this.defaultLimits.maxDataSize, Hard: this.defaultLimits.maxDataSize },
          { Name: 'stack', Soft: this.defaultLimits.maxStackSize, Hard: this.defaultLimits.maxStackSize },
          { Name: 'core', Soft: 0, Hard: 0 }, // Disable core dumps
          { Name: 'rss', Soft: this.defaultLimits.maxMemory, Hard: this.defaultLimits.maxMemory }
        ],
        
        // Additional security
        AutoRemove: true,
        RestartPolicy: { Name: 'no' },
        
        // Cgroup configuration
        CgroupParent: 'code-exec.slice'
      },
      
      // Environment variables for additional limits
      Env: [
        'PYTHONUNBUFFERED=1',
        'NODE_OPTIONS=--max-old-space-size=128',
        'PYTHONHASHSEED=random',
        'PYTHONDONTWRITEBYTECODE=1',
        'PATH=/usr/local/bin:/usr/bin:/bin',
        'HOME=/tmp',
        'TMPDIR=/tmp'
      ],
      
      // User isolation
      User: 'nobody:nobody',
      WorkingDir: '/tmp'
    };
  }

  // Method 2: Advanced resource limits with cgroups
  createAdvancedContainerConfig(code, language = 'python') {
    const basicConfig = this.createBasicContainerConfig(code, language);
    
    // Add advanced cgroup limits
    basicConfig.HostConfig.CgroupParent = 'code-exec.slice';
    
    // Add additional memory controls
    basicConfig.HostConfig.MemoryReservation = this.defaultLimits.maxMemory / 2; // 50% reservation
    basicConfig.HostConfig.MemorySwappiness = 0;
    
    // Add CPU scheduling
    basicConfig.HostConfig.CpuRealtimePeriod = 0; // Disable real-time scheduling
    basicConfig.HostConfig.CpuRealtimeRuntime = 0;
    
    // Add I/O limits
    basicConfig.HostConfig.IOMaximumIOps = 1000; // Max IOPS
    basicConfig.HostConfig.IOMaximumBandwidth = 50 * 1024 * 1024; // 50MB/s
    
    return basicConfig;
  }

  // Method 3: Execute with comprehensive timeout and monitoring
  async executeWithLimits(code, language = 'python', customLimits = {}) {
    const startTime = Date.now();
    const limits = { ...this.defaultLimits, ...customLimits };
    
    let container;
    let timeoutId;
    let resourceMonitor;

    try {
      // Create container with limits
      const containerConfig = this.createAdvancedContainerConfig(code, language);
      container = await this.docker.createContainer(containerConfig);
      
      // Start container
      await container.start();
      
      // Set up resource monitoring
      resourceMonitor = setInterval(async () => {
        try {
          const stats = await container.stats({ stream: false });
          const memoryUsage = stats.memory_stats.usage || 0;
          const cpuUsage = this.calculateCPUUsage(stats);
          
          // Log resource usage
          console.log(`Resource Usage - Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB, CPU: ${cpuUsage.toFixed(2)}%`);
          
          // Check if limits are exceeded
          if (memoryUsage > limits.maxMemory * 0.9) {
            console.warn('⚠️  Memory usage approaching limit');
          }
          
          if (cpuUsage > 80) {
            console.warn('⚠️  CPU usage is high');
          }
        } catch (error) {
          console.error('Resource monitoring error:', error.message);
        }
      }, 1000);
      
      // Set execution timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            console.log('⏰ Execution timeout reached, stopping container...');
            await container.stop({ t: 0 });
            await container.remove();
          } catch (e) {
            console.error('Error stopping timed out container:', e);
          }
          reject(new Error(`Execution timed out after ${limits.executionTimeout / 1000} seconds`));
        }, limits.executionTimeout);
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
      clearInterval(resourceMonitor);
      
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
        resourceUsage: {
          memoryLimit: `${(limits.maxMemory / 1024 / 1024).toFixed(0)}MB`,
          cpuLimit: `${(limits.cpuQuota / limits.cpuPeriod * 100).toFixed(0)}%`,
          timeLimit: `${(limits.executionTimeout / 1000).toFixed(0)}s`
        }
      };

    } catch (error) {
      clearTimeout(timeoutId);
      clearInterval(resourceMonitor);
      
      // Clean up container if it exists
      if (container) {
        try {
          await container.stop();
          await container.remove();
        } catch (e) {
          console.error('Error cleaning up container after error:', e);
        }
      }

      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        executionTime,
        language,
        resourceUsage: {
          memoryLimit: `${(limits.maxMemory / 1024 / 1024).toFixed(0)}MB`,
          cpuLimit: `${(limits.cpuQuota / limits.cpuPeriod * 100).toFixed(0)}%`,
          timeLimit: `${(limits.executionTimeout / 1000).toFixed(0)}s`
        }
      };
    }
  }

  // Calculate CPU usage from Docker stats
  calculateCPUUsage(stats) {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    
    if (systemDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
    }
    return 0;
  }

  // Get language-specific image and command
  getLanguageImage(language) {
    const images = {
      python: 'python:3.11-alpine',
      javascript: 'node:18-alpine',
      java: 'openjdk:17-alpine'
    };
    return images[language] || images.python;
  }

  getLanguageCommand(language, code) {
    const commands = {
      python: ['python', '-u', '-c', code],
      javascript: ['node', '-e', code],
      java: ['sh', '-c', `echo '${code.replace(/'/g, "'\"'\"'")}' > Main.java && javac Main.java && java Main`]
    };
    return commands[language] || commands.python;
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

// Example usage
async function runExamples() {
  console.log('🐳 Docker Resource Limits Examples\n');

  const limiter = new DockerResourceLimiter({
    executionTimeout: 5000,  // 5 seconds
    maxMemory: 128 * 1024 * 1024,  // 128MB
    cpuQuota: 25000,  // 25% CPU
    maxProcesses: 25
  });

  // Check health
  console.log('1. Checking Docker health...');
  const health = await limiter.healthCheck();
  console.log('Health:', health);
  console.log('');

  // Example 1: Basic execution with limits
  console.log('2. Basic execution with resource limits...');
  const basicResult = await limiter.executeWithLimits(`
print("Hello from Python!")
print("Testing resource limits...")

# Simple calculation
result = 0
for i in range(1000):
    result += i
print(f"Sum: {result}")
  `, 'python');
  
  console.log('Basic Result:', basicResult);
  console.log('');

  // Example 2: Memory-intensive operation (should be limited)
  console.log('3. Memory-intensive operation...');
  const memoryResult = await limiter.executeWithLimits(`
print("Creating large list...")
large_list = []
for i in range(1000000):
    large_list.append("x" * 100)
print(f"List size: {len(large_list)}")
  `, 'python');
  
  console.log('Memory Test Result:', memoryResult);
  console.log('');

  // Example 3: CPU-intensive operation (should be limited)
  console.log('4. CPU-intensive operation...');
  const cpuResult = await limiter.executeWithLimits(`
print("CPU-intensive calculation...")
import math
result = 0
for i in range(1000000):
    result += math.sqrt(i)
print(f"Result: {result}")
  `, 'python');
  
  console.log('CPU Test Result:', cpuResult);
  console.log('');

  // Example 4: Infinite loop (should timeout)
  console.log('5. Infinite loop (should timeout)...');
  const timeoutResult = await limiter.executeWithLimits(`
print("Starting infinite loop...")
while True:
    pass
  `, 'python');
  
  console.log('Timeout Test Result:', timeoutResult);
  console.log('');

  // Example 5: Custom limits
  console.log('6. Custom limits (very restrictive)...');
  const customResult = await limiter.executeWithLimits(`
print("Testing with custom limits...")
print("This should work with very low limits")
  `, 'python', {
    executionTimeout: 2000,  // 2 seconds
    maxMemory: 64 * 1024 * 1024,  // 64MB
    cpuQuota: 10000,  // 10% CPU
    maxProcesses: 10
  });
  
  console.log('Custom Limits Result:', customResult);
  console.log('');

  console.log('✅ All examples completed!');
}

// Export the class and example function
module.exports = {
  DockerResourceLimiter,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
    .then(() => {
      console.log('\n✨ Resource limit examples completed successfully');
    })
    .catch(error => {
      console.error('❌ Examples failed:', error);
      process.exit(1);
    });
}

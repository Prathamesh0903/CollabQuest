# Docker Resource Limits and Timeouts Guide

This guide explains how to set execution timeouts and limit CPU/memory usage for code execution in Docker containers.

## 🎯 Overview

When running untrusted code in Docker containers, it's crucial to set resource limits to prevent:
- **Resource exhaustion attacks**
- **Infinite loops**
- **Memory leaks**
- **CPU hogging**
- **Denial of service**

## 📊 Resource Limit Types

### 1. **Memory Limits**
- **Container Memory**: Maximum RAM usage
- **Memory Swap**: Swap space limit
- **Kernel Memory**: Kernel memory limit
- **Memory Reservation**: Guaranteed memory

### 2. **CPU Limits**
- **CPU Period/Quota**: Precise CPU allocation
- **CPU Shares**: Relative CPU weight
- **CPU Sets**: Specific CPU cores

### 3. **Process Limits**
- **PIDs Limit**: Maximum number of processes
- **File Descriptors**: Maximum open files
- **Stack Size**: Maximum stack size

### 4. **Time Limits**
- **Execution Timeout**: Maximum execution time
- **Container Timeout**: Container cleanup timeout

## 🔧 Implementation Methods

### Method 1: Docker Run Commands

```bash
# Basic resource limits
docker run --rm \
  --memory=256m \
  --memory-swap=0 \
  --cpus=0.5 \
  --pids-limit=50 \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --network=none \
  --read-only \
  --tmpfs=/tmp:noexec,nosuid,size=100m \
  --user=nobody:nobody \
  python:3.11-alpine \
  python -c "print('Hello World')"

# Advanced resource limits
docker run --rm \
  --memory=512m \
  --memory-swap=0 \
  --memory-reservation=128m \
  --kernel-memory=128m \
  --cpus=0.25 \
  --cpu-period=100000 \
  --cpu-quota=25000 \
  --cpu-shares=512 \
  --pids-limit=100 \
  --ulimit=nofile=64:64 \
  --ulimit=nproc=50:50 \
  --ulimit=fsize=1048576:1048576 \
  --ulimit=data=268435456:268435456 \
  --ulimit=stack=8388608:8388608 \
  --ulimit=core=0:0 \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --network=none \
  --read-only \
  --tmpfs=/tmp:noexec,nosuid,size=200m \
  --user=nobody:nobody \
  node:18-alpine \
  node -e "console.log('Hello World')"
```

### Method 2: Docker Compose Configuration

```yaml
version: '3.8'
services:
  code-executor:
    image: python:3.11-alpine
    command: ["python", "-c", "print('Hello World')"]
    
    # Resource limits
    deploy:
      resources:
        limits:
          # Memory limits
          memory: 256M
          memory-swap: 0M
          
          # CPU limits
          cpus: '0.5'  # 50% of one CPU core
          
          # Process limits
          pids: 50
        
        reservations:
          # Minimum guaranteed resources
          memory: 64M
          cpus: '0.1'  # 10% of one CPU core
    
    # Security options
    security_opt:
      - no-new-privileges
    cap_drop:
      - ALL
    
    # Network isolation
    network_mode: 'none'
    
    # Read-only filesystem
    read_only: true
    
    # Temporary filesystem
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    
    # Environment variables
    environment:
      - PYTHONUNBUFFERED=1
      - PYTHONHASHSEED=random
    
    # User isolation
    user: 'nobody:nobody'
    
    # Restart policy
    restart: 'no'
```

### Method 3: Node.js Docker API

```javascript
const Docker = require('dockerode');

const docker = new Docker();

// Create container with resource limits
const containerConfig = {
  Image: 'python:3.11-alpine',
  Cmd: ['python', '-c', 'print("Hello World")'],
  Tty: false,
  OpenStdin: true,
  StdinOnce: true,
  
  HostConfig: {
    // Memory limits
    Memory: 256 * 1024 * 1024,        // 256MB
    MemorySwap: 0,                     // No swap
    KernelMemory: 128 * 1024 * 1024,  // 128MB kernel memory
    MemorySwappiness: 0,               // Disable swap
    OomKillDisable: false,             // Allow OOM killer
    
    // CPU limits
    CpuPeriod: 100000,                 // 100ms period
    CpuQuota: 50000,                   // 50% CPU (50ms per 100ms period)
    CpuShares: 512,                    // CPU weight
    
    // Process limits
    PidsLimit: 50,
    
    // Security options
    SecurityOpt: ['no-new-privileges'],
    CapDrop: ['ALL'],
    
    // Network isolation
    NetworkMode: 'none',
    
    // Filesystem security
    ReadonlyRootfs: true,
    
    // Resource limits (ulimits)
    Ulimits: [
      { Name: 'nofile', Soft: 64, Hard: 64 },
      { Name: 'nproc', Soft: 50, Hard: 50 },
      { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 },
      { Name: 'data', Soft: 256 * 1024 * 1024, Hard: 256 * 1024 * 1024 },
      { Name: 'stack', Soft: 8 * 1024 * 1024, Hard: 8 * 1024 * 1024 },
      { Name: 'core', Soft: 0, Hard: 0 },
      { Name: 'rss', Soft: 256 * 1024 * 1024, Hard: 256 * 1024 * 1024 }
    ],
    
    // Additional security
    AutoRemove: true,
    RestartPolicy: { Name: 'no' },
    
    // Cgroup configuration
    CgroupParent: 'code-exec.slice'
  },
  
  // Environment hardening
  Env: [
    'PYTHONUNBUFFERED=1',
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

// Execute with timeout
async function executeWithTimeout(containerConfig, timeoutMs = 10000) {
  let container;
  let timeoutId;

  try {
    // Create and start container
    container = await docker.createContainer(containerConfig);
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
        reject(new Error(`Execution timed out after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);
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

    return {
      success: true,
      stdout: result.stdout || '',
      stderr: result.stderr || ''
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

    return {
      success: false,
      error: error.message
    };
  }
}
```

## 📈 Resource Limit Examples

### Example 1: Lightweight Execution (Python)

```javascript
const lightLimits = {
  executionTimeout: 5000,              // 5 seconds
  maxMemory: 128 * 1024 * 1024,       // 128MB
  cpuQuota: 25000,                     // 25% CPU
  maxProcesses: 25,
  maxFiles: 32
};
```

### Example 2: Standard Execution (JavaScript)

```javascript
const standardLimits = {
  executionTimeout: 10000,             // 10 seconds
  maxMemory: 256 * 1024 * 1024,       // 256MB
  cpuQuota: 50000,                     // 50% CPU
  maxProcesses: 50,
  maxFiles: 64
};
```

### Example 3: Heavy Execution (Java)

```javascript
const heavyLimits = {
  executionTimeout: 15000,             // 15 seconds
  maxMemory: 512 * 1024 * 1024,       // 512MB
  cpuQuota: 75000,                     // 75% CPU
  maxProcesses: 100,
  maxFiles: 128
};
```

## 🔍 Resource Monitoring

### Monitor Container Resources

```javascript
// Monitor container stats
async function monitorContainer(container) {
  const stats = await container.stats({ stream: false });
  
  const memoryUsage = stats.memory_stats.usage || 0;
  const memoryLimit = stats.memory_stats.limit || 0;
  const cpuUsage = calculateCPUUsage(stats);
  
  console.log(`Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB / ${(memoryLimit / 1024 / 1024).toFixed(2)}MB`);
  console.log(`CPU: ${cpuUsage.toFixed(2)}%`);
  
  return { memoryUsage, memoryLimit, cpuUsage };
}

// Calculate CPU usage
function calculateCPUUsage(stats) {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  
  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
  }
  return 0;
}
```

### Real-time Monitoring

```javascript
// Real-time resource monitoring
async function monitorResources(container, intervalMs = 1000) {
  const monitor = setInterval(async () => {
    try {
      const stats = await container.stats({ stream: false });
      const memoryUsage = stats.memory_stats.usage || 0;
      const cpuUsage = calculateCPUUsage(stats);
      
      console.log(`Resource Usage - Memory: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB, CPU: ${cpuUsage.toFixed(2)}%`);
      
      // Check if limits are approaching
      if (memoryUsage > stats.memory_stats.limit * 0.9) {
        console.warn('⚠️  Memory usage approaching limit');
      }
      
      if (cpuUsage > 80) {
        console.warn('⚠️  CPU usage is high');
      }
    } catch (error) {
      console.error('Resource monitoring error:', error.message);
    }
  }, intervalMs);
  
  return monitor;
}
```

## 🛡️ Security Considerations

### 1. **Memory Limits**
```javascript
// Prevent memory exhaustion attacks
const memoryLimits = {
  Memory: 256 * 1024 * 1024,        // 256MB max
  MemorySwap: 0,                     // No swap
  KernelMemory: 128 * 1024 * 1024,  // Kernel memory limit
  MemorySwappiness: 0,               // Disable swap
  OomKillDisable: false              // Allow OOM killer
};
```

### 2. **CPU Limits**
```javascript
// Prevent CPU hogging
const cpuLimits = {
  CpuPeriod: 100000,                 // 100ms period
  CpuQuota: 50000,                   // 50% CPU
  CpuShares: 512,                    // CPU weight
  CpuRealtimePeriod: 0,              // Disable real-time
  CpuRealtimeRuntime: 0
};
```

### 3. **Process Limits**
```javascript
// Prevent fork bombs
const processLimits = {
  PidsLimit: 50,                     // Max processes
  Ulimits: [
    { Name: 'nproc', Soft: 50, Hard: 50 },
    { Name: 'nofile', Soft: 64, Hard: 64 }
  ]
};
```

### 4. **Time Limits**
```javascript
// Prevent infinite loops
const timeLimits = {
  executionTimeout: 10000,           // 10 seconds
  containerTimeout: 15000,           // 15 seconds (extra buffer)
  cleanupTimeout: 5000               // 5 seconds cleanup
};
```

## 📊 Performance Tuning

### Language-Specific Optimizations

#### Python
```javascript
const pythonLimits = {
  // Python-specific environment variables
  Env: [
    'PYTHONUNBUFFERED=1',
    'PYTHONHASHSEED=random',
    'PYTHONDONTWRITEBYTECODE=1',
    'PYTHONPATH=',
    'PYTHONOPTIMIZE=1'
  ],
  
  // Python-specific resource limits
  maxMemory: 256 * 1024 * 1024,      // 256MB
  cpuQuota: 50000,                   // 50% CPU
  executionTimeout: 10000            // 10 seconds
};
```

#### JavaScript (Node.js)
```javascript
const nodeLimits = {
  // Node.js-specific environment variables
  Env: [
    'NODE_OPTIONS=--max-old-space-size=128',
    'NODE_ENV=production',
    'NODE_PATH='
  ],
  
  // Node.js-specific resource limits
  maxMemory: 256 * 1024 * 1024,      // 256MB
  cpuQuota: 50000,                   // 50% CPU
  executionTimeout: 10000            // 10 seconds
};
```

#### Java
```javascript
const javaLimits = {
  // Java-specific environment variables
  Env: [
    'JAVA_OPTS=-Xmx256m -Xms64m',
    'JAVA_TOOL_OPTIONS=-XX:+UseContainerSupport',
    'JAVA_HOME=/usr/local/openjdk-17'
  ],
  
  // Java-specific resource limits (higher due to JVM overhead)
  maxMemory: 512 * 1024 * 1024,      // 512MB
  cpuQuota: 75000,                   // 75% CPU
  executionTimeout: 15000            // 15 seconds
};
```

## 🚀 Best Practices

### 1. **Start Conservative**
```javascript
// Start with strict limits
const conservativeLimits = {
  executionTimeout: 5000,            // 5 seconds
  maxMemory: 128 * 1024 * 1024,     // 128MB
  cpuQuota: 25000,                   // 25% CPU
  maxProcesses: 25
};
```

### 2. **Monitor and Adjust**
```javascript
// Monitor resource usage and adjust limits
async function adaptiveLimits(container, baseLimits) {
  const stats = await container.stats({ stream: false });
  const memoryUsage = stats.memory_stats.usage || 0;
  const cpuUsage = calculateCPUUsage(stats);
  
  // Adjust limits based on usage
  if (memoryUsage > baseLimits.maxMemory * 0.8) {
    console.log('Increasing memory limit');
    // Implement adaptive limits
  }
  
  if (cpuUsage > 70) {
    console.log('CPU usage is high, consider reducing');
    // Implement adaptive limits
  }
}
```

### 3. **Graceful Degradation**
```javascript
// Implement fallback for resource exhaustion
async function executeWithFallback(code, language, primaryLimits, fallbackLimits) {
  try {
    return await executeWithLimits(code, language, primaryLimits);
  } catch (error) {
    if (error.message.includes('memory') || error.message.includes('timeout')) {
      console.log('Primary limits exceeded, trying fallback...');
      return await executeWithLimits(code, language, fallbackLimits);
    }
    throw error;
  }
}
```

### 4. **Cleanup and Recovery**
```javascript
// Ensure proper cleanup
async function cleanupContainer(container) {
  try {
    await container.stop({ t: 0 });  // Force stop
    await container.remove();        // Remove container
  } catch (error) {
    console.error('Cleanup error:', error);
    // Implement retry logic or force removal
  }
}
```

## 📋 Checklist

- [ ] Set memory limits (container + kernel memory)
- [ ] Set CPU limits (period/quota + shares)
- [ ] Set process limits (PIDs + file descriptors)
- [ ] Set execution timeouts
- [ ] Implement resource monitoring
- [ ] Configure security options
- [ ] Set up proper cleanup
- [ ] Test with resource-intensive code
- [ ] Monitor performance impact
- [ ] Document limits and policies

## 🔧 Troubleshooting

### Common Issues

1. **Container OOM Killed**
   ```bash
   # Increase memory limit or optimize code
   --memory=512m
   ```

2. **Timeout Issues**
   ```bash
   # Increase timeout or optimize code
   --timeout=15000
   ```

3. **CPU Throttling**
   ```bash
   # Increase CPU quota
   --cpus=0.75
   ```

4. **Process Limit Exceeded**
   ```bash
   # Increase PIDs limit
   --pids-limit=100
   ```

### Debug Commands

```bash
# Check container stats
docker stats <container_id>

# Check container logs
docker logs <container_id>

# Check resource usage
docker exec <container_id> cat /sys/fs/cgroup/memory/memory.usage_in_bytes

# Check CPU usage
docker exec <container_id> cat /sys/fs/cgroup/cpu/cpu.stat
```

This comprehensive guide provides all the tools and techniques needed to implement robust resource limits for Docker-based code execution systems.

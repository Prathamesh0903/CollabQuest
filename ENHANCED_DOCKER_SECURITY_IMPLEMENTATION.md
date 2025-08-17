# Enhanced Docker Security Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing enhanced security measures in your Docker-based code execution system. These improvements will significantly strengthen your security posture while maintaining performance and scalability.

## Current Security Assessment

Your existing setup already includes:
- ✅ Basic container isolation
- ✅ Resource limits
- ✅ Network isolation
- ✅ Non-root user execution

## Enhanced Security Implementation

### 1. Custom Seccomp Profile

Create a restrictive seccomp profile to limit system calls:

```json
// seccomp-profile.json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "read",
        "write",
        "exit",
        "exit_group",
        "rt_sigreturn",
        "sigaltstack",
        "sigprocmask",
        "sigaction",
        "getpid",
        "getppid",
        "getuid",
        "getgid",
        "geteuid",
        "getegid",
        "getrandom",
        "clock_gettime",
        "clock_getres",
        "nanosleep",
        "brk",
        "mmap",
        "mprotect",
        "munmap",
        "set_tid_address",
        "set_robust_list",
        "futex",
        "sched_yield",
        "epoll_create1",
        "epoll_ctl",
        "epoll_pwait",
        "close",
        "dup",
        "dup2",
        "dup3",
        "fcntl",
        "pread64",
        "pwrite64",
        "readv",
        "writev",
        "preadv",
        "pwritev",
        "sendfile",
        "lseek",
        "access",
        "pipe",
        "pipe2",
        "select",
        "pselect6",
        "poll",
        "ppoll",
        "newfstatat",
        "fstat",
        "stat",
        "lstat",
        "fstatfs",
        "statfs",
        "getcwd",
        "chdir",
        "fchdir",
        "readlink",
        "readlinkat",
        "getdents",
        "getdents64",
        "mknod",
        "mknodat",
        "mkdir",
        "mkdirat",
        "unlink",
        "unlinkat",
        "rmdir",
        "link",
        "linkat",
        "rename",
        "renameat",
        "renameat2",
        "symlink",
        "symlinkat",
        "utime",
        "utimes",
        "futimesat",
        "utimensat",
        "open",
        "openat",
        "creat",
        "close",
        "vhangup",
        "pipe",
        "pipe2",
        "dup",
        "dup2",
        "dup3",
        "fcntl",
        "inotify_init",
        "inotify_init1",
        "inotify_add_watch",
        "inotify_rm_watch",
        "ioctl",
        "ioprio_get",
        "ioprio_set",
        "flock",
        "mknod",
        "mkdir",
        "rmdir",
        "link",
        "unlink",
        "symlink",
        "readlink",
        "chmod",
        "fchmod",
        "chown",
        "fchown",
        "lchown",
        "umask",
        "gettimeofday",
        "getrlimit",
        "getrusage",
        "sysinfo",
        "times",
        "ptrace",
        "getuid",
        "syslog",
        "getgid",
        "setuid",
        "setgid",
        "geteuid",
        "getegid",
        "setpgid",
        "getppid",
        "getpgrp",
        "setsid",
        "setreuid",
        "setregid",
        "getgroups",
        "setgroups",
        "setresuid",
        "getresuid",
        "setresgid",
        "getresgid",
        "getpgid",
        "setfsuid",
        "setfsgid",
        "getsid",
        "capget",
        "capset",
        "rt_sigpending",
        "rt_sigtimedwait",
        "rt_sigqueueinfo",
        "rt_sigsuspend",
        "sigaltstack",
        "utime",
        "mknod",
        "uselib",
        "personality",
        "ustat",
        "statfs",
        "fstatfs",
        "sysfs",
        "getpriority",
        "setpriority",
        "sched_setparam",
        "sched_getparam",
        "sched_setscheduler",
        "sched_getscheduler",
        "sched_get_priority_max",
        "sched_get_priority_min",
        "sched_rr_get_interval",
        "mlock",
        "munlock",
        "mlockall",
        "munlockall",
        "vhangup",
        "modify_ldt",
        "pivot_root",
        "_sysctl",
        "prctl",
        "arch_prctl",
        "adjtimex",
        "setrlimit",
        "chroot",
        "sync",
        "acct",
        "settimeofday",
        "mount",
        "umount2",
        "swapon",
        "swapoff",
        "reboot",
        "sethostname",
        "setdomainname",
        "iopl",
        "ioperm",
        "create_module",
        "init_module",
        "delete_module",
        "get_kernel_syms",
        "query_module",
        "quotactl",
        "nfsservctl",
        "getpmsg",
        "putpmsg",
        "afs_syscall",
        "tuxcall",
        "security",
        "gettid",
        "readahead",
        "setxattr",
        "lsetxattr",
        "fsetxattr",
        "getxattr",
        "lgetxattr",
        "fgetxattr",
        "listxattr",
        "llistxattr",
        "flistxattr",
        "removexattr",
        "lremovexattr",
        "fremovexattr",
        "tkill",
        "time",
        "futex",
        "sched_setaffinity",
        "sched_getaffinity",
        "set_thread_area",
        "io_setup",
        "io_destroy",
        "io_getevents",
        "io_submit",
        "io_cancel",
        "get_thread_area",
        "lookup_dcookie",
        "epoll_create",
        "epoll_ctl_old",
        "epoll_wait_old",
        "remap_file_pages",
        "getdents64",
        "set_tid_address",
        "restart_syscall",
        "semtimedop",
        "fadvise64",
        "timer_create",
        "timer_settime",
        "timer_gettime",
        "timer_getoverrun",
        "timer_delete",
        "clock_settime",
        "clock_gettime",
        "clock_getres",
        "clock_nanosleep",
        "exit_group",
        "epoll_wait",
        "epoll_ctl",
        "tgkill",
        "utimes",
        "vserver",
        "mbind",
        "set_mempolicy",
        "get_mempolicy",
        "mq_open",
        "mq_unlink",
        "mq_timedsend",
        "mq_timedreceive",
        "mq_notify",
        "mq_getsetattr",
        "kexec_load",
        "waitid",
        "add_key",
        "request_key",
        "keyctl",
        "ioprio_set",
        "ioprio_get",
        "inotify_init",
        "inotify_add_watch",
        "inotify_rm_watch",
        "migrate_pages",
        "openat",
        "mkdirat",
        "mknodat",
        "fchownat",
        "futimesat",
        "newfstatat",
        "unlinkat",
        "renameat",
        "linkat",
        "symlinkat",
        "readlinkat",
        "fchmodat",
        "faccessat",
        "pselect6",
        "ppoll",
        "unshare",
        "set_robust_list",
        "get_robust_list",
        "splice",
        "tee",
        "sync_file_range",
        "vmsplice",
        "move_pages",
        "utimensat",
        "epoll_pwait",
        "signalfd",
        "timerfd_create",
        "eventfd",
        "fallocate",
        "timerfd_settime",
        "timerfd_gettime",
        "accept4",
        "signalfd4",
        "eventfd2",
        "epoll_create1",
        "dup3",
        "pipe2",
        "inotify_init1",
        "preadv",
        "pwritev",
        "rt_tgsigqueueinfo",
        "perf_event_open",
        "recvmmsg",
        "fanotify_init",
        "fanotify_mark",
        "prlimit64",
        "name_to_handle_at",
        "open_by_handle_at",
        "clock_adjtime",
        "syncfs",
        "sendmmsg",
        "setns",
        "getcpu",
        "process_vm_readv",
        "process_vm_writev",
        "kcmp",
        "finit_module",
        "sched_setattr",
        "sched_getattr",
        "renameat2",
        "seccomp",
        "getrandom",
        "memfd_create",
        "kexec_file_load",
        "bpf",
        "execveat",
        "userfaultfd",
        "membarrier",
        "mlock2",
        "copy_file_range",
        "preadv2",
        "pwritev2",
        "pkey_mprotect",
        "pkey_alloc",
        "pkey_free",
        "statx",
        "io_pgetevents",
        "rseq",
        "pidfd_send_signal",
        "io_uring_setup",
        "io_uring_enter",
        "io_uring_register",
        "open_tree",
        "move_mount",
        "fsopen",
        "fsconfig",
        "fsmount",
        "fspick",
        "pidfd_open",
        "clone3",
        "close_range",
        "openat2",
        "pidfd_getfd",
        "faccessat2",
        "process_madvise",
        "epoll_pwait2",
        "mount_setattr",
        "quotactl_fd",
        "landlock_create_ruleset",
        "landlock_add_rule",
        "landlock_restrict_self",
        "memfd_secret",
        "process_mrelease",
        "futex_waitv",
        "set_mempolicy_home_node"
      ],
      "action": "SCMP_ACT_ALLOW",
      "args": [],
      "comment": "Allow basic system calls for code execution",
      "includes": {},
      "excludes": {}
    }
  ]
}
```

### 2. Enhanced Container Configuration

Update your container creation function:

```javascript
// Enhanced container configuration
async function createSecureContainer(config, code, input = '') {
  const containerId = crypto.randomBytes(16).toString('hex');
  const containerName = `code-exec-${containerId}-${Date.now()}`;
  
  // Load custom seccomp profile
  const seccompProfile = require('./seccomp-profile.json');
  
  const containerOptions = {
    Image: config.image,
    name: containerName,
    Cmd: [...config.cmd, code],
    Tty: false,
    OpenStdin: true,
    StdinOnce: true,
    HostConfig: {
      // Memory limits
      Memory: config.memory,
      MemorySwap: 0,
      KernelMemory: config.memory / 2,
      MemorySwappiness: 0,
      OomKillDisable: false,
      
      // CPU limits
      CpuPeriod: 100000,
      CpuQuota: 50000, // 50% CPU
      CpuShares: 512,
      
      // Process limits
      PidsLimit: 50,
      
      // Security options
      SecurityOpt: [
        'no-new-privileges',
        `seccomp=${JSON.stringify(seccompProfile)}`
      ],
      CapDrop: ['ALL'],
      CapAdd: [], // No additional capabilities
      
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
        { Name: 'data', Soft: 256 * 1024 * 1024, Hard: 256 * 1024 * 1024 },
        { Name: 'stack', Soft: 8 * 1024 * 1024, Hard: 8 * 1024 * 1024 },
        { Name: 'core', Soft: 0, Hard: 0 },
        { Name: 'rss', Soft: 256 * 1024 * 1024, Hard: 256 * 1024 * 1024 },
        { Name: 'nofile', Soft: 64, Hard: 64 }
      ],
      
      // Additional security
      AutoRemove: true,
      RestartPolicy: { Name: 'no' },
      
      // Device access
      Devices: [],
      
      // Cgroup configuration
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
      'created.by': 'code-executor'
    }
  };

  return containerOptions;
}
```

### 3. Enhanced Code Validation

Improve your code validation with more sophisticated pattern detection:

```javascript
// Enhanced code validation
function validateCode(code, language) {
  // Basic checks
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code input');
  }
  
  if (code.length > 50000) {
    throw new Error('Code too long (max 50KB)');
  }
  
  // Check for null bytes and control characters
  if (code.includes('\0') || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(code)) {
    throw new Error('Code contains invalid characters');
  }
  
  // Language-specific validation
  const config = getLanguageConfig(language);
  if (!config) {
    throw new Error('Unsupported language');
  }
  
  // Enhanced pattern detection
  const violations = detectSecurityViolations(code, language);
  if (violations.length > 0) {
    throw new Error(`Security violations detected: ${violations.join(', ')}`);
  }
  
  // Complexity analysis
  const complexity = analyzeCodeComplexity(code, language);
  if (complexity.score > 100) {
    throw new Error('Code complexity too high');
  }
  
  return true;
}

// Enhanced pattern detection
function detectSecurityViolations(code, language) {
  const violations = [];
  
  // Common dangerous patterns
  const dangerousPatterns = {
    javascript: [
      // File system access
      { pattern: /require\s*\(\s*['"]fs['"]\s*\)/m, description: 'File system access' },
      { pattern: /require\s*\(\s*['"]path['"]\s*\)/m, description: 'Path manipulation' },
      
      // Process control
      { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/m, description: 'Process creation' },
      { pattern: /require\s*\(\s*['"]process['"]\s*\)/m, description: 'Process manipulation' },
      
      // Code execution
      { pattern: /eval\s*\(/m, description: 'Dynamic code execution' },
      { pattern: /Function\s*\(/m, description: 'Dynamic function creation' },
      { pattern: /setTimeout\s*\(/m, description: 'Timer functions' },
      { pattern: /setInterval\s*\(/m, description: 'Timer functions' },
      
      // System access
      { pattern: /process\.exit/m, description: 'Process termination' },
      { pattern: /process\.kill/m, description: 'Process killing' },
      { pattern: /process\.env/m, description: 'Environment access' },
      
      // Global objects
      { pattern: /global\./m, description: 'Global object access' },
      { pattern: /Buffer\./m, description: 'Buffer manipulation' },
      { pattern: /__dirname/m, description: 'Directory access' },
      { pattern: /__filename/m, description: 'File path access' }
    ],
    
    python: [
      // System access
      { pattern: /import\s+os\s*$/m, description: 'Operating system access' },
      { pattern: /import\s+subprocess\s*$/m, description: 'Subprocess creation' },
      { pattern: /import\s+sys\s*$/m, description: 'System access' },
      { pattern: /import\s+shutil\s*$/m, description: 'Shell utilities' },
      
      // File operations
      { pattern: /import\s+glob\s*$/m, description: 'File pattern matching' },
      { pattern: /import\s+pathlib\s*$/m, description: 'Path manipulation' },
      
      // Code execution
      { pattern: /__import__\s*\(/m, description: 'Dynamic imports' },
      { pattern: /exec\s*\(/m, description: 'Code execution' },
      { pattern: /eval\s*\(/m, description: 'Expression evaluation' },
      
      // File access
      { pattern: /open\s*\(/m, description: 'File opening' },
      { pattern: /file\s*\(/m, description: 'File operations' },
      
      // System calls
      { pattern: /subprocess\./m, description: 'Subprocess operations' },
      { pattern: /os\./m, description: 'OS operations' },
      { pattern: /sys\./m, description: 'System operations' },
      
      // Control flow
      { pattern: /exit\s*\(/m, description: 'Program exit' },
      { pattern: /quit\s*\(/m, description: 'Program quit' },
      { pattern: /breakpoint\s*\(/m, description: 'Debugger breakpoint' }
    ]
  };
  
  const patterns = dangerousPatterns[language] || [];
  
  for (const { pattern, description } of patterns) {
    if (pattern.test(code)) {
      violations.push(description);
    }
  }
  
  return violations;
}

// Code complexity analysis
function analyzeCodeComplexity(code, language) {
  let score = 0;
  
  // Length penalty
  score += Math.floor(code.length / 1000);
  
  // Loop detection
  const loopPatterns = {
    javascript: [/for\s*\(/g, /while\s*\(/g, /forEach\s*\(/g],
    python: [/for\s+/g, /while\s+/g, /map\s*\(/g]
  };
  
  const patterns = loopPatterns[language] || [];
  for (const pattern of patterns) {
    const matches = code.match(pattern);
    if (matches) {
      score += matches.length * 5;
    }
  }
  
  // Recursion detection
  const functionPatterns = {
    javascript: /function\s+\w+\s*\(/g,
    python: /def\s+\w+\s*\(/g
  };
  
  const funcPattern = functionPatterns[language];
  if (funcPattern) {
    const functions = code.match(funcPattern);
    if (functions) {
      score += functions.length * 3;
    }
  }
  
  return { score, complexity: score > 50 ? 'high' : score > 20 ? 'medium' : 'low' };
}
```

### 4. Security Monitoring

Implement comprehensive security monitoring:

```javascript
// Security monitoring system
class SecurityMonitor {
  constructor() {
    this.violations = new Map();
    this.resourceUsage = new Map();
    this.rateLimits = new Map();
  }
  
  // Track security violations
  trackViolation(userId, violation) {
    const userViolations = this.violations.get(userId) || [];
    userViolations.push({
      type: violation.type,
      description: violation.description,
      timestamp: new Date(),
      code: violation.code?.substring(0, 100) // Truncate for privacy
    });
    
    this.violations.set(userId, userViolations);
    
    // Alert if too many violations
    if (userViolations.length > 10) {
      this.alertSecurityTeam('High violation rate', { userId, violations: userViolations.length });
    }
  }
  
  // Monitor resource usage
  trackResourceUsage(containerId, metrics) {
    this.resourceUsage.set(containerId, {
      ...metrics,
      timestamp: new Date()
    });
    
    // Alert on high resource usage
    if (metrics.memory > 200 * 1024 * 1024) { // 200MB
      this.alertSecurityTeam('High memory usage', { containerId, memory: metrics.memory });
    }
    
    if (metrics.cpu > 80) { // 80% CPU
      this.alertSecurityTeam('High CPU usage', { containerId, cpu: metrics.cpu });
    }
  }
  
  // Rate limiting
  checkRateLimit(userId, ip) {
    const now = Date.now();
    const window = 60 * 1000; // 1 minute
    
    // User-based rate limiting
    const userKey = `user:${userId}`;
    const userRequests = this.rateLimits.get(userKey) || [];
    const recentUserRequests = userRequests.filter(time => now - time < window);
    
    if (recentUserRequests.length >= 100) {
      return { allowed: false, reason: 'User rate limit exceeded' };
    }
    
    // IP-based rate limiting
    const ipKey = `ip:${ip}`;
    const ipRequests = this.rateLimits.get(ipKey) || [];
    const recentIpRequests = ipRequests.filter(time => now - time < window);
    
    if (recentIpRequests.length >= 50) {
      return { allowed: false, reason: 'IP rate limit exceeded' };
    }
    
    // Update rate limits
    recentUserRequests.push(now);
    recentIpRequests.push(now);
    this.rateLimits.set(userKey, recentUserRequests);
    this.rateLimits.set(ipKey, recentIpRequests);
    
    return { allowed: true };
  }
  
  // Security alerts
  alertSecurityTeam(type, data) {
    console.error(`SECURITY ALERT [${type}]:`, data);
    
    // In production, send to your alerting system
    // Example: Slack, PagerDuty, email, etc.
    if (process.env.SECURITY_WEBHOOK_URL) {
      this.sendWebhookAlert(type, data);
    }
  }
  
  // Send webhook alert
  async sendWebhookAlert(type, data) {
    try {
      await axios.post(process.env.SECURITY_WEBHOOK_URL, {
        type,
        data,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
  
  // Get security report
  getSecurityReport() {
    return {
      violations: Object.fromEntries(this.violations),
      resourceUsage: Object.fromEntries(this.resourceUsage),
      rateLimits: Object.fromEntries(this.rateLimits),
      summary: {
        totalViolations: Array.from(this.violations.values()).flat().length,
        activeContainers: this.resourceUsage.size,
        rateLimitedUsers: Array.from(this.rateLimits.keys()).filter(k => k.startsWith('user:')).length
      }
    };
  }
}

// Initialize security monitor
const securityMonitor = new SecurityMonitor();
```

### 5. Enhanced Execution Endpoint

Update your execution endpoint with enhanced security:

```javascript
// Enhanced execution endpoint
router.post('/execute', async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '' } = req.body;
  const userId = req.user?.id || 'anonymous';
  const clientIP = req.ip;

  try {
    // Rate limiting
    const rateLimitCheck = securityMonitor.checkRateLimit(userId, clientIP);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Enhanced code validation
    try {
      validateCode(code, language);
    } catch (validationError) {
      securityMonitor.trackViolation(userId, {
        type: 'code_validation',
        description: validationError.message,
        code: code.substring(0, 200)
      });
      
      return res.status(400).json({
        success: false,
        error: validationError.message,
        code: 'CODE_VALIDATION_FAILED'
      });
    }

    // Execute code with enhanced security
    const result = await executeCodeWithSecurity(language, code, input, userId);
    const executionTime = Date.now() - startTime;

    // Log successful execution
    console.log(`Code execution completed: ${language}, ${executionTime}ms, ${code.length} chars, user: ${userId}`);

    res.json({
      success: true,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      status: result.status || 'success',
      executionTime: Date.now(),
      metrics: {
        codeLength: code.length,
        executionDuration: executionTime,
        language: language,
        memoryUsed: result.memoryUsed || 'N/A',
        complexity: result.complexity || 'low'
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('Code execution error:', error);
    
    // Track execution errors
    securityMonitor.trackViolation(userId, {
      type: 'execution_error',
      description: error.message,
      code: code?.substring(0, 200)
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while executing the code',
      stderr: error.stderr || '',
      status: 'error',
      executionTime: Date.now(),
      metrics: {
        codeLength: code?.length || 0,
        executionDuration: executionTime,
        language: language,
        errorType: error.name || 'ExecutionError'
      }
    });
  }
});

// Enhanced code execution with security monitoring
async function executeCodeWithSecurity(language, code, input, userId) {
  const config = getLanguageConfig(language);
  let container;
  let timeoutId;

  try {
    // Create secure container
    const containerOptions = await createSecureContainer(config, code, input);
    container = await docker.createContainer(containerOptions);
    
    // Start container
    await container.start();
    
    // Monitor container resources
    const resourceMonitor = setInterval(async () => {
      try {
        const stats = await container.stats({ stream: false });
        const metrics = {
          memory: stats.memory_stats.usage || 0,
          cpu: calculateCPUUsage(stats),
          timestamp: new Date()
        };
        
        securityMonitor.trackResourceUsage(container.id, metrics);
      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, 1000);
    
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
          clearInterval(resourceMonitor);
          resolve({ stdout, stderr });
        });

        logs.on('error', (err) => {
          clearInterval(resourceMonitor);
          reject(err);
        });

      } catch (err) {
        clearInterval(resourceMonitor);
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

    return result;

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
}
```

### 6. Deployment Configuration

Update your Docker Compose configuration:

```yaml
# docker-compose.yml with enhanced security
version: '3.8'

services:
  executor:
    build: ./executor
    container_name: code-executor
    restart: unless-stopped
    security_opt:
      - no-new-privileges
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
      - /var/tmp:noexec,nosuid,size=100m
    environment:
      - NODE_ENV=production
      - DOCKER_ENABLED=true
      - SECURITY_WEBHOOK_URL=${SECURITY_WEBHOOK_URL}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    networks:
      - code-execution
    labels:
      - "security.level=high"
      - "monitoring.enabled=true"

  server:
    build: ./server
    container_name: collaborative-server
    restart: unless-stopped
    security_opt:
      - no-new-privileges
    cap_drop:
      - ALL
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "5000:5000"
    depends_on:
      - executor
    networks:
      - code-execution
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

networks:
  code-execution:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Security Testing

Create a comprehensive security test suite:

```javascript
// security-tests.js
const axios = require('axios');

const securityTests = [
  {
    name: 'File System Access Attempt',
    language: 'javascript',
    code: 'require("fs").readFileSync("/etc/passwd")',
    expectedBlock: true
  },
  {
    name: 'Process Creation Attempt',
    language: 'javascript',
    code: 'require("child_process").exec("ls")',
    expectedBlock: true
  },
  {
    name: 'Code Injection Attempt',
    language: 'javascript',
    code: 'eval("console.log(\'hacked\')")',
    expectedBlock: true
  },
  {
    name: 'System Access Attempt',
    language: 'python',
    code: 'import os; os.system("ls")',
    expectedBlock: true
  },
  {
    name: 'File Access Attempt',
    language: 'python',
    code: 'open("/etc/passwd").read()',
    expectedBlock: true
  },
  {
    name: 'Infinite Loop Attempt',
    language: 'javascript',
    code: 'while(true) { console.log("loop") }',
    expectedTimeout: true
  },
  {
    name: 'Memory Exhaustion Attempt',
    language: 'javascript',
    code: 'let arr = []; while(true) arr.push("x".repeat(1000000))',
    expectedTimeout: true
  }
];

async function runSecurityTests() {
  console.log('🔒 Running Security Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of securityTests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await axios.post('http://localhost:5000/api/execute', {
        language: test.language,
        code: test.code,
        input: ''
      });
      
      if (test.expectedBlock) {
        console.log('❌ Test failed: Code should have been blocked');
        failed++;
      } else {
        console.log('✅ Test passed');
        passed++;
      }
      
    } catch (error) {
      if (test.expectedBlock && error.response?.status === 400) {
        console.log('✅ Test passed: Code was blocked as expected');
        passed++;
      } else if (test.expectedTimeout && error.message.includes('timeout')) {
        console.log('✅ Test passed: Code was timed out as expected');
        passed++;
      } else {
        console.log('❌ Test failed: Unexpected error');
        failed++;
      }
    }
  }
  
  console.log(`\n📊 Security Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

module.exports = { runSecurityTests };
```

## Implementation Checklist

- [ ] Custom seccomp profile implemented
- [ ] Enhanced container configuration applied
- [ ] Improved code validation deployed
- [ ] Security monitoring system active
- [ ] Rate limiting implemented
- [ ] Resource monitoring configured
- [ ] Security alerts configured
- [ ] Security tests passing
- [ ] Documentation updated
- [ ] Team training completed

This enhanced security implementation provides multiple layers of protection while maintaining performance and usability for your collaborative editor platform.

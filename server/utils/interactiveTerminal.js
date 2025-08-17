const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

// Store active terminal sessions
const terminalSessions = new Map();

// Terminal configuration
const TERMINAL_CONFIG = {
  shell: os.platform() === 'win32' ? 'powershell.exe' : 'bash',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME || process.env.USERPROFILE || '/tmp',
  env: process.env,
  name: 'xterm-color',
  handleFlowControlPaste: true
};

// Security: Allowed commands and directories
const SECURITY_CONFIG = {
  allowedCommands: [
    'ls', 'pwd', 'cd', 'cat', 'echo', 'grep', 'find', 'head', 'tail',
    'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'chmod', 'chown',
    'ps', 'top', 'htop', 'df', 'du', 'free', 'whoami', 'id',
    'git', 'npm', 'node', 'python', 'python3', 'pip', 'pip3',
    'gcc', 'g++', 'make', 'cmake', 'docker', 'docker-compose',
    'curl', 'wget', 'ssh', 'scp', 'rsync', 'tar', 'zip', 'unzip',
    'vim', 'nano', 'emacs', 'less', 'more', 'man', 'help'
  ],
  blockedCommands: [
    'sudo', 'su', 'passwd', 'useradd', 'userdel', 'usermod',
    'chroot', 'mount', 'umount', 'fdisk', 'mkfs', 'dd',
    'shutdown', 'reboot', 'halt', 'poweroff', 'init',
    'systemctl', 'service', 'iptables', 'ufw', 'firewall-cmd'
  ],
  allowedDirectories: [
    '/tmp', '/var/tmp', '/home', '/usr/local', '/opt',
    process.env.HOME, process.env.USERPROFILE
  ],
  maxOutputSize: 1024 * 1024, // 1MB
  maxCommandLength: 1000,
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
};

class InteractiveTerminal {
  constructor(sessionId, userId, socket) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.socket = socket;
    this.ptyProcess = null;
    this.isActive = false;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.outputBuffer = '';
    this.commandHistory = [];
    this.currentDirectory = TERMINAL_CONFIG.cwd;
    
    // Security tracking
    this.blockedCommandsCount = 0;
    this.suspiciousActivity = [];
  }

  async initialize() {
    try {
      console.log(`Initializing terminal session ${this.sessionId} for user ${this.userId}`);

      // Create pseudo-terminal process
      this.ptyProcess = pty.spawn(TERMINAL_CONFIG.shell, [], {
        name: TERMINAL_CONFIG.name,
        cols: TERMINAL_CONFIG.cols,
        rows: TERMINAL_CONFIG.rows,
        cwd: this.currentDirectory,
        env: {
          ...TERMINAL_CONFIG.env,
          TERM: TERMINAL_CONFIG.name,
          COLORTERM: 'truecolor',
          PROMPT_COMMAND: 'echo -n "\\033]0;${PWD}\\007"',
          PS1: '\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
        },
        handleFlowControlPaste: TERMINAL_CONFIG.handleFlowControlPaste
      });

      this.isActive = true;

      // Set up event handlers
      this.setupEventHandlers();

      // Send initial terminal data
      this.socket.emit('terminal-ready', {
        sessionId: this.sessionId,
        cols: TERMINAL_CONFIG.cols,
        rows: TERMINAL_CONFIG.rows,
        shell: TERMINAL_CONFIG.shell
      });

      console.log(`Terminal session ${this.sessionId} initialized successfully`);
      return true;

    } catch (error) {
      console.error(`Failed to initialize terminal session ${this.sessionId}:`, error);
      this.socket.emit('terminal-error', {
        message: 'Failed to initialize terminal',
        error: error.message
      });
      return false;
    }
  }

  setupEventHandlers() {
    // Handle terminal input from client
    this.socket.on('terminal-input', (data) => {
      this.handleInput(data);
    });

    // Handle terminal resize
    this.socket.on('terminal-resize', (data) => {
      this.handleResize(data);
    });

    // Handle terminal data from pty
    this.ptyProcess.onData((data) => {
      this.handleOutput(data);
    });

    // Handle terminal exit
    this.ptyProcess.onExit((exitCode, signal) => {
      this.handleExit(exitCode, signal);
    });

    // Handle socket disconnect
    this.socket.on('disconnect', () => {
      this.cleanup();
    });

    // Handle session timeout
    setTimeout(() => {
      if (this.isActive) {
        this.handleTimeout();
      }
    }, SECURITY_CONFIG.sessionTimeout);
  }

  handleInput(data) {
    if (!this.isActive || !this.ptyProcess) {
      return;
    }

    try {
      const { input, type = 'data' } = data;
      
      // Update last activity
      this.lastActivity = new Date();

      // Security validation for commands
      if (type === 'command') {
        const isValid = this.validateCommand(input);
        if (!isValid.allowed) {
          this.socket.emit('terminal-error', {
            message: `Command blocked: ${isValid.reason}`,
            command: input
          });
          this.trackSuspiciousActivity('blocked_command', input);
          return;
        }
      }

      // Send input to pty process
      this.ptyProcess.write(input);

      // Track command history
      if (type === 'command' && input.trim()) {
        this.commandHistory.push({
          command: input.trim(),
          timestamp: new Date(),
          directory: this.currentDirectory
        });

        // Keep only last 100 commands
        if (this.commandHistory.length > 100) {
          this.commandHistory = this.commandHistory.slice(-100);
        }
      }

    } catch (error) {
      console.error(`Error handling terminal input for session ${this.sessionId}:`, error);
      this.socket.emit('terminal-error', {
        message: 'Error processing input',
        error: error.message
      });
    }
  }

  handleOutput(data) {
    if (!this.isActive) {
      return;
    }

    try {
      // Buffer output to prevent memory issues
      this.outputBuffer += data;
      
      if (this.outputBuffer.length > SECURITY_CONFIG.maxOutputSize) {
        this.outputBuffer = this.outputBuffer.slice(-SECURITY_CONFIG.maxOutputSize / 2);
      }

      // Send output to client
      this.socket.emit('terminal-output', {
        sessionId: this.sessionId,
        data: data,
        timestamp: new Date()
      });

      // Update current directory if possible
      this.updateCurrentDirectory(data);

    } catch (error) {
      console.error(`Error handling terminal output for session ${this.sessionId}:`, error);
    }
  }

  handleResize(data) {
    if (!this.isActive || !this.ptyProcess) {
      return;
    }

    try {
      const { cols, rows } = data;
      
      // Validate resize dimensions
      if (cols < 10 || cols > 200 || rows < 5 || rows > 100) {
        this.socket.emit('terminal-error', {
          message: 'Invalid terminal dimensions'
        });
        return;
      }

      this.ptyProcess.resize(cols, rows);
      
      this.socket.emit('terminal-resized', {
        sessionId: this.sessionId,
        cols: cols,
        rows: rows
      });

    } catch (error) {
      console.error(`Error resizing terminal for session ${this.sessionId}:`, error);
    }
  }

  handleExit(exitCode, signal) {
    console.log(`Terminal session ${this.sessionId} exited with code ${exitCode}, signal ${signal}`);
    
    this.isActive = false;
    
    this.socket.emit('terminal-exit', {
      sessionId: this.sessionId,
      exitCode: exitCode,
      signal: signal,
      message: signal ? `Terminal killed by signal: ${signal}` : `Terminal exited with code: ${exitCode}`
    });

    this.cleanup();
  }

  handleTimeout() {
    console.log(`Terminal session ${this.sessionId} timed out`);
    
    this.isActive = false;
    
    this.socket.emit('terminal-timeout', {
      sessionId: this.sessionId,
      message: 'Terminal session timed out due to inactivity'
    });

    this.cleanup();
  }

  validateCommand(command) {
    const trimmedCommand = command.trim();
    
    // Check command length
    if (trimmedCommand.length > SECURITY_CONFIG.maxCommandLength) {
      return {
        allowed: false,
        reason: 'Command too long'
      };
    }

    // Extract base command (first word)
    const baseCommand = trimmedCommand.split(' ')[0].toLowerCase();
    
    // Check blocked commands
    if (SECURITY_CONFIG.blockedCommands.includes(baseCommand)) {
      return {
        allowed: false,
        reason: `Command '${baseCommand}' is not allowed`
      };
    }

    // Check allowed commands (if not in allowed list, block)
    if (!SECURITY_CONFIG.allowedCommands.includes(baseCommand)) {
      return {
        allowed: false,
        reason: `Command '${baseCommand}' is not in allowed list`
      };
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /[;&|`$(){}[\]]/, // Shell metacharacters
      />\s*\/dev\/null/, // Output redirection to /dev/null
      /2>&1/, // Error redirection
      /sudo\s/, // Sudo usage
      /rm\s+-rf/, // Dangerous rm
      /dd\s+if=/, // Dangerous dd
      /mkfs/, // Filesystem operations
      /mount/, // Mount operations
      /chroot/, // Chroot operations
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmedCommand)) {
        return {
          allowed: false,
          reason: `Command contains dangerous pattern: ${pattern.source}`
        };
      }
    }

    return { allowed: true };
  }

  async updateCurrentDirectory(output) {
    try {
      // Try to extract current directory from prompt or pwd output
      const pwdMatch = output.match(/PWD=([^\s]+)/);
      if (pwdMatch) {
        this.currentDirectory = pwdMatch[1];
      }
    } catch (error) {
      // Ignore errors in directory tracking
    }
  }

  trackSuspiciousActivity(type, data) {
    this.suspiciousActivity.push({
      type: type,
      data: data,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId
    });

    // Keep only last 50 suspicious activities
    if (this.suspiciousActivity.length > 50) {
      this.suspiciousActivity = this.suspiciousActivity.slice(-50);
    }

    // Log suspicious activity
    console.warn(`Suspicious activity in terminal session ${this.sessionId}:`, {
      type: type,
      data: data,
      userId: this.userId
    });
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      currentDirectory: this.currentDirectory,
      commandHistoryLength: this.commandHistory.length,
      blockedCommandsCount: this.blockedCommandsCount,
      suspiciousActivityCount: this.suspiciousActivity.length
    };
  }

  async executeCommand(command) {
    if (!this.isActive || !this.ptyProcess) {
      throw new Error('Terminal not active');
    }

    const validation = this.validateCommand(command);
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command execution timeout'));
      }, 30000); // 30 second timeout

      let output = '';
      
      const dataHandler = (data) => {
        output += data;
      };

      const exitHandler = (exitCode, signal) => {
        clearTimeout(timeout);
        this.ptyProcess.off('data', dataHandler);
        this.ptyProcess.off('exit', exitHandler);
        
        if (exitCode === 0) {
          resolve({ output, exitCode, signal });
        } else {
          reject(new Error(`Command failed with exit code ${exitCode}`));
        }
      };

      this.ptyProcess.on('data', dataHandler);
      this.ptyProcess.on('exit', exitHandler);
      
      this.ptyProcess.write(command + '\n');
    });
  }

  cleanup() {
    try {
      if (this.ptyProcess) {
        this.ptyProcess.kill();
        this.ptyProcess = null;
      }
      
      this.isActive = false;
      
      // Remove from sessions map
      terminalSessions.delete(this.sessionId);
      
      console.log(`Terminal session ${this.sessionId} cleaned up`);
      
    } catch (error) {
      console.error(`Error cleaning up terminal session ${this.sessionId}:`, error);
    }
  }
}

// Terminal session management
class TerminalManager {
  constructor() {
    this.sessions = new Map();
    this.sessionCounter = 0;
  }

  createSession(userId, socket) {
    const sessionId = `terminal_${Date.now()}_${++this.sessionCounter}`;
    const terminal = new InteractiveTerminal(sessionId, userId, socket);
    
    this.sessions.set(sessionId, terminal);
    terminalSessions.set(sessionId, terminal);
    
    return terminal;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(terminal => terminal.getSessionInfo());
  }

  getActiveSessions() {
    return Array.from(this.sessions.values())
      .filter(terminal => terminal.isActive)
      .map(terminal => terminal.getSessionInfo());
  }

  async cleanupInactiveSessions() {
    const now = new Date();
    const inactiveSessions = [];

    for (const [sessionId, terminal] of this.sessions.entries()) {
      const timeSinceActivity = now - terminal.lastActivity;
      
      if (timeSinceActivity > SECURITY_CONFIG.sessionTimeout) {
        inactiveSessions.push(sessionId);
      }
    }

    for (const sessionId of inactiveSessions) {
      const terminal = this.sessions.get(sessionId);
      if (terminal) {
        terminal.cleanup();
      }
    }

    return inactiveSessions.length;
  }

  getSessionStats() {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(t => t.isActive).length;
    const totalBlockedCommands = Array.from(this.sessions.values())
      .reduce((sum, t) => sum + t.blockedCommandsCount, 0);
    const totalSuspiciousActivity = Array.from(this.sessions.values())
      .reduce((sum, t) => sum + t.suspiciousActivity.length, 0);

    return {
      totalSessions,
      activeSessions,
      totalBlockedCommands,
      totalSuspiciousActivity,
      maxSessions: 100, // Configurable limit
      sessionTimeout: SECURITY_CONFIG.sessionTimeout
    };
  }
}

// Create global terminal manager instance
const terminalManager = new TerminalManager();

// Socket.IO event handlers for interactive terminals
const handleInteractiveTerminal = (socket, io) => {
  console.log(`Setting up interactive terminal for user: ${socket.user?.displayName || 'Unknown'}`);

  // Create new terminal session
  socket.on('create-terminal', async (data) => {
    try {
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const terminal = terminalManager.createSession(socket.user._id.toString(), socket);
      const success = await terminal.initialize();

      if (success) {
        socket.emit('terminal-created', {
          sessionId: terminal.sessionId,
          message: 'Terminal session created successfully'
        });

        // Join terminal room for broadcasting
        socket.join(`terminal:${terminal.sessionId}`);
      }

    } catch (error) {
      console.error('Error creating terminal session:', error);
      socket.emit('terminal-error', {
        message: 'Failed to create terminal session',
        error: error.message
      });
    }
  });

  // Join existing terminal session
  socket.on('join-terminal', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const terminal = terminalManager.getSession(sessionId);
      if (!terminal) {
        socket.emit('terminal-error', { message: 'Terminal session not found' });
        return;
      }

      // Join terminal room
      socket.join(`terminal:${sessionId}`);
      
      socket.emit('terminal-joined', {
        sessionId: sessionId,
        message: 'Joined terminal session successfully'
      });

    } catch (error) {
      console.error('Error joining terminal session:', error);
      socket.emit('terminal-error', {
        message: 'Failed to join terminal session',
        error: error.message
      });
    }
  });

  // Execute command in terminal
  socket.on('execute-command', async (data) => {
    try {
      const { sessionId, command } = data;
      
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const terminal = terminalManager.getSession(sessionId);
      if (!terminal) {
        socket.emit('terminal-error', { message: 'Terminal session not found' });
        return;
      }

      const result = await terminal.executeCommand(command);
      
      socket.emit('command-result', {
        sessionId: sessionId,
        command: command,
        result: result
      });

    } catch (error) {
      console.error('Error executing command:', error);
      socket.emit('terminal-error', {
        message: 'Failed to execute command',
        error: error.message
      });
    }
  });

  // Get terminal session info
  socket.on('get-terminal-info', (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const terminal = terminalManager.getSession(sessionId);
      if (!terminal) {
        socket.emit('terminal-error', { message: 'Terminal session not found' });
        return;
      }

      socket.emit('terminal-info', {
        sessionId: sessionId,
        info: terminal.getSessionInfo()
      });

    } catch (error) {
      console.error('Error getting terminal info:', error);
      socket.emit('terminal-error', {
        message: 'Failed to get terminal info',
        error: error.message
      });
    }
  });

  // Get all user's terminal sessions
  socket.on('get-user-terminals', () => {
    try {
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const userSessions = Array.from(terminalManager.sessions.values())
        .filter(terminal => terminal.userId === socket.user._id.toString())
        .map(terminal => terminal.getSessionInfo());

      socket.emit('user-terminals', {
        sessions: userSessions
      });

    } catch (error) {
      console.error('Error getting user terminals:', error);
      socket.emit('terminal-error', {
        message: 'Failed to get user terminals',
        error: error.message
      });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    // Cleanup user's terminal sessions
    for (const [sessionId, terminal] of terminalManager.sessions.entries()) {
      if (terminal.userId === socket.user?._id?.toString()) {
        terminal.cleanup();
      }
    }
  });
};

// Periodic cleanup of inactive sessions
setInterval(async () => {
  try {
    const cleanedCount = await terminalManager.cleanupInactiveSessions();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} inactive terminal sessions`);
    }
  } catch (error) {
    console.error('Error during terminal session cleanup:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  handleInteractiveTerminal,
  terminalManager,
  InteractiveTerminal,
  SECURITY_CONFIG,
  TERMINAL_CONFIG
};

const pty = require('node-pty');
const os = require('os');
const crypto = require('crypto');

/**
 * Enhanced Interactive Terminal Implementation
 * Demonstrates node-pty with xterm.js communication over WebSockets
 */

// Configuration
const TERMINAL_CONFIG = {
  shell: os.platform() === 'win32' ? 'powershell.exe' : 'bash',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME || process.env.USERPROFILE || '/tmp',
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor'
  },
  name: 'xterm-256color',
  handleFlowControlPaste: true,
  maxOutputBuffer: 1024 * 1024,
  sessionTimeout: 30 * 60 * 1000
};

// Security configuration
const SECURITY_CONFIG = {
  allowedCommands: [
    'ls', 'pwd', 'cd', 'cat', 'echo', 'grep', 'find', 'head', 'tail',
    'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'chmod', 'chown',
    'ps', 'top', 'df', 'du', 'whoami', 'id', 'git', 'npm', 'node',
    'python', 'python3', 'curl', 'wget', 'tar', 'zip', 'unzip',
    'vim', 'nano', 'less', 'more', 'man', 'help'
  ],
  blockedCommands: [
    'sudo', 'su', 'passwd', 'shutdown', 'reboot', 'mount', 'umount',
    'fdisk', 'mkfs', 'dd', 'systemctl', 'iptables', 'chroot'
  ],
  dangerousPatterns: [
    /[;&|`$(){}[\]]/, />\s*\/dev\/null/, /2>&1/, /sudo\s/, /rm\s+-rf/
  ]
};

/**
 * Enhanced Terminal Session Class
 */
class EnhancedTerminalSession {
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
    this.blockedCommandsCount = 0;
    this.cleanupTimer = null;
  }

  async initialize() {
    try {
      console.log(`Initializing enhanced terminal session ${this.sessionId}`);
      
      // Create pseudo-terminal process
      this.ptyProcess = pty.spawn(TERMINAL_CONFIG.shell, [], {
        name: TERMINAL_CONFIG.name,
        cols: TERMINAL_CONFIG.cols,
        rows: TERMINAL_CONFIG.rows,
        cwd: this.currentDirectory,
        env: TERMINAL_CONFIG.env,
        handleFlowControlPaste: TERMINAL_CONFIG.handleFlowControlPaste
      });
      
      this.isActive = true;
      this.setupEventHandlers();
      this.setupTimeout();
      
      // Send initialization success
      this.socket.emit('terminal-ready', {
        sessionId: this.sessionId,
        shell: TERMINAL_CONFIG.shell,
        cols: TERMINAL_CONFIG.cols,
        rows: TERMINAL_CONFIG.rows
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to initialize terminal session ${this.sessionId}:`, error);
      this.socket.emit('terminal-error', {
        sessionId: this.sessionId,
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
  }

  setupTimeout() {
    this.cleanupTimer = setTimeout(() => {
      if (this.isActive) {
        this.handleTimeout();
      }
    }, TERMINAL_CONFIG.sessionTimeout);
  }

  handleInput(data) {
    if (!this.isActive || !this.ptyProcess) return;

    try {
      const { input, type = 'data' } = data;
      this.lastActivity = new Date();
      
      // Security validation for commands
      if (type === 'command' || input.includes('\n') || input.includes('\r')) {
        const validation = this.validateCommand(input);
        if (!validation.allowed) {
          this.socket.emit('terminal-error', {
            sessionId: this.sessionId,
            message: `Command blocked: ${validation.reason}`,
            command: input
          });
          this.blockedCommandsCount++;
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
      }
    } catch (error) {
      console.error(`Error handling terminal input:`, error);
    }
  }

  handleOutput(data) {
    if (!this.isActive) return;

    try {
      // Buffer output
      this.outputBuffer += data;
      if (this.outputBuffer.length > TERMINAL_CONFIG.maxOutputBuffer) {
        this.outputBuffer = this.outputBuffer.slice(-TERMINAL_CONFIG.maxOutputBuffer / 2);
      }

      // Send output to client
      this.socket.emit('terminal-output', {
        sessionId: this.sessionId,
        data: data
      });

      // Update current directory
      this.updateCurrentDirectory(data);
    } catch (error) {
      console.error(`Error handling terminal output:`, error);
    }
  }

  handleResize(data) {
    if (!this.isActive || !this.ptyProcess) return;

    try {
      const { cols, rows } = data;
      if (cols < 10 || cols > 200 || rows < 5 || rows > 100) {
        this.socket.emit('terminal-error', {
          sessionId: this.sessionId,
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
      console.error(`Error resizing terminal:`, error);
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
    
    if (trimmedCommand.length > 1000) {
      return { allowed: false, reason: 'Command too long' };
    }

    const baseCommand = trimmedCommand.split(' ')[0].toLowerCase();
    
    if (SECURITY_CONFIG.blockedCommands.includes(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' is blocked` };
    }

    if (!SECURITY_CONFIG.allowedCommands.includes(baseCommand)) {
      return { allowed: false, reason: `Command '${baseCommand}' is not allowed` };
    }

    for (const pattern of SECURITY_CONFIG.dangerousPatterns) {
      if (pattern.test(trimmedCommand)) {
        return { allowed: false, reason: `Command contains dangerous pattern` };
      }
    }

    return { allowed: true };
  }

  updateCurrentDirectory(output) {
    try {
      const pwdMatch = output.match(/PWD=([^\s]+)/);
      if (pwdMatch) {
        this.currentDirectory = pwdMatch[1];
      }
    } catch (error) {
      // Ignore errors
    }
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
      blockedCommandsCount: this.blockedCommandsCount
    };
  }

  cleanup() {
    try {
      if (this.cleanupTimer) {
        clearTimeout(this.cleanupTimer);
        this.cleanupTimer = null;
      }
      
      if (this.ptyProcess) {
        this.ptyProcess.kill();
        this.ptyProcess = null;
      }
      
      this.isActive = false;
      console.log(`Enhanced terminal session ${this.sessionId} cleaned up`);
    } catch (error) {
      console.error(`Error cleaning up terminal session:`, error);
    }
  }
}

/**
 * Enhanced Terminal Manager Class
 */
class EnhancedTerminalManager {
  constructor() {
    this.sessions = new Map();
    this.sessionCounter = 0;
    this.userSessions = new Map();
  }

  createSession(userId, socket) {
    const sessionId = this.generateSessionId();
    const terminal = new EnhancedTerminalSession(sessionId, userId, socket);
    
    this.sessions.set(sessionId, terminal);
    this.addUserSession(userId, sessionId);
    
    return terminal;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId) || new Set();
    return Array.from(sessionIds).map(id => this.sessions.get(id)).filter(Boolean);
  }

  addUserSession(userId, sessionId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);
  }

  removeUserSession(userId, sessionId) {
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  generateSessionId() {
    return `enhanced_terminal_${Date.now()}_${++this.sessionCounter}_${crypto.randomBytes(8).toString('hex')}`;
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
      if (timeSinceActivity > TERMINAL_CONFIG.sessionTimeout) {
        inactiveSessions.push(sessionId);
      }
    }

    for (const sessionId of inactiveSessions) {
      const terminal = this.sessions.get(sessionId);
      if (terminal) {
        terminal.cleanup();
        this.removeUserSession(terminal.userId, sessionId);
        this.sessions.delete(sessionId);
      }
    }

    return inactiveSessions.length;
  }

  cleanupUserSessions(userId) {
    const userSessions = this.getUserSessions(userId);
    for (const terminal of userSessions) {
      terminal.cleanup();
      this.sessions.delete(terminal.sessionId);
    }
    this.userSessions.delete(userId);
  }
}

// Create global enhanced terminal manager instance
const enhancedTerminalManager = new EnhancedTerminalManager();

/**
 * Socket.IO event handlers for enhanced interactive terminals
 */
const handleEnhancedInteractiveTerminal = (socket, io) => {
  console.log(`Setting up enhanced interactive terminal for user: ${socket.user?.displayName || 'Unknown'}`);

  // Create new terminal session
  socket.on('create-enhanced-terminal', async (data) => {
    try {
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const terminal = enhancedTerminalManager.createSession(socket.user._id.toString(), socket);
      const success = await terminal.initialize();

      if (success) {
        socket.emit('enhanced-terminal-created', {
          sessionId: terminal.sessionId,
          message: 'Enhanced terminal session created successfully'
        });
        socket.join(`enhanced-terminal:${terminal.sessionId}`);
      }
    } catch (error) {
      console.error('Error creating enhanced terminal session:', error);
      socket.emit('terminal-error', {
        message: 'Failed to create enhanced terminal session',
        error: error.message
      });
    }
  });

  // Join existing terminal session
  socket.on('join-enhanced-terminal', async (data) => {
    try {
      const { sessionId } = data;
      
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const terminal = enhancedTerminalManager.getSession(sessionId);
      if (!terminal) {
        socket.emit('terminal-error', { message: 'Enhanced terminal session not found' });
        return;
      }

      socket.join(`enhanced-terminal:${sessionId}`);
      socket.emit('enhanced-terminal-joined', {
        sessionId: sessionId,
        message: 'Joined enhanced terminal session successfully'
      });
    } catch (error) {
      console.error('Error joining enhanced terminal session:', error);
      socket.emit('terminal-error', {
        message: 'Failed to join enhanced terminal session',
        error: error.message
      });
    }
  });

  // Get user's terminal sessions
  socket.on('get-user-enhanced-terminals', () => {
    try {
      if (!socket.user) {
        socket.emit('terminal-error', { message: 'Authentication required' });
        return;
      }

      const userSessions = enhancedTerminalManager.getUserSessions(socket.user._id.toString());
      const sessionInfos = userSessions.map(terminal => terminal.getSessionInfo());

      socket.emit('user-enhanced-terminals', { sessions: sessionInfos });
    } catch (error) {
      console.error('Error getting user enhanced terminals:', error);
      socket.emit('terminal-error', {
        message: 'Failed to get user enhanced terminals',
        error: error.message
      });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    if (socket.user) {
      enhancedTerminalManager.cleanupUserSessions(socket.user._id.toString());
    }
  });
};

// Periodic cleanup of inactive sessions
setInterval(async () => {
  try {
    const cleanedCount = await enhancedTerminalManager.cleanupInactiveSessions();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} inactive enhanced terminal sessions`);
    }
  } catch (error) {
    console.error('Error during enhanced terminal session cleanup:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  handleEnhancedInteractiveTerminal,
  enhancedTerminalManager,
  EnhancedTerminalSession,
  EnhancedTerminalManager,
  SECURITY_CONFIG,
  TERMINAL_CONFIG
};

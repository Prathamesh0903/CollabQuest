import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import './InteractiveTerminal.css';

// Import xterm styles
import '@xterm/xterm/css/xterm.css';

interface InteractiveTerminalProps {
  sessionId?: string;
  isVisible: boolean;
  onClose: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface TerminalSession {
  sessionId: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  currentDirectory: string;
  commandHistoryLength: number;
  blockedCommandsCount: number;
  suspiciousActivityCount: number;
}

interface TerminalReadyData {
  sessionId: string;
  shell: string;
  cols: number;
  rows: number;
}

interface TerminalOutputData {
  sessionId: string;
  data: string;
}

interface TerminalErrorData {
  sessionId: string;
  message: string;
}

interface TerminalExitData {
  sessionId: string;
  message: string;
}

interface TerminalInfoData {
  sessionId: string;
  info: TerminalSession;
}

const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  sessionId,
  isVisible,
  onClose,
  onError,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<any>(null);
  const currentSessionRef = useRef<string | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<TerminalSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | ''>('');

  // Initialize terminal instance
  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

    try {
      // Create terminal instance
      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 14,
        fontFamily: 'Fira Code, Consolas, Menlo, monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#ffffff'
        },
        allowTransparency: true,
        scrollback: 1000,
        cols: 80,
        rows: 24
      });

      // Add addons
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddon);

      // Try to load WebGL addon for better performance
      try {
        const webglAddon = new WebglAddon();
        terminal.loadAddon(webglAddon);
      } catch (error) {
        console.warn('WebGL addon not available, falling back to canvas renderer');
      }

      // Open terminal in container
      terminal.open(terminalRef.current);

      // Fit terminal to container
      fitAddon.fit();

      // Store references
      terminalInstanceRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Handle terminal input
      terminal.onData((data) => {
        if (socketRef.current && isConnected) {
          socketRef.current.emit('terminal-input', {
            sessionId: currentSessionRef.current,
            input: data,
            type: 'data'
          });
        }
      });

      // Handle terminal resize
      terminal.onResize(({ cols, rows }) => {
        if (socketRef.current && isConnected) {
          socketRef.current.emit('terminal-resize', {
            sessionId: currentSessionRef.current,
            cols,
            rows
          });
        }
      });

      // Handle window resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };

    } catch (error) {
      console.error('Failed to initialize terminal:', error);
      setErrorMessage('Failed to initialize terminal');
      onError?.('Failed to initialize terminal');
    }
  }, [isConnected, onError]);

  // Connect to WebSocket
  const connectToSocket = useCallback(async () => {
    if (!currentUser) {
      setErrorMessage('Authentication required');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Connect to Socket.IO server
      const socket = io('http://localhost:5001', {
        auth: {
          token: await currentUser.getIdToken()
        },
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to terminal server');
        setIsConnected(true);
        setConnectionStatus('connected');
        setErrorMessage('');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from terminal server');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Connection error:', error);
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to terminal server');
        onError?.('Failed to connect to terminal server');
      });

      // Terminal events
      socket.on('terminal-ready', (data: TerminalReadyData) => {
        console.log('Terminal ready:', data);
        currentSessionRef.current = data.sessionId;
        setIsInitialized(true);
        
        // Write welcome message
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\r\n\x1b[1;32m🚀 Interactive Terminal Ready\x1b[0m');
          terminalInstanceRef.current.writeln(`\x1b[1;36mSession ID: ${data.sessionId}\x1b[0m`);
          terminalInstanceRef.current.writeln(`\x1b[1;36mShell: ${data.shell}\x1b[0m`);
          terminalInstanceRef.current.writeln(`\x1b[1;36mDimensions: ${data.cols}x${data.rows}\x1b[0m`);
          terminalInstanceRef.current.writeln('\x1b[1;33mType your commands below...\x1b[0m\r\n');
        }
      });

      socket.on('terminal-output', (data: TerminalOutputData) => {
        if (terminalInstanceRef.current && data.sessionId === currentSessionRef.current) {
          terminalInstanceRef.current.write(data.data);
        }
      });

      socket.on('terminal-error', (data: TerminalErrorData) => {
        console.error('Terminal error:', data);
        setErrorMessage(data.message);
        onError?.(data.message);
        
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(`\r\n\x1b[1;31m❌ Error: ${data.message}\x1b[0m\r\n`);
        }
      });

      socket.on('terminal-exit', (data: TerminalExitData) => {
        console.log('Terminal exited:', data);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(`\r\n\x1b[1;33m⚠️  Terminal exited: ${data.message}\x1b[0m\r\n`);
        }
        setIsInitialized(false);
      });

      socket.on('terminal-timeout', (data: TerminalExitData) => {
        console.log('Terminal timed out:', data);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(`\r\n\x1b[1;33m⏰ Terminal timed out: ${data.message}\x1b[0m\r\n`);
        }
        setIsInitialized(false);
      });

      socket.on('terminal-resized', (data: any) => {
        console.log('Terminal resized:', data);
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      });

      socket.on('terminal-info', (data: TerminalInfoData) => {
        setSessionInfo(data.info);
      });

      // Create or join terminal session
      if (sessionId) {
        socket.emit('join-terminal', { sessionId });
      } else {
        socket.emit('create-terminal', {});
      }

    } catch (error) {
      console.error('Failed to connect to terminal server:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to terminal server');
      onError?.('Failed to connect to terminal server');
    }
  }, [currentUser, sessionId, onError]);

  // Initialize terminal when component mounts
  useEffect(() => {
    if (isVisible && !terminalInstanceRef.current) {
      const cleanup = initializeTerminal();
      return cleanup;
    }
  }, [isVisible, initializeTerminal]);

  // Connect to socket when terminal is initialized
  useEffect(() => {
    if (isVisible && terminalInstanceRef.current && !isConnected) {
      connectToSocket();
    }
  }, [isVisible, isConnected, connectToSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }
    };
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible && fitAddonRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [isVisible]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + ` to close terminal
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        onClose();
      }
      
      // Ctrl/Cmd + K to clear terminal
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.clear();
        }
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  // Execute command programmatically
  const executeCommand = useCallback((command: string) => {
    if (socketRef.current && isConnected && currentSessionRef.current) {
      socketRef.current.emit('execute-command', {
        sessionId: currentSessionRef.current,
        command
      });
    }
  }, [isConnected]);

  // Get session info
  const getSessionInfo = useCallback(() => {
    if (socketRef.current && isConnected && currentSessionRef.current) {
      socketRef.current.emit('get-terminal-info', {
        sessionId: currentSessionRef.current
      });
    }
  }, [isConnected]);

  if (!isVisible) return null;

  return (
    <div className={`interactive-terminal ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">💻</span>
          <span>Interactive Terminal</span>
          {sessionInfo && (
            <span className="terminal-session-info">
              {sessionInfo.currentDirectory}
            </span>
          )}
        </div>
        
        <div className="terminal-controls">
          {/* Connection Status */}
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-dot"></span>
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
            {connectionStatus === 'error' && 'Error'}
          </div>

          {/* Session Info Button */}
          <button 
            className="terminal-btn"
            onClick={getSessionInfo}
            title="Session Info"
          >
            ℹ️
          </button>

          {/* Clear Terminal Button */}
          <button 
            className="terminal-btn"
            onClick={() => terminalInstanceRef.current?.clear()}
            title="Clear Terminal (Ctrl+K)"
          >
            🗑️
          </button>

          {/* Close Button */}
          <button 
            className="terminal-btn close-btn"
            onClick={onClose}
            title="Close Terminal (Ctrl+`)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="terminal-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{errorMessage}</span>
          <button 
            className="error-close"
            onClick={() => setErrorMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Terminal Container */}
      <div className="terminal-container">
        <div ref={terminalRef} className="terminal-element" />
      </div>

      {/* Terminal Footer */}
      <div className="terminal-footer">
        <div className="terminal-status">
          {sessionInfo && (
            <>
              <span className="status-item">
                📁 {sessionInfo.currentDirectory}
              </span>
              <span className="status-item">
                📝 {sessionInfo.commandHistoryLength} commands
              </span>
              {sessionInfo.blockedCommandsCount > 0 && (
                <span className="status-item blocked">
                  🚫 {sessionInfo.blockedCommandsCount} blocked
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="terminal-help">
          <span className="help-text">
            Ctrl+` to close • Ctrl+K to clear • Type commands to start
          </span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTerminal;

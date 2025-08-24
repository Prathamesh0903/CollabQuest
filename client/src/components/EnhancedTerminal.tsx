import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import './EnhancedTerminal.css';

// Import xterm styles
import '@xterm/xterm/css/xterm.css';

interface EnhancedTerminalProps {
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
  command?: string;
}

interface TerminalExitData {
  sessionId: string;
  exitCode: number;
  signal: string;
  message: string;
}

interface TerminalInfoData {
  sessionId: string;
  info: TerminalSession;
}

const EnhancedTerminal: React.FC<EnhancedTerminalProps> = ({
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
  const [isLoading, setIsLoading] = useState(false);

  // Initialize terminal instance
  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

    try {
             // Create terminal instance with enhanced configuration
       const terminal = new Terminal({
         cursorBlink: true,
         cursorStyle: 'block',
         fontSize: 14,
         fontFamily: 'Fira Code, Consolas, Menlo, monospace',
         theme: {
           background: '#0d1117',
           foreground: '#c9d1d9',
           cursor: '#58a6ff',
           black: '#0d1117',
           red: '#f85149',
           green: '#238636',
           yellow: '#d29922',
           blue: '#58a6ff',
           magenta: '#bc8cff',
           cyan: '#39d353',
           white: '#f0f6fc',
           brightBlack: '#484f58',
           brightRed: '#ff7b72',
           brightGreen: '#3fb950',
           brightYellow: '#d29922',
           brightBlue: '#58a6ff',
           brightMagenta: '#bc8cff',
           brightCyan: '#39d353',
           brightWhite: '#f0f6fc'
         },
         allowTransparency: true,
         scrollback: 1000,
         cols: 80,
         rows: 24,
         convertEol: true
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
      console.error('Failed to initialize enhanced terminal:', error);
      setErrorMessage('Failed to initialize enhanced terminal');
      onError?.('Failed to initialize enhanced terminal');
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
      setIsLoading(true);

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
        console.log('Connected to enhanced terminal server');
        setIsConnected(true);
        setConnectionStatus('connected');
        setErrorMessage('');
        setIsLoading(false);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from enhanced terminal server');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsLoading(false);
      });

      socket.on('connect_error', (error: Error) => {
        console.error('Connection error:', error);
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to enhanced terminal server');
        onError?.('Failed to connect to enhanced terminal server');
        setIsLoading(false);
      });

      // Enhanced terminal events
      socket.on('enhanced-terminal-created', (data: any) => {
        console.log('Enhanced terminal created:', data);
        currentSessionRef.current = data.sessionId;
      });

      socket.on('enhanced-terminal-joined', (data: any) => {
        console.log('Enhanced terminal joined:', data);
        currentSessionRef.current = data.sessionId;
      });

      socket.on('terminal-ready', (data: TerminalReadyData) => {
        console.log('Enhanced terminal ready:', data);
        currentSessionRef.current = data.sessionId;
        setIsInitialized(true);
        
        // Write welcome message
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\r\n\x1b[1;32m🚀 Enhanced Interactive Terminal Ready\x1b[0m');
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
        console.error('Enhanced terminal error:', data);
        setErrorMessage(data.message);
        onError?.(data.message);
        
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(`\r\n\x1b[1;31m❌ Error: ${data.message}\x1b[0m`);
          if (data.command) {
            terminalInstanceRef.current.writeln(`\x1b[1;31mCommand: ${data.command}\x1b[0m`);
          }
          terminalInstanceRef.current.writeln('\r\n');
        }
      });

      socket.on('terminal-exit', (data: TerminalExitData) => {
        console.log('Enhanced terminal exited:', data);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(`\r\n\x1b[1;33m⚠️  Terminal exited: ${data.message}\x1b[0m\r\n`);
        }
        setIsInitialized(false);
      });

      socket.on('terminal-timeout', (data: TerminalExitData) => {
        console.log('Enhanced terminal timed out:', data);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(`\r\n\x1b[1;33m⏰ Terminal timed out: ${data.message}\x1b[0m\r\n`);
        }
        setIsInitialized(false);
      });

      socket.on('terminal-resized', (data: any) => {
        console.log('Enhanced terminal resized:', data);
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      });

      socket.on('terminal-info', (data: TerminalInfoData) => {
        setSessionInfo(data.info);
      });

      // Create or join enhanced terminal session
      if (sessionId) {
        socket.emit('join-enhanced-terminal', { sessionId });
      } else {
        socket.emit('create-enhanced-terminal', {});
      }

    } catch (error) {
      console.error('Failed to connect to enhanced terminal server:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to enhanced terminal server');
      onError?.('Failed to connect to enhanced terminal server');
      setIsLoading(false);
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

      // Ctrl/Cmd + L to focus terminal
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        terminalInstanceRef.current?.focus();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  // Get session info
  const getSessionInfo = useCallback(() => {
    if (socketRef.current && isConnected && currentSessionRef.current) {
      socketRef.current.emit('get-session-info', {
        sessionId: currentSessionRef.current
      });
    }
  }, [isConnected]);

  // Get user terminals
  const getUserTerminals = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get-user-enhanced-terminals');
    }
  }, [isConnected]);

  if (!isVisible) return null;

  return (
    <div className={`enhanced-terminal ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⚡</span>
          <span>Enhanced Terminal</span>
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

          {/* Loading Indicator */}
          {isLoading && (
            <div className="loading-indicator">
              <span className="spinner"></span>
              <span>Initializing...</span>
            </div>
          )}

          {/* Session Info Button */}
          <button 
            className="terminal-btn"
            onClick={getSessionInfo}
            title="Session Info"
            disabled={!isConnected}
          >
            ℹ️
          </button>

          {/* User Terminals Button */}
          <button 
            className="terminal-btn"
            onClick={getUserTerminals}
            title="User Terminals"
            disabled={!isConnected}
          >
            📋
          </button>

          {/* Clear Terminal Button */}
          <button 
            className="terminal-btn"
            onClick={() => terminalInstanceRef.current?.clear()}
            title="Clear Terminal (Ctrl+K)"
            disabled={!isConnected}
          >
            🗑️
          </button>

          {/* Focus Terminal Button */}
          <button 
            className="terminal-btn"
            onClick={() => terminalInstanceRef.current?.focus()}
            title="Focus Terminal (Ctrl+L)"
            disabled={!isConnected}
          >
            🎯
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
            Ctrl+` to close • Ctrl+K to clear • Ctrl+L to focus • Type commands to start
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTerminal;

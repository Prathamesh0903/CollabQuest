import React, { useState } from 'react';
import InteractiveTerminal from './InteractiveTerminal';
import './InteractiveTerminalDemo.css';

const InteractiveTerminalDemo: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalSessionId, setTerminalSessionId] = useState<string | undefined>(undefined);

  const handleToggleTerminal = () => {
    setShowTerminal(!showTerminal);
  };

  const handleTerminalError = (error: string) => {
    console.error('Terminal error:', error);
    // You can show a toast notification here
  };

  const handleCreateNewSession = () => {
    setTerminalSessionId(undefined); // This will create a new session
    setShowTerminal(true);
  };

  const handleJoinSession = () => {
    const sessionId = prompt('Enter terminal session ID:');
    if (sessionId) {
      setTerminalSessionId(sessionId);
      setShowTerminal(true);
    }
  };

  return (
    <div className="interactive-terminal-demo">
      <div className="demo-header">
        <h1>🚀 Interactive Terminal Demo</h1>
        <p>Experience a live, secure terminal session with WebSocket integration</p>
      </div>

      <div className="demo-content">
        <div className="demo-section">
          <h2>✨ Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Execution</h3>
              <p>Command validation, blocked commands, and security monitoring</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time</h3>
              <p>Live WebSocket communication with instant command execution</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Modern UI</h3>
              <p>Beautiful terminal interface with syntax highlighting</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive</h3>
              <p>Works perfectly on desktop, tablet, and mobile devices</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Session Management</h3>
              <p>Multiple sessions, timeout handling, and cleanup</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Developer Tools</h3>
              <p>Command history, session info, and debugging features</p>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>🎮 Try It Out</h2>
          <div className="demo-controls">
            <button 
              className="demo-btn primary"
              onClick={handleToggleTerminal}
            >
              {showTerminal ? '🔽 Hide Terminal' : '🔼 Show Terminal'}
            </button>
            
            <button 
              className="demo-btn secondary"
              onClick={handleCreateNewSession}
            >
              🆕 New Session
            </button>
            
            <button 
              className="demo-btn secondary"
              onClick={handleJoinSession}
            >
              🔗 Join Session
            </button>
          </div>

          <div className="demo-info">
            <h3>📋 Quick Start</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>1. Open Terminal</strong>
                <p>Click "Show Terminal" to open the interactive terminal</p>
              </div>
              <div className="info-item">
                <strong>2. Wait for Connection</strong>
                <p>Wait for the green "Connected" status indicator</p>
              </div>
              <div className="info-item">
                <strong>3. Start Typing</strong>
                <p>Type commands like <code>ls</code>, <code>pwd</code>, <code>echo "Hello"</code></p>
              </div>
              <div className="info-item">
                <strong>4. Explore Features</strong>
                <p>Try the session info button, clear terminal, and keyboard shortcuts</p>
              </div>
            </div>
          </div>

          <div className="demo-commands">
            <h3>💡 Example Commands</h3>
            <div className="commands-grid">
              <div className="command-group">
                <h4>File Operations</h4>
                <ul>
                  <li><code>ls -la</code> - List files with details</li>
                  <li><code>pwd</code> - Show current directory</li>
                  <li><code>mkdir test</code> - Create directory</li>
                  <li><code>touch file.txt</code> - Create file</li>
                </ul>
              </div>
              <div className="command-group">
                <h4>System Info</h4>
                <ul>
                  <li><code>whoami</code> - Show current user</li>
                  <li><code>ps aux</code> - Show processes</li>
                  <li><code>df -h</code> - Show disk usage</li>
                  <li><code>free -h</code> - Show memory usage</li>
                </ul>
              </div>
              <div className="command-group">
                <h4>Development</h4>
                <ul>
                  <li><code>node --version</code> - Check Node.js</li>
                  <li><code>python --version</code> - Check Python</li>
                  <li><code>git --version</code> - Check Git</li>
                  <li><code>npm list</code> - List npm packages</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="demo-shortcuts">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>`</kbd>
                <span>Toggle terminal visibility</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
                <span>Clear terminal</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>C</kbd>
                <span>Cancel current command</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>L</kbd>
                <span>Clear screen</span>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>🔧 Technical Details</h2>
          <div className="tech-details">
            <div className="tech-item">
              <h4>Backend</h4>
              <ul>
                <li><strong>node-pty:</strong> Pseudo-terminal creation</li>
                <li><strong>Socket.IO:</strong> Real-time WebSocket communication</li>
                <li><strong>Security:</strong> Command validation and sandboxing</li>
                <li><strong>Session Management:</strong> Multi-user terminal sessions</li>
              </ul>
            </div>
            <div className="tech-item">
              <h4>Frontend</h4>
              <ul>
                <li><strong>xterm.js:</strong> Terminal emulator</li>
                <li><strong>React:</strong> Component-based UI</li>
                <li><strong>TypeScript:</strong> Type-safe development</li>
                <li><strong>Responsive Design:</strong> Mobile-friendly interface</li>
              </ul>
            </div>
            <div className="tech-item">
              <h4>Security Features</h4>
              <ul>
                <li><strong>Command Whitelist:</strong> Only allowed commands</li>
                <li><strong>Pattern Blocking:</strong> Dangerous command patterns</li>
                <li><strong>Session Timeouts:</strong> Automatic cleanup</li>
                <li><strong>Activity Monitoring:</strong> Suspicious activity tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Terminal */}
      <InteractiveTerminal
        sessionId={terminalSessionId}
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
        onError={handleTerminalError}
        className="demo-terminal"
      />
    </div>
  );
};

export default InteractiveTerminalDemo;

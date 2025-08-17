import React, { useState } from 'react';
import EnhancedTerminal from './EnhancedTerminal';
import './EnhancedTerminalDemo.css';

const EnhancedTerminalDemo: React.FC = () => {
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | ''>('');

  const handleOpenTerminal = () => {
    setIsTerminalVisible(true);
  };

  const handleCloseTerminal = () => {
    setIsTerminalVisible(false);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    console.error('Enhanced Terminal Error:', error);
  };

  return (
    <div className="enhanced-terminal-demo">
      <div className="demo-header">
        <h1>🚀 Enhanced Terminal Demo</h1>
        <p>Experience the power of node-pty with xterm.js over WebSockets</p>
      </div>

      <div className="demo-content">
        <div className="demo-section">
          <h2>✨ Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Security First</h3>
              <p>Command validation, whitelist/blacklist approach, and dangerous pattern detection</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Communication</h3>
              <p>WebSocket-based communication with instant command execution and output streaming</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Modern UI</h3>
              <p>Beautiful terminal interface with GitHub-inspired dark theme and smooth animations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Session Management</h3>
              <p>Multiple terminal sessions, activity tracking, and automatic cleanup</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Error Handling</h3>
              <p>Comprehensive error handling with user-friendly messages and recovery options</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Performance Optimized</h3>
              <p>WebGL rendering, output buffering, and efficient memory management</p>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>🛠️ Technical Implementation</h2>
          <div className="tech-stack">
            <div className="tech-item">
              <h4>Backend (Node.js)</h4>
              <ul>
                <li><strong>node-pty:</strong> Creates pseudo-terminals for shell access</li>
                <li><strong>Socket.IO:</strong> Real-time bidirectional communication</li>
                <li><strong>Security:</strong> Command validation and sandboxing</li>
                <li><strong>Session Management:</strong> Multi-user terminal sessions</li>
              </ul>
            </div>
            <div className="tech-item">
              <h4>Frontend (React + TypeScript)</h4>
              <ul>
                <li><strong>xterm.js:</strong> Terminal emulator for the browser</li>
                <li><strong>WebGL Addon:</strong> Hardware-accelerated rendering</li>
                <li><strong>Fit Addon:</strong> Responsive terminal sizing</li>
                <li><strong>WebLinks Addon:</strong> Clickable links in terminal</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>🔐 Security Features</h2>
          <div className="security-features">
            <div className="security-item">
              <h4>Command Whitelist</h4>
              <p>Only pre-approved commands are allowed to execute</p>
              <code>ls, pwd, cd, cat, echo, grep, find, git, npm, node, python, etc.</code>
            </div>
            <div className="security-item">
              <h4>Command Blacklist</h4>
              <p>Dangerous commands are explicitly blocked</p>
              <code>sudo, su, shutdown, reboot, mount, fdisk, dd, etc.</code>
            </div>
            <div className="security-item">
              <h4>Pattern Detection</h4>
              <p>Regex patterns detect dangerous command combinations</p>
              <code>Shell metacharacters, redirections, pipe operations</code>
            </div>
            <div className="security-item">
              <h4>Session Limits</h4>
              <p>Automatic timeout and resource management</p>
              <code>30-minute session timeout, output buffer limits</code>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>🎮 Try It Out</h2>
          <div className="demo-actions">
            <button 
              className="demo-btn primary"
              onClick={handleOpenTerminal}
              disabled={isTerminalVisible}
            >
              🚀 Launch Enhanced Terminal
            </button>
            
            <div className="demo-info">
              <h4>Keyboard Shortcuts:</h4>
              <ul>
                <li><kbd>Ctrl</kbd> + <kbd>`</kbd> - Close terminal</li>
                <li><kbd>Ctrl</kbd> + <kbd>K</kbd> - Clear terminal</li>
                <li><kbd>Ctrl</kbd> + <kbd>L</kbd> - Focus terminal</li>
              </ul>
              
              <h4>Try These Commands:</h4>
              <ul>
                <li><code>ls -la</code> - List files with details</li>
                <li><code>pwd</code> - Show current directory</li>
                <li><code>echo "Hello World"</code> - Print text</li>
                <li><code>date</code> - Show current date/time</li>
                <li><code>whoami</code> - Show current user</li>
              </ul>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="demo-error">
            <h4>⚠️ Error Occurred</h4>
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage('')}>Dismiss</button>
          </div>
        )}
      </div>

      {/* Enhanced Terminal Component */}
      <EnhancedTerminal
        isVisible={isTerminalVisible}
        onClose={handleCloseTerminal}
        onError={handleError}
      />
    </div>
  );
};

export default EnhancedTerminalDemo;

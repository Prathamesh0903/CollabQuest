# 🚀 Interactive Terminal Setup Guide

A comprehensive guide for setting up a live interactive terminal with WebSocket integration for your collaborative coding platform.

## 📋 Overview

This implementation provides a secure, real-time interactive terminal that allows users to execute commands in a sandboxed environment with full WebSocket communication.

### ✨ Features

- **🔒 Secure Execution**: Command validation, blocked commands, and security monitoring
- **⚡ Real-time Communication**: Live WebSocket integration with instant feedback
- **🎨 Modern UI**: Beautiful terminal interface with syntax highlighting
- **📱 Responsive Design**: Works perfectly on all devices
- **🛡️ Session Management**: Multiple sessions, timeout handling, and cleanup
- **🔧 Developer Tools**: Command history, session info, and debugging features

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Frontend      │ ◄─────────────► │    Backend      │
│   (React)       │                 │   (Node.js)     │
│                 │                 │                 │
│ ┌─────────────┐ │                 │ ┌─────────────┐ │
│ │ xterm.js    │ │                 │ │ node-pty    │ │
│ │ Terminal    │ │                 │ │ Pseudo-     │ │
│ │ Emulator    │ │                 │ │ Terminal    │ │
│ └─────────────┘ │                 │ └─────────────┘ │
│                 │                 │                 │
│ ┌─────────────┐ │                 │ ┌─────────────┐ │
│ │ Socket.IO   │ │                 │ │ Socket.IO   │ │
│ │ Client      │ │                 │ │ Server      │ │
│ └─────────────┘ │                 │ └─────────────┘ │
└─────────────────┘                 └─────────────────┘
```

## 📦 Dependencies

### Backend Dependencies

Add to `server/package.json`:

```json
{
  "dependencies": {
    "node-pty": "^1.0.0",
    "socket.io": "^4.7.4"
  }
}
```

### Frontend Dependencies

Add to `client/package.json`:

```json
{
  "dependencies": {
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.9.0",
    "xterm-addon-search": "^0.13.0",
    "xterm-addon-webgl": "^0.16.0",
    "socket.io-client": "^4.8.1"
  }
}
```

## 🚀 Installation

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. System Requirements

**Linux/macOS:**
- Node.js 16+ with native modules support
- Python build tools (for node-pty compilation)

**Windows:**
- Node.js 16+ with native modules support
- Visual Studio Build Tools
- Python 2.7 or 3.x

### 4. Build node-pty (if needed)

If you encounter issues with node-pty:

```bash
cd server
npm rebuild node-pty
```

## 🔧 Configuration

### Backend Configuration

Create or update `server/.env`:

```env
# Terminal Configuration
TERMINAL_ENABLED=true
TERMINAL_SESSION_TIMEOUT=1800000
TERMINAL_MAX_SESSIONS=100
TERMINAL_MAX_OUTPUT_SIZE=1048576

# Security Configuration
TERMINAL_ALLOWED_COMMANDS=ls,pwd,cd,cat,echo,grep,find,head,tail,mkdir,rmdir,touch,cp,mv,rm,chmod,chown,ps,top,htop,df,du,free,whoami,id,git,npm,node,python,python3,pip,pip3,gcc,g++,make,cmake,docker,docker-compose,curl,wget,ssh,scp,rsync,tar,zip,unzip,vim,nano,emacs,less,more,man,help
TERMINAL_BLOCKED_COMMANDS=sudo,su,passwd,useradd,userdel,usermod,chroot,mount,umount,fdisk,mkfs,dd,shutdown,reboot,halt,poweroff,init,systemctl,service,iptables,ufw,firewall-cmd
```

### Frontend Configuration

Update `client/src/config/terminal.ts`:

```typescript
export const TERMINAL_CONFIG = {
  serverUrl: process.env.REACT_APP_SERVER_URL || 'http://localhost:5000',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  connectionTimeout: 10000,
  terminalTheme: {
    background: '#1e1e1e',
    foreground: '#cccccc',
    cursor: '#ffffff',
    selection: '#264f78'
  }
};
```

## 🎯 Usage

### Basic Implementation

```tsx
import React, { useState } from 'react';
import InteractiveTerminal from './components/InteractiveTerminal';

const App: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowTerminal(true)}>
        Open Terminal
      </button>
      
      <InteractiveTerminal
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
        onError={(error) => console.error('Terminal error:', error)}
      />
    </div>
  );
};
```

### Advanced Usage with Session Management

```tsx
import React, { useState } from 'react';
import InteractiveTerminal from './components/InteractiveTerminal';

const AdvancedTerminal: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleCreateSession = () => {
    setSessionId(undefined); // Creates new session
    setShowTerminal(true);
  };

  const handleJoinSession = (existingSessionId: string) => {
    setSessionId(existingSessionId);
    setShowTerminal(true);
  };

  return (
    <div>
      <button onClick={handleCreateSession}>New Session</button>
      <button onClick={() => handleJoinSession('existing-session-id')}>
        Join Session
      </button>
      
      <InteractiveTerminal
        sessionId={sessionId}
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
        onError={(error) => console.error('Terminal error:', error)}
      />
    </div>
  );
};
```

## 🔒 Security Features

### Command Validation

The terminal implements multiple layers of security:

1. **Command Whitelist**: Only allowed commands can be executed
2. **Pattern Blocking**: Dangerous command patterns are blocked
3. **Session Timeouts**: Automatic cleanup of inactive sessions
4. **Activity Monitoring**: Suspicious activity tracking

### Allowed Commands

```javascript
const allowedCommands = [
  'ls', 'pwd', 'cd', 'cat', 'echo', 'grep', 'find', 'head', 'tail',
  'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'chmod', 'chown',
  'ps', 'top', 'htop', 'df', 'du', 'free', 'whoami', 'id',
  'git', 'npm', 'node', 'python', 'python3', 'pip', 'pip3',
  'gcc', 'g++', 'make', 'cmake', 'docker', 'docker-compose',
  'curl', 'wget', 'ssh', 'scp', 'rsync', 'tar', 'zip', 'unzip',
  'vim', 'nano', 'emacs', 'less', 'more', 'man', 'help'
];
```

### Blocked Commands

```javascript
const blockedCommands = [
  'sudo', 'su', 'passwd', 'useradd', 'userdel', 'usermod',
  'chroot', 'mount', 'umount', 'fdisk', 'mkfs', 'dd',
  'shutdown', 'reboot', 'halt', 'poweroff', 'init',
  'systemctl', 'service', 'iptables', 'ufw', 'firewall-cmd'
];
```

## 🎨 Customization

### Terminal Theme

```typescript
const customTheme = {
  background: '#0d1117',
  foreground: '#f0f6fc',
  cursor: '#58a6ff',
  selection: '#264f78',
  black: '#000000',
  red: '#f85149',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39d353',
  white: '#f0f6fc',
  brightBlack: '#484f58',
  brightRed: '#ff6b6b',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#ffffff'
};
```

### Terminal Options

```typescript
const terminalOptions = {
  cursorBlink: true,
  cursorStyle: 'block',
  fontSize: 14,
  fontFamily: 'Fira Code, Consolas, Menlo, monospace',
  theme: customTheme,
  allowTransparency: true,
  scrollback: 1000,
  cols: 80,
  rows: 24
};
```

## 🔧 API Reference

### Socket.IO Events

#### Client to Server

- `create-terminal` - Create a new terminal session
- `join-terminal` - Join an existing terminal session
- `terminal-input` - Send input to terminal
- `terminal-resize` - Resize terminal
- `execute-command` - Execute a specific command
- `get-terminal-info` - Get session information
- `get-user-terminals` - Get all user's terminal sessions

#### Server to Client

- `terminal-ready` - Terminal session ready
- `terminal-output` - Terminal output data
- `terminal-error` - Terminal error
- `terminal-exit` - Terminal session exited
- `terminal-timeout` - Terminal session timed out
- `terminal-resized` - Terminal resized confirmation
- `terminal-info` - Session information
- `user-terminals` - User's terminal sessions

### Component Props

```typescript
interface InteractiveTerminalProps {
  sessionId?: string;           // Optional session ID to join
  isVisible: boolean;           // Terminal visibility
  onClose: () => void;          // Close handler
  onError?: (error: string) => void; // Error handler
  className?: string;           // Additional CSS classes
}
```

## 🧪 Testing

### Backend Testing

```bash
cd server
npm test
```

### Frontend Testing

```bash
cd client
npm test
```

### Manual Testing

1. Start the backend server
2. Start the frontend development server
3. Open the terminal demo page
4. Test various commands and features

## 🐛 Troubleshooting

### Common Issues

#### node-pty Installation Issues

**Linux/macOS:**
```bash
sudo apt-get install python3 make g++
npm rebuild node-pty
```

**Windows:**
```bash
npm install --global windows-build-tools
npm rebuild node-pty
```

#### WebSocket Connection Issues

1. Check if the backend server is running
2. Verify the WebSocket URL configuration
3. Check firewall settings
4. Ensure authentication is properly configured

#### Terminal Not Rendering

1. Check if xterm.js is properly installed
2. Verify CSS imports
3. Check browser console for errors
4. Ensure the terminal container has proper dimensions

### Debug Mode

Enable debug logging:

```typescript
// Frontend
localStorage.setItem('terminal-debug', 'true');

// Backend
DEBUG=terminal:* npm start
```

## 📈 Performance Optimization

### Backend Optimizations

1. **Session Cleanup**: Regular cleanup of inactive sessions
2. **Output Buffering**: Limit output buffer size
3. **Connection Pooling**: Reuse WebSocket connections
4. **Memory Management**: Monitor memory usage

### Frontend Optimizations

1. **WebGL Rendering**: Use WebGL addon for better performance
2. **Debounced Input**: Debounce terminal input events
3. **Virtual Scrolling**: Implement virtual scrolling for large outputs
4. **Lazy Loading**: Load terminal only when needed

## 🔮 Future Enhancements

### Planned Features

- [ ] **Multi-user Sessions**: Collaborative terminal sessions
- [ ] **File Transfer**: Secure file upload/download
- [ ] **Plugin System**: Extensible command plugins
- [ ] **Advanced Security**: Seccomp profiles, namespaces
- [ ] **Session Recording**: Record and replay sessions
- [ ] **Custom Shells**: Support for custom shell configurations

### Integration Ideas

- **IDE Integration**: Embed in VS Code, IntelliJ
- **CI/CD Integration**: Terminal access in build pipelines
- **Educational Platform**: Interactive coding tutorials
- **Remote Development**: Cloud-based development environments

## 📚 Additional Resources

### Documentation

- [xterm.js Documentation](https://xtermjs.org/docs/)
- [node-pty Documentation](https://github.com/microsoft/node-pty)
- [Socket.IO Documentation](https://socket.io/docs/)

### Examples

- [Basic Terminal Example](./examples/basic-terminal.tsx)
- [Advanced Terminal Example](./examples/advanced-terminal.tsx)
- [Custom Theme Example](./examples/custom-theme.tsx)

### Security Best Practices

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Coding! 🚀**

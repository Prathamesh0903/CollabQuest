# Enhanced Real-Time Collaborative Coding System

This document describes the comprehensive real-time collaborative coding system with advanced features for multi-user code editing, execution, and collaboration.

## 🚀 Features Overview

### Real-Time Collaboration
- **Live Code Editing**: See changes as they happen in real-time with operational transformation
- **Cursor Tracking**: View other users' cursor positions with colored indicators and user avatars
- **Selection Sharing**: See what other users have selected in the code
- **User Presence**: Real-time user status with avatars and activity indicators
- **Version Control**: Conflict-free editing with version-based synchronization

### Code Execution
- **Real-Time Execution Broadcasting**: When one user runs code, all collaborators see the results
- **Secure Container Execution**: Docker-based isolated code execution
- **Multiple Language Support**: JavaScript and Python with extensible architecture
- **Fallback System**: Judge0 API integration for reliability
- **Execution History**: Track and display recent code executions

### User Experience
- **VS Code-like Interface**: Familiar development environment
- **User Avatars**: Visual user identification with status indicators
- **Activity Notifications**: Real-time feedback for user actions
- **Connection Management**: Automatic reconnection with state recovery
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend Components
1. **CollaborativeEditor** - Main editor with Monaco Editor integration
2. **UserAvatar** - User identification with status indicators
3. **Terminal** - Code execution output display
4. **LanguageSwitcher** - Programming language selection
5. **VSCodeSidebar** - File explorer and project structure
6. **ToastContainer** - Notification system

### Backend Services
1. **Socket Handler** - Real-time communication management
2. **Code Executor** - Secure code execution service
3. **Room State Manager** - Collaborative session management
4. **User Management** - Authentication and user tracking

## 📡 Real-Time Events

### Client to Server
- `join-collab-room` - Join collaborative editing room
- `leave-collab-room` - Leave collaborative room
- `code-change` - Send code changes to other users
- `code-sync` - Full code synchronization
- `cursor-move` - Broadcast cursor position
- `selection-change` - Broadcast text selection
- `language-change` - Change programming language
- `execute-code` - Request code execution
- `reconnect-request` - Handle reconnection

### Server to Client
- `room-state-sync` - Initial room state
- `code-change` - Receive code changes from others
- `code-sync` - Receive full code sync
- `cursor-move` - Receive cursor updates
- `selection-change` - Receive selection updates
- `users-in-room` - Updated user list
- `cursors-sync` - Initial cursor positions
- `selections-sync` - Initial selections
- `code-execution-started` - Code execution started
- `code-execution-completed` - Code execution results
- `code-execution-error` - Code execution errors
- `user-left-collab-room` - User left notification

## 🔧 Code Execution System

### Security Features
- **Container Isolation**: Each execution runs in isolated Docker containers
- **Resource Limits**: Memory (256MB), CPU (50%), process limits (50 PIDs)
- **Network Isolation**: Containers run without network access
- **Read-only Filesystem**: Prevents file system access
- **Code Validation**: Pattern-based security checks
- **Timeout Protection**: 3-second execution timeout

### Supported Languages
- **JavaScript (Node.js)**: Full ES6+ support with security restrictions
- **Python 3**: Standard library with security limitations
- **Extensible**: Easy to add new languages

### Execution Flow
1. User requests code execution
2. Server validates code for security
3. Creates secure Docker container
4. Executes code with input
5. Captures stdout/stderr
6. Broadcasts results to all collaborators
7. Cleans up container automatically

## 🎨 User Interface

### VS Code-like Layout
- **Header Bar**: Connection status, user indicators, execution status
- **Sidebar**: File explorer and project structure
- **Editor Area**: Monaco Editor with collaborative features
- **Status Bar**: Language, metrics, shortcuts
- **Terminal Panel**: Code execution output

### Visual Indicators
- **Connection Status**: Connected, Disconnected, Reconnecting
- **User Avatars**: Colored circles with initials or profile pictures
- **Activity Status**: Online, Editing, Executing
- **Cursor Colors**: Unique colors for each user
- **Selection Highlights**: Semi-transparent overlays

## 🔄 State Management

### Room State
```typescript
interface RoomState {
  code: string;
  language: string;
  version: number;
  lastModified: Date;
  users: Set<string>;
  executionHistory: ExecutionResult[];
  lastExecution: ExecutionResult | null;
}
```

### User State
```typescript
interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  socketId: string;
  online: boolean;
  isEditing: boolean;
  lastActivity: Date;
}
```

### Cursor State
```typescript
interface CursorInfo {
  position: any;
  userId: string;
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- MongoDB (for user management)
- Firebase (for authentication)

### Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd collaborative-coding-platform

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ../executor && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up --build
```

### Configuration
```env
# Main Server
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/collaborative-coding
CLIENT_URL=http://localhost:3000

# Code Execution
EXECUTOR_URL=http://localhost:5001
JUDGE0_API_KEY=your-judge0-api-key

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## 📊 Performance Optimization

### Real-Time Optimization
- **Debounced Updates**: Code changes debounced by 100ms
- **Throttled Cursors**: Cursor updates throttled to 50ms
- **Selective Broadcasting**: Only send relevant data
- **Connection Pooling**: Efficient socket management

### Code Execution Optimization
- **Container Reuse**: Fresh containers for each execution
- **Resource Limits**: Prevent resource exhaustion
- **Automatic Cleanup**: Containers removed after execution
- **Caching**: Docker layer caching for faster builds

## 🔒 Security Considerations

### Code Execution Security
- **Sandboxed Environment**: Complete isolation from host system
- **Input Validation**: All inputs validated and sanitized
- **Pattern Detection**: Blocks dangerous code patterns
- **Resource Limits**: Prevents denial of service attacks

### Network Security
- **Authentication Required**: All operations require valid tokens
- **Room-based Access**: Users can only access authorized rooms
- **Input Sanitization**: All user inputs sanitized
- **Rate Limiting**: Prevents abuse

## 🧪 Testing

### Unit Tests
```bash
# Run frontend tests
cd client && npm test

# Run backend tests
cd server && npm test

# Run executor tests
cd executor && npm test
```

### Integration Tests
```bash
# Test collaborative editing
npm run test:collaboration

# Test code execution
npm run test:execution

# Test real-time features
npm run test:realtime
```

### Load Testing
```bash
# Test with multiple users
npm run test:load

# Test code execution under load
npm run test:execution-load
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Problems**
   - Check if server is running on port 5000
   - Verify Firebase configuration
   - Check network connectivity

2. **Code Execution Failures**
   - Ensure Docker is running
   - Check executor service status
   - Verify code doesn't contain forbidden patterns

3. **Real-time Sync Issues**
   - Check socket connection status
   - Verify room permissions
   - Check browser console for errors

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Monitor socket events
DEBUG=socket.io* npm start

# Monitor code execution
DEBUG=executor* npm start
```

## 🔮 Future Enhancements

### Planned Features
- **Multi-file Support**: Edit multiple files simultaneously
- **Git Integration**: Version control integration
- **Code Review**: Built-in code review tools
- **Video Chat**: Integrated video communication
- **Screen Sharing**: Share screen during collaboration
- **Plugin System**: Extensible editor plugins

### Performance Improvements
- **WebRTC**: Direct peer-to-peer communication
- **WebAssembly**: Client-side code execution
- **Service Workers**: Offline support
- **Progressive Web App**: Mobile app-like experience

## 📚 API Reference

### Socket.IO Events
Detailed documentation for all real-time events and their payloads.

### REST API
Complete API reference for server endpoints.

### Code Execution API
Documentation for code execution service endpoints.

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- Follow ESLint configuration
- Use TypeScript for type safety
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Monaco Editor for the excellent code editor
- Socket.IO for real-time communication
- Docker for containerization
- Judge0 for code execution API
- VS Code for UI inspiration 
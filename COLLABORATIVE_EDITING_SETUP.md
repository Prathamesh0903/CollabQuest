# Real-Time Collaborative Editing System

This document describes the real-time collaborative editing system implemented using Monaco Editor and Socket.IO. The system provides seamless real-time collaboration with features like cursor tracking, code synchronization, and reconnection handling.

## 🎯 Features

### Real-Time Collaboration
- **Live Code Editing**: See changes as they happen in real-time
- **Cursor Tracking**: View other users' cursor positions and selections
- **User Presence**: See who's currently in the room
- **Chat Integration**: Built-in chat system for team communication

### Connection Management
- **Automatic Reconnection**: Handles network disconnections gracefully
- **Connection Status**: Visual indicators for connection state
- **Version Control**: Prevents conflicts with version-based synchronization
- **State Recovery**: Reconnects with the latest code state

### User Experience
- **Toast Notifications**: Real-time feedback for user actions
- **Visual Indicators**: Connection status, user count, and activity
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Light and dark theme options

## 🏗️ Architecture

### Frontend Components
1. **CollaborativeEditor** - Main editor component with Monaco Editor
2. **ToastContainer** - Notification system for user feedback
3. **GamifiedHeader** - Header with connection status and user info
4. **ChatPanel** - Real-time chat interface
5. **UserListPanel** - Shows active users in the room

### Backend Services
1. **Socket Handler** - Manages real-time connections and events
2. **Room State Management** - Tracks code state and user presence
3. **Code Execution** - Integrated with secure code execution system

## 📡 Socket.IO Events

### Client to Server
- `join-collab-room` - Join a collaborative editing room
- `leave-collab-room` - Leave the collaborative room
- `code-change` - Send code changes to other users
- `code-sync` - Sync entire code content
- `cursor-move` - Send cursor position updates
- `send-message` - Send chat messages
- `reconnect-request` - Request reconnection after disconnect

### Server to Client
- `room-state-sync` - Send current room state to new users
- `code-change` - Broadcast code changes to other users
- `code-sync` - Broadcast full code sync to all users
- `version-mismatch` - Handle version conflicts
- `users-in-room` - Update user list
- `cursor-move` - Broadcast cursor positions
- `cursors-sync` - Send all current cursors to new user
- `user-left-collab-room` - Notify when user leaves
- `new-message` - Broadcast chat messages

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (for user management)
- Docker (for code execution)

### Environment Variables

Add to your `.env` file:

```env
# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
SOCKET_MAX_RECONNECTION_ATTEMPTS=5
SOCKET_RECONNECTION_DELAY=1000

# Room Configuration
MAX_ROOM_PARTICIPANTS=10
ROOM_CLEANUP_INTERVAL=300000  # 5 minutes
```

### Installation

1. **Install dependencies**:
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd server
   npm install
   ```

2. **Start the services**:
   ```bash
   # Start backend
   cd server
   npm run dev

   # Start frontend
   cd client
   npm start
   ```

3. **Start code execution service**:
   ```bash
   cd executor
   npm start
   ```

## 🚀 Usage

### Basic Usage

```tsx
import CollaborativeEditor from './components/CollaborativeEditor';

function App() {
  return (
    <CollaborativeEditor
      roomId="room-123"
      language="javascript"
      initialCode="console.log('Hello World!');"
    />
  );
}
```

### Advanced Configuration

```tsx
<CollaborativeEditor
  roomId="room-123"
  language="python"
  initialCode="# Start coding here"
  onCodeChange={(code) => console.log('Code changed:', code)}
  onUserJoin={(user) => console.log('User joined:', user)}
  onUserLeave={(user) => console.log('User left:', user)}
/>
```

## 🔄 Reconnection Logic

### Automatic Reconnection
- Attempts to reconnect up to 5 times
- Exponential backoff between attempts
- Preserves room state during reconnection
- Syncs with latest code version

### Manual Reconnection
```javascript
// Force reconnection
socket.emit('reconnect-request', { roomId: 'room-123' });
```

### Connection States
- `connected` - Successfully connected
- `disconnected` - Not connected
- `reconnecting` - Attempting to reconnect

## 📊 Performance Optimizations

### Debouncing
- Code changes are debounced by 100ms
- Cursor updates are throttled to 50ms
- Reduces network traffic and improves performance

### Version Control
- Each code change increments version number
- Prevents conflicts with version checking
- Automatic conflict resolution

### Memory Management
- Automatic cleanup of disconnected users
- Room state cleanup when empty
- Cursor cleanup on user disconnect

## 🛡️ Security Features

### Input Validation
- Code length limits (10KB max)
- Language-specific validation
- Dangerous pattern detection

### Authentication
- Firebase authentication integration
- Token-based socket authentication
- User session management

### Rate Limiting
- Socket event rate limiting
- API request rate limiting
- Spam protection

## 🎨 Customization

### Theme Customization
```css
/* Custom theme colors */
.collaborative-editor {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #1e1e1e;
  --text-color: #ffffff;
}
```

### Toast Notifications
```javascript
// Custom toast types
showSuccess('Success', 'Operation completed successfully');
showError('Error', 'Something went wrong');
showInfo('Info', 'Here is some information');
showWarning('Warning', 'Please be careful');
```

### Cursor Colors
```javascript
// Custom cursor color generation
const generateUserColor = (userId) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
  const index = userId.length % colors.length;
  return colors[index];
};
```

## 🧪 Testing

### Manual Testing
1. Open multiple browser tabs
2. Join the same room
3. Test real-time editing
4. Test disconnection/reconnection
5. Test chat functionality

### Automated Testing
```bash
# Run tests
npm test

# Run specific test
npm test -- --testNamePattern="CollaborativeEditor"
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection not established**:
   - Check if backend server is running
   - Verify CORS configuration
   - Check network connectivity

2. **Code not syncing**:
   - Check version numbers
   - Verify room state
   - Check for conflicts

3. **Cursors not showing**:
   - Verify cursor events are being sent
   - Check Monaco Editor decorations
   - Verify user authentication

4. **Chat not working**:
   - Check socket connection
   - Verify room membership
   - Check message format

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug', 'socket.io-client:*');
```

## 📈 Monitoring

### Health Checks
- Socket connection status
- Room state health
- User activity monitoring
- Performance metrics

### Logging
- Connection events
- Code change events
- Error tracking
- Performance monitoring

## 🔮 Future Enhancements

### Planned Features
- **Selection Sharing**: Share text selections
- **File Management**: Multiple file support
- **Version History**: Code change history
- **Comments**: Inline code comments
- **Screen Sharing**: Integrated screen sharing
- **Voice Chat**: Audio communication

### Performance Improvements
- **WebRTC**: Peer-to-peer connections
- **Compression**: Message compression
- **Caching**: Local state caching
- **Optimistic Updates**: Immediate UI updates

## 📚 API Reference

### CollaborativeEditor Props
```typescript
interface CollaborativeEditorProps {
  roomId: string;
  language?: 'javascript' | 'python';
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onUserJoin?: (user: UserInfo) => void;
  onUserLeave?: (user: UserInfo) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}
```

### Socket Events
```typescript
// Join room
socket.emit('join-collab-room', { roomId, language });

// Send code change
socket.emit('code-change', { range, text, roomId, version });

// Send cursor position
socket.emit('cursor-move', { position, roomId, color, displayName });

// Send chat message
socket.emit('send-message', { roomId, message, type });
```

## 🤝 Contributing

When contributing to the collaborative editing system:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test with multiple users
5. Verify reconnection scenarios

## 📄 License

This collaborative editing system is part of the collaborative platform and follows the same license terms. 
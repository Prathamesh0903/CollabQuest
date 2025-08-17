# Collaborative Editor Client Setup Guide

This guide shows you how to set up and use the collaborative code editor client that connects to your Socket.IO backend.

## 🚀 Quick Start

### 1. Prerequisites

- Your Node.js backend server running on `http://localhost:5000`
- A valid JWT token for authentication
- A collaborative session ID

### 2. Setup Steps

1. **Place the files in your web server directory:**
   ```
   your-web-server/
   ├── collaborative-editor.html
   ├── client-example.js
   └── SETUP_GUIDE.md
   ```

2. **Update the configuration in `client-example.js`:**
   ```javascript
   const CONFIG = {
     SERVER_URL: 'http://localhost:5000',
     JWT_TOKEN: 'your-actual-jwt-token-here', // Replace with your token
     SESSION_ID: null, // Will be extracted from URL
     USER_INFO: {
       displayName: 'Your Name',
       avatar: null
     }
   };
   ```

3. **Start your web server** (e.g., using Python, Node.js, or any static file server)

4. **Access the editor** with a session ID:
   ```
   http://localhost:3000/collaborative-editor.html?session=ABC12345
   ```

## 📋 Usage Examples

### Basic Usage

1. **Create a session** using your backend API:
   ```bash
   curl -X POST http://localhost:5000/api/collaborative-sessions \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Collaborative Session",
       "description": "Testing collaborative editing",
       "defaultLanguage": "javascript",
       "isPublic": false
     }'
   ```

2. **Get the session ID** from the response and construct the URL:
   ```
   http://localhost:3000/collaborative-editor.html?session=ABC12345
   ```

3. **Share the URL** with collaborators

### Advanced Usage

#### Protected Sessions with Access Codes

1. **Create a private session:**
   ```bash
   curl -X POST http://localhost:5000/api/collaborative-sessions \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Private Session",
       "description": "Protected collaborative session",
       "defaultLanguage": "javascript",
       "isPublic": false
     }'
   ```

2. **Set an access code:**
   ```bash
   curl -X POST http://localhost:5000/api/collaborative-sessions/ABC12345/access-code \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "accessCode": "secret123",
       "expiresIn": 3600
     }'
   ```

3. **Access with code:**
   ```
   http://localhost:3000/collaborative-editor.html?session=ABC12345&accessCode=secret123
   ```

#### Multiple File Support

The editor supports multiple files in a session:

1. **Create new files** using the "New File" button
2. **Switch between files** using the file tabs
3. **Delete files** using the "Delete File" button

#### Real-time Features

- **Live code editing** - See changes from other users in real-time
- **Cursor tracking** - See where other users are typing
- **Selection highlighting** - See what others have selected
- **Typing indicators** - Know when someone is typing
- **Collaborator list** - See who's in the session

## 🔧 Configuration Options

### Server Configuration

Update the `CONFIG` object in `client-example.js`:

```javascript
const CONFIG = {
  SERVER_URL: 'http://localhost:5000', // Your backend URL
  JWT_TOKEN: 'your-jwt-token',         // Your authentication token
  SESSION_ID: null,                    // Auto-extracted from URL
  USER_INFO: {
    displayName: 'Your Display Name',   // How you appear to others
    avatar: 'https://example.com/avatar.jpg' // Optional avatar URL
  }
};
```

### Editor Configuration

The Monaco Editor is configured with these settings:

```javascript
editor = monaco.editor.create(editorContainer, {
  value: '// Welcome to collaborative coding!',
  language: 'javascript',
  theme: 'vs-dark',
  automaticLayout: true,
  minimap: { enabled: true },
  fontSize: 14,
  lineNumbers: 'on',
  wordWrap: 'on',
  folding: true
});
```

## 🎯 Features Overview

### Real-time Collaboration
- ✅ Live code synchronization
- ✅ Cursor position tracking
- ✅ Text selection highlighting
- ✅ Typing indicators
- ✅ User presence indicators

### File Management
- ✅ Multi-file support
- ✅ File creation and deletion
- ✅ File switching
- ✅ Language detection

### Session Management
- ✅ Join sessions by URL
- ✅ Access code protection
- ✅ Session state recovery
- ✅ Auto-save functionality

### Code Execution
- ✅ Run code in session
- ✅ Shared execution results
- ✅ Console output display

### Persistence
- ✅ Automatic saving
- ✅ Manual save triggers
- ✅ Session statistics
- ✅ State recovery

## 🔌 Socket.IO Events

### Client to Server Events

| Event | Description | Data |
|-------|-------------|------|
| `join-collaborative-session` | Join a session | `{ sessionId, accessCode }` |
| `session-code-change` | Send code changes | `{ sessionId, fileName, range, text, version }` |
| `session-cursor-move` | Send cursor position | `{ sessionId, position, color, displayName }` |
| `session-selection-change` | Send selection | `{ sessionId, selection, color, displayName }` |
| `session-file-create` | Create new file | `{ sessionId, fileName, language, content }` |
| `session-file-delete` | Delete file | `{ sessionId, fileName }` |
| `session-file-switch` | Switch active file | `{ sessionId, fileName }` |
| `execute-code` | Execute code | `{ sessionId, language, code }` |
| `force-save-session` | Force save | `{ sessionId }` |
| `get-session-stats` | Get statistics | `{ sessionId }` |
| `recover-session-state` | Recover state | `{ sessionId, fileName }` |
| `leave-collaborative-session` | Leave session | `{ sessionId }` |

### Server to Client Events

| Event | Description | Data |
|-------|-------------|------|
| `session-state-sync` | Initial session state | `{ sessionId, files, currentFile, version }` |
| `session-code-change` | Code change from others | `{ range, text, fileName, userId, displayName, version }` |
| `session-cursor-move` | Cursor from others | `{ position, userId, color, displayName }` |
| `session-selection-change` | Selection from others | `{ selection, userId, color, displayName }` |
| `users-in-session` | List of collaborators | `[{ userId, displayName, avatar, isTyping, isEditing }]` |
| `user-joined-session` | User joined | `{ userId, displayName, avatar }` |
| `user-left-session` | User left | `{ userId, displayName }` |
| `session-file-created` | File created | `{ file, userId, displayName }` |
| `session-file-deleted` | File deleted | `{ fileName, userId, displayName }` |
| `session-file-switched` | File switched | `{ fileName, file, userId, displayName }` |
| `code-execution-completed` | Code executed | `{ result, executedBy, displayName }` |
| `session-saved` | Session saved | `{ sessionId, saveCount, lastSave }` |
| `session-stats` | Session statistics | `{ totalFiles, saveCount, lastSave, isDirty }` |

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if your backend server is running
   - Verify the `SERVER_URL` in the config
   - Check browser console for errors

2. **Authentication Error**
   - Ensure your JWT token is valid
   - Check token expiration
   - Verify token format

3. **Session Not Found**
   - Verify the session ID in the URL
   - Check if the session exists in your database
   - Ensure the session is active

4. **Code Changes Not Syncing**
   - Check WebSocket connection status
   - Verify event handlers are properly set up
   - Check browser console for errors

5. **Monaco Editor Not Loading**
   - Check internet connection (Monaco loads from CDN)
   - Verify RequireJS configuration
   - Check browser console for loading errors

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem('debug', 'socket.io-client:*');
```

### Performance Tips

1. **Reduce cursor update frequency** for better performance
2. **Use debouncing** for code change events
3. **Limit file size** for large codebases
4. **Monitor memory usage** with many collaborators

## 📱 Mobile Support

The editor is responsive and works on mobile devices:

- Touch-friendly interface
- Responsive sidebar
- Mobile-optimized toolbar
- Touch gesture support

## 🔒 Security Considerations

1. **Always use HTTPS** in production
2. **Validate JWT tokens** on the server
3. **Implement rate limiting** for Socket.IO events
4. **Sanitize user input** before broadcasting
5. **Use access codes** for private sessions

## 🚀 Production Deployment

1. **Build for production:**
   - Minify JavaScript files
   - Optimize CSS
   - Use CDN for Monaco Editor

2. **Configure environment variables:**
   ```javascript
   const CONFIG = {
     SERVER_URL: process.env.BACKEND_URL || 'http://localhost:5000',
     JWT_TOKEN: getTokenFromAuth(), // Implement your auth system
     // ... other config
   };
   ```

3. **Set up monitoring:**
   - WebSocket connection monitoring
   - Error tracking
   - Performance monitoring

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Your Backend API Documentation](#)

## 🤝 Contributing

To contribute to this collaborative editor:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

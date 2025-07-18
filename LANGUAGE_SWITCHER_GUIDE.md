# Language Switcher Feature Guide

This guide explains the implementation of the language switcher feature that allows users to switch between Python and JavaScript in the collaborative coding platform.

## Overview

The language switcher provides:
- **Real-time language switching** between Python and JavaScript
- **Monaco Editor language mode updates** for proper syntax highlighting
- **Collaborative language changes** synchronized across all users in a room
- **Code execution with correct language** sent to the backend
- **Default code templates** for each language

## Components

### 1. LanguageSwitcher Component (`client/src/components/LanguageSwitcher.tsx`)

A reusable React component that provides the UI for language selection.

**Features:**
- Visual language selection with icons (⚡ JavaScript, 🐍 Python)
- Active state highlighting
- Disabled state when disconnected
- Responsive design for mobile devices
- Tooltips with language descriptions

**Props:**
- `currentLanguage`: Current selected language
- `onLanguageChange`: Callback when language changes
- `disabled`: Whether the switcher is disabled

### 2. LanguageSwitcherDemo Component (`client/src/components/LanguageSwitcherDemo.tsx`)

A standalone demo component for testing the language switcher functionality.

**Usage:**
```tsx
import LanguageSwitcherDemo from './components/LanguageSwitcherDemo';

// In your app
<LanguageSwitcherDemo />
```

## Integration with CollaborativeEditor

### Language State Management

The `CollaborativeEditor` component now manages language state:

```tsx
const [language, setLanguage] = useState<'javascript' | 'python'>(initialLanguage);
```

### Language Change Handler

```tsx
const handleLanguageChange = (newLanguage: 'javascript' | 'python') => {
  if (newLanguage === language) return;
  
  setLanguage(newLanguage);
  
  // Update Monaco Editor language
  if (editorRef.current) {
    const model = editorRef.current.getModel();
    if (model) {
      // Change the model's language
      (window as any).monaco.editor.setModelLanguage(model, newLanguage);
      
      // Update code with default for new language
      const newDefaultCode = getDefaultCode(newLanguage);
      model.setValue(newDefaultCode);
      setCode(newDefaultCode);
      
      // Notify other users about language change
      if (socketRef.current && connectionStatus === 'connected') {
        socketRef.current.emit('language-change', {
          roomId,
          language: newLanguage,
          code: newDefaultCode
        });
      }
    }
  }
  
  // Show notification
  showInfo('Language Changed', `Switched to ${newLanguage.charAt(0).toUpperCase() + newLanguage.slice(1)}`);
};
```

### UI Integration

The language switcher is integrated into the editor footer:

```tsx
<div className="editor-footer">
  <LanguageSwitcher
    currentLanguage={language}
    onLanguageChange={handleLanguageChange}
    disabled={connectionStatus !== 'connected'}
  />
  <div className="editor-stats">
    <span>Lines: {code.split('\n').length}</span>
    <span>Characters: {code.length}</span>
  </div>
</div>
```

## Backend Integration

### 1. Code Execution Endpoint

Added to `server/routes/rooms.js`:

```javascript
// Execute code in a room
router.post('/:roomId/execute', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { language, code, input = '' } = req.body;

    // Validate inputs
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required'
      });
    }

    // Validate language
    if (!['javascript', 'python'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language. Supported: javascript, python'
      });
    }

    // Execute the code
    const result = await executeCode(language, code, input);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Code execution failed'
    });
  }
});
```

### 2. Socket.IO Language Change Handler

Added to `server/utils/socketHandler.js`:

```javascript
// Handle language changes in collaborative editing
socket.on('language-change', async (data) => {
  try {
    const { roomId, language, code } = data;
    
    if (!socket.user) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const roomState = roomStates.get(roomId);
    if (!roomState) {
      socket.emit('error', { message: 'Room state not found' });
      return;
    }

    // Update room state with new language and code
    roomState.language = language;
    roomState.code = code;
    roomState.version += 1;
    roomState.lastModified = new Date();
    roomState.lastModifiedBy = socket.user._id.toString();

    // Broadcast language change to all users in the room
    io.in(`collab-room:${roomId}`).emit('language-change', {
      language,
      code,
      userId: socket.user._id.toString(),
      displayName: socket.user.displayName || socket.user.email || 'Anonymous',
      timestamp: new Date()
    });

    console.log(`Language changed to ${language} by user ${socket.user.displayName} in room ${roomId}`);
  } catch (error) {
    console.error('Error handling language change:', error);
    socket.emit('error', { message: 'Failed to change language' });
  }
});
```

## Default Code Templates

### JavaScript Template
```javascript
// Welcome to JavaScript Collaborative Editor
// Start coding with your team!

function helloWorld() {
    console.log("Hello, Collaborative World!");
}

// Add your JavaScript code here
```

### Python Template
```python
# Welcome to Python Collaborative Editor
# Start coding with your team!

def hello_world():
    print("Hello, Collaborative World!")
    
# Add your Python code here
```

## Code Execution Flow

1. **User clicks "Run Code"** in the CollaborativeEditor
2. **Frontend sends request** to `/api/rooms/${roomId}/execute`
3. **Request includes:**
   - `language`: Current language ('javascript' or 'python')
   - `code`: Current editor content
   - `input`: Custom input (if any)
4. **Backend validates** language and code
5. **Code execution** via `executeCode()` function
6. **Result returned** to frontend for display in terminal

## Real-time Collaboration Features

### Language Change Synchronization

When a user changes the language:
1. **Local update**: Monaco Editor language mode changes
2. **Code reset**: Editor content replaced with default code for new language
3. **Socket emission**: `language-change` event sent to server
4. **Server broadcast**: All users in room receive the change
5. **Remote updates**: Other users' editors update automatically

### User Activity Notifications

Language changes trigger user activity notifications:
- Shows who changed the language
- Displays in toast notifications
- Logs in console for debugging

## Styling and Responsive Design

### CSS Features
- **Modern gradient design** with backdrop blur effects
- **Smooth animations** and hover effects
- **Responsive layout** that adapts to mobile screens
- **Dark theme support** with proper contrast
- **Accessibility features** with proper focus states

### Mobile Responsiveness
- **Stacked layout** on small screens
- **Icon-only display** with tooltips
- **Touch-friendly** button sizes
- **Optimized spacing** for mobile devices

## Testing

### Manual Testing
1. **Start the demo**: Use `LanguageSwitcherDemo` component
2. **Test language switching**: Click between JavaScript and Python
3. **Test disabled state**: Toggle connection status
4. **Test responsiveness**: Resize browser window
5. **Test collaboration**: Open multiple browser tabs

### Integration Testing
1. **Join collaborative room** with multiple users
2. **Change language** and verify synchronization
3. **Run code** with different languages
4. **Test reconnection** scenarios

## Error Handling

### Frontend Errors
- **Invalid language**: Prevents switching to unsupported languages
- **Connection issues**: Disables switcher when disconnected
- **Editor errors**: Graceful fallback if Monaco Editor fails

### Backend Errors
- **Authentication**: Requires valid user token
- **Room validation**: Ensures room exists and user has access
- **Language validation**: Only allows supported languages
- **Execution errors**: Proper error messages for code execution failures

## Future Enhancements

### Potential Features
1. **More languages**: Add support for Java, C++, C#, etc.
2. **Language-specific settings**: Custom themes, extensions per language
3. **Language preferences**: Remember user's preferred language
4. **Language detection**: Auto-detect language from code content
5. **Custom templates**: Allow users to create custom code templates

### Performance Optimizations
1. **Lazy loading**: Load language support on demand
2. **Caching**: Cache language configurations
3. **Debouncing**: Prevent rapid language changes
4. **Compression**: Compress language change events

## Troubleshooting

### Common Issues

1. **Language not switching**
   - Check Monaco Editor is properly loaded
   - Verify socket connection is active
   - Check browser console for errors

2. **Code execution fails**
   - Verify backend executor service is running
   - Check language validation on backend
   - Review code execution logs

3. **Collaboration not working**
   - Ensure all users are authenticated
   - Check socket connection status
   - Verify room state management

### Debug Commands

```javascript
// Check current language
console.log('Current language:', language);

// Check Monaco Editor model
console.log('Editor model:', editorRef.current?.getModel());

// Check socket connection
console.log('Socket connected:', socketRef.current?.connected);

// Check room state
console.log('Room state:', roomStates.get(roomId));
```

## API Reference

### Frontend API

#### LanguageSwitcher Props
```typescript
interface LanguageSwitcherProps {
  currentLanguage: 'javascript' | 'python';
  onLanguageChange: (language: 'javascript' | 'python') => void;
  disabled?: boolean;
}
```

#### CollaborativeEditor Language Methods
```typescript
// Change language
handleLanguageChange(newLanguage: 'javascript' | 'python'): void

// Get default code for language
getDefaultCode(lang?: 'javascript' | 'python'): string
```

### Backend API

#### Execute Code Endpoint
```
POST /api/rooms/:roomId/execute
Content-Type: application/json
Authorization: Bearer <token>

{
  "language": "javascript" | "python",
  "code": "string",
  "input": "string" (optional)
}
```

#### Socket Events
```javascript
// Emit language change
socket.emit('language-change', {
  roomId: string,
  language: 'javascript' | 'python',
  code: string
});

// Listen for language change
socket.on('language-change', (data) => {
  // Handle language change from other users
});
```

This implementation provides a robust, user-friendly language switching system that integrates seamlessly with the existing collaborative coding platform. 
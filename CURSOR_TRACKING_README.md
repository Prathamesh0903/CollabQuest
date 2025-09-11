# Real-time Cursor Tracking Implementation

This document describes the implementation of real-time cursor tracking similar to IntelliJ Code With Me for the BattlePlay component.

## Features Implemented

### 1. Real-time Cursor Position Tracking
- **Monaco Editor Integration**: Uses `onDidChangeCursorPosition` to track cursor movements
- **Socket.io Events**: Emits `cursor-position` events to broadcast cursor coordinates
- **Visual Cursors**: Displays colored cursors for each participant with their usernames

### 2. User Selection Tracking
- **Selection Detection**: Uses `onDidChangeCursorSelection` to track text selections
- **Visual Selections**: Shows highlighted text selections with user labels
- **Real-time Updates**: Broadcasts selection changes via `user-selection` events

### 3. Enhanced Socket Communication
- **Custom useSocket Hook**: Centralized socket management with cursor event handling
- **Battle Mode Support**: Separate room channels for battle vs collaborative modes
- **User Color Generation**: Consistent color assignment for each user

## File Structure

```
client/src/
├── hooks/
│   └── useSocket.ts                 # Custom socket hook with cursor support
├── components/Battle/
│   ├── BattlePlay.tsx              # Enhanced with cursor tracking
│   ├── CursorDisplay.tsx           # Cursor visualization component
│   └── CursorDisplay.css           # Styling for cursors and selections
└── ...

server/
└── utils/
    └── socketHandler.js            # Enhanced with cursor events
```

## Implementation Details

### Frontend Components

#### useSocket Hook (`client/src/hooks/useSocket.ts`)
- Manages socket connection and authentication
- Handles cursor position and selection events
- Provides methods to emit cursor data
- Generates consistent user colors
- Manages user cursor and selection state

#### CursorDisplay Component (`client/src/components/Battle/CursorDisplay.tsx`)
- Renders colored cursors for other users
- Displays user selections with highlighting
- Calculates pixel positions from Monaco Editor coordinates
- Shows user avatars and names on hover
- Filters out current user's cursor

#### Enhanced BattlePlay Component
- Integrates Monaco Editor with cursor tracking
- Uses `onDidChangeCursorPosition` for real-time updates
- Uses `onDidChangeCursorSelection` for selection tracking
- Only tracks during active battle (not when read-only)

### Backend Implementation

#### Socket Events (`server/utils/socketHandler.js`)
- `cursor-position`: Broadcasts cursor position changes
- `user-selection`: Broadcasts text selection changes
- Battle room support with separate channels
- User authentication and validation
- Consistent color generation

#### Room Management
- Enhanced `join-room` handler to support battle mode
- Separate socket rooms for battle vs collaborative modes
- User state management for cursors and selections

## Usage

### Basic Integration

```typescript
import { useSocket } from '../../hooks/useSocket';
import CursorDisplay from './CursorDisplay';

const BattlePlay = () => {
  const {
    userCursors,
    userSelections,
    emitCursorPosition,
    emitSelectionChange
  } = useSocket({
    roomId,
    mode: 'battle',
    // ... other options
  });

  return (
    <div className="editor-container" ref={editorRef}>
      <Editor
        onMount={(editor) => {
          editor.onDidChangeCursorPosition((e) => {
            emitCursorPosition({
              lineNumber: e.position.lineNumber,
              column: e.position.column
            });
          });
          
          editor.onDidChangeCursorSelection((e) => {
            if (!e.selection.isEmpty()) {
              emitSelectionChange({
                startLineNumber: e.selection.startLineNumber,
                startColumn: e.selection.startColumn,
                endLineNumber: e.selection.endLineNumber,
                endColumn: e.selection.endColumn
              });
            }
          });
        }}
      />
      <CursorDisplay
        userCursors={userCursors}
        userSelections={userSelections}
        currentUserId={currentUser?.uid}
        editorRef={editorRef}
      />
    </div>
  );
};
```

### Socket Events

#### Emitting Cursor Position
```typescript
emitCursorPosition({
  lineNumber: 5,
  column: 10
});
```

#### Emitting Selection
```typescript
emitSelectionChange({
  startLineNumber: 3,
  startColumn: 5,
  endLineNumber: 3,
  endColumn: 15
});
```

## Visual Features

### Cursor Display
- **Colored Cursors**: Each user gets a unique color
- **Blinking Animation**: Cursors blink to indicate activity
- **User Labels**: Hover to see username and avatar
- **Position Accuracy**: Precise pixel positioning

### Selection Display
- **Highlighted Text**: Selected text is highlighted with user color
- **Semi-transparent**: Selections don't obstruct code readability
- **User Labels**: Shows who made the selection
- **Multi-line Support**: Handles selections across multiple lines

## Performance Considerations

### Optimization Features
- **Debounced Updates**: Cursor positions are throttled to prevent spam
- **Viewport Culling**: Only renders cursors/selections in visible area
- **Memory Management**: Cleans up old cursor/selection data
- **Efficient Rendering**: Uses CSS transforms for smooth animations

### Network Efficiency
- **Event Throttling**: Limits cursor position updates
- **Room-based Broadcasting**: Only sends to relevant participants
- **Minimal Payload**: Sends only necessary data

## Testing

### Manual Testing
1. Open multiple browser tabs/windows
2. Join the same battle room
3. Move cursors and make selections
4. Verify real-time updates across all participants

### Automated Testing
```bash
# Run the test script
node test-cursor-tracking.js
```

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **WebSocket Support**: Required for real-time communication
- **CSS Grid/Flexbox**: Used for layout (IE11+)

## Future Enhancements

### Potential Improvements
1. **Cursor History**: Show cursor movement trails
2. **Click Tracking**: Track mouse clicks and interactions
3. **Typing Indicators**: Show when users are actively typing
4. **Follow Mode**: Allow users to follow another participant's cursor
5. **Cursor Themes**: Customizable cursor styles and animations

### Performance Optimizations
1. **WebGL Rendering**: For better performance with many cursors
2. **Virtual Scrolling**: Only render visible cursors
3. **Compression**: Compress cursor data for large rooms
4. **Caching**: Cache cursor positions for reconnection

## Troubleshooting

### Common Issues

#### Cursors Not Appearing
- Check socket connection status
- Verify room joining with correct mode
- Ensure Monaco Editor is properly mounted

#### Positioning Issues
- Verify editor container has proper positioning
- Check for CSS conflicts with z-index
- Ensure editor is not in read-only mode

#### Performance Issues
- Reduce cursor update frequency
- Limit number of concurrent users
- Check for memory leaks in cursor state

### Debug Mode
Enable debug logging by setting:
```typescript
localStorage.setItem('cursor-debug', 'true');
```

## Security Considerations

- **Authentication**: All cursor events require valid user tokens
- **Room Validation**: Users can only join authorized rooms
- **Rate Limiting**: Prevents cursor position spam
- **Data Sanitization**: Validates all cursor coordinates

## Conclusion

The cursor tracking implementation provides a seamless real-time collaboration experience similar to IntelliJ Code With Me. The modular design allows for easy extension and customization while maintaining good performance and user experience.

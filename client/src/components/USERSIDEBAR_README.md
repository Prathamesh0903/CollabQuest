# UserSidebar Component

A comprehensive sidebar component for displaying active users in collaborative environments with real-time status updates, typing indicators, and editing indicators using Socket.IO.

## 🎯 **Core Features**

### ✅ **User Status Display**
- **Online/Offline Status**: Real-time connection status with visual indicators
- **User Avatars**: Support for custom avatars or generated initials with color coding
- **Status Types**: Online, Away, Busy, Offline with appropriate icons
- **Last Seen**: Timestamps for offline users

### ✅ **Real-time Activity Indicators**
- **Typing Indicators**: Shows when users are typing in chat (✏️)
- **Editing Indicators**: Shows when users are editing code (💻)
- **Custom Status Messages**: Users can set custom status messages
- **Live Updates**: All indicators update in real-time via Socket.IO

### ✅ **Interactive Features**
- **User Search**: Filter users by name
- **Expandable Details**: Click users to see more information
- **User Actions**: Message and profile buttons for each user
- **Responsive Design**: Adapts to different screen sizes

## 📁 **Files Created**

1. **`UserSidebar.tsx`** - Main sidebar component
2. **`UserSidebar.css`** - Comprehensive styling
3. **`UserSidebarDemo.tsx`** - Demo component for testing
4. **`USERSIDEBAR_README.md`** - This documentation

## 🔧 **Integration with Backend**

### Socket.IO Events

The component expects these Socket.IO events from your backend:

#### **User List Updates**
```javascript
// Emitted when users join/leave the room
socket.on('users-in-room', (users: UserInfo[]) => {
  // Update sidebar users
});
```

#### **Typing Indicators**
```javascript
// Emitted when users start/stop typing
socket.on('user-typing', (data: {
  userId: string;
  displayName: string;
  isTyping: boolean;
}) => {
  // Update typing status
});
```

#### **Editing Indicators**
```javascript
// Emitted when users start/stop editing code
socket.on('user-editing', (data: {
  userId: string;
  displayName: string;
  isEditing: boolean;
}) => {
  // Update editing status
});
```

#### **Status Updates**
```javascript
// Emitted when users update their status
socket.on('user-status-updated', (data: {
  userId: string;
  displayName: string;
  status: string;
  customMessage?: string;
}) => {
  // Update user status
});
```

### Backend Implementation

Your backend should emit these events:

```javascript
// When a user joins the room
io.in(`collab-room:${roomId}`).emit('users-in-room', usersInRoom);

// When a user starts typing
socket.to(`room:${roomId}`).emit('user-typing', {
  userId: socket.user._id,
  displayName: socket.user.displayName,
  isTyping: true
});

// When a user starts editing
socket.to(`collab-room:${roomId}`).emit('user-editing', {
  userId: socket.user._id,
  displayName: socket.user.displayName,
  isEditing: true
});
```

## 🚀 **Usage**

### Basic Implementation

```tsx
import React, { useState } from 'react';
import UserSidebar, { UserInfo } from './UserSidebar';

const MyComponent: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div>
      <UserSidebar
        users={users}
        currentUserId="current-user-id"
        roomId="room-123"
        isVisible={showSidebar}
        onToggle={() => setShowSidebar(!showSidebar)}
        onUserClick={(user) => {
          console.log('User clicked:', user);
          // Handle user click (e.g., open profile, start DM)
        }}
      />
      
      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        {/* Your main content */}
      </div>
    </div>
  );
};
```

### UserInfo Interface

```tsx
interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  socketId: string;
  online: boolean;
  isTyping?: boolean;
  isEditing?: boolean;
  lastSeen?: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
  customMessage?: string;
  color?: string;
}
```

## 🎨 **Styling**

The component includes comprehensive CSS with:

- **Dark theme** optimized for code editors
- **Smooth animations** for all interactions
- **Responsive design** for mobile devices
- **Custom scrollbars** for better UX
- **Hover effects** and focus states
- **Status color coding** for different states

### Customization

You can override styles by targeting CSS classes:

```css
.user-sidebar {
  /* Custom sidebar styles */
}

.user-item.online {
  /* Custom online user styles */
}

.user-item.offline {
  /* Custom offline user styles */
}

.status-indicator {
  /* Custom status indicator styles */
}
```

## 📱 **Responsive Design**

The sidebar adapts to different screen sizes:

- **Desktop**: Full sidebar (320px width)
- **Tablet**: Compact sidebar (280px width)
- **Mobile**: Full-width overlay sidebar

## 🔧 **Advanced Features**

### Typing Indicators

The component automatically handles typing indicators for chat:

```tsx
// In your chat input component
const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setChatInput(e.target.value);
  
  if (socket && e.target.value.trim()) {
    socket.emit('typing-start', { roomId });
  } else {
    socket.emit('typing-stop', { roomId });
  }
};
```

### Editing Indicators

For code editors, emit editing events:

```tsx
// In your code editor
editor.onDidChangeModelContent(() => {
  if (socket) {
    socket.emit('editing-start', { roomId });
    
    // Clear editing indicator after 2 seconds
    setTimeout(() => {
      socket.emit('editing-stop', { roomId });
    }, 2000);
  }
});
```

### User Status Updates

Allow users to update their status:

```tsx
const updateUserStatus = (status: string, customMessage?: string) => {
  if (socket) {
    socket.emit('update-status', { status, customMessage });
  }
};
```

## 🎯 **Examples**

### User Statuses

```
🟢 Online - User is actively using the application
🟡 Away - User is away from keyboard
🔴 Busy - User is busy/do not disturb
🔴 Offline - User is disconnected
✏️ Typing - User is typing in chat
💻 Editing - User is editing code
```

### User Interactions

```tsx
// Handle user clicks
const handleUserClick = (user: UserInfo) => {
  if (user.userId === currentUserId) {
    // Open user profile
    openUserProfile();
  } else {
    // Start direct message
    startDirectMessage(user.userId);
  }
};
```

## 🚀 **Performance Optimizations**

- **Debounced updates** for typing indicators
- **Throttled cursor** position updates
- **Efficient re-renders** with React.memo
- **Lazy loading** for user avatars
- **Optimized animations** with CSS transforms

## 🔒 **Security Considerations**

- **User authentication** required for all socket events
- **Room-based permissions** for user visibility
- **Input sanitization** for user messages and status
- **Rate limiting** for typing/editing indicators

## 📋 **Browser Support**

- Chrome 66+
- Firefox 63+
- Safari 13.1+
- Edge 79+

## 🎉 **Getting Started**

1. **Install dependencies** (Socket.IO client)
2. **Import the component** in your React app
3. **Set up Socket.IO** connection
4. **Configure backend events** for real-time updates
5. **Style the component** to match your app theme
6. **Test with multiple users** to see real-time updates

## 📚 **Additional Resources**

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Hooks Guide](https://reactjs.org/docs/hooks-intro.html)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

The UserSidebar component provides a complete solution for displaying active users in collaborative applications with real-time status updates and activity indicators. It's designed to be highly customizable and performant while providing an excellent user experience. 
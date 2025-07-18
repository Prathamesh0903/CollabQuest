# 🚀 Real-Time Chat Feature with Socket.IO

A comprehensive guide to building a real-time chat system using Socket.IO, React, Node.js, and MongoDB.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Component Documentation](#component-documentation)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This chat feature provides real-time messaging capabilities with the following key characteristics:

- **Real-time communication** using Socket.IO
- **Room-based message isolation** - messages only visible to room participants
- **Message persistence** in MongoDB database
- **User authentication** via Firebase
- **Typing indicators** and message reactions
- **Modern, responsive UI** with dark theme

## ✨ Features

### Core Features
- ✅ **Real-time messaging** with instant delivery
- ✅ **Room-based isolation** - messages isolated by room ID
- ✅ **Sender information** - name, avatar, user details
- ✅ **Message timestamps** - formatted display of message times
- ✅ **Message persistence** - all messages stored in database
- ✅ **User authentication** - secure access control

### Advanced Features
- ✅ **Typing indicators** - shows when users are typing
- ✅ **Message reactions** - emoji reactions on messages
- ✅ **Message editing** - users can edit their own messages (5-minute window)
- ✅ **Message deletion** - soft delete with proper permissions
- ✅ **Load more messages** - pagination for message history
- ✅ **Responsive design** - works on desktop and mobile
- ✅ **Connection status** - real-time connection monitoring

## 🏗️ Architecture

### Backend Components

```
server/
├── models/
│   └── Message.js          # Message schema and methods
├── routes/
│   └── messages.js         # REST API endpoints
├── utils/
│   └── socketHandler.js    # Socket.IO event handlers
└── server.js              # Main server with Socket.IO setup
```

### Frontend Components

```
client/src/components/
├── Chat.tsx               # Main chat component
├── Chat.css              # Chat styling
├── ChatDemo.tsx          # Demo component
├── ChatDemo.css          # Demo styling
└── CollaborativeEditor.tsx # Integration with editor
```

### Data Flow

1. **User sends message** → Socket.IO event → Server
2. **Server validates** → Saves to database → Broadcasts to room
3. **Other users receive** → Real-time update → UI updates

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB
- Firebase project (for authentication)

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp env.example .env

# Configure environment variables
MONGODB_URI=mongodb://localhost:27017/your-database
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
```

### 3. Database Setup

The Message model will be automatically created when the server starts. Ensure MongoDB is running:

```bash
# Start MongoDB (if using local installation)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

## 📖 Usage Guide

### Basic Chat Usage

#### 1. Join a Room

```typescript
// Join a room via Socket.IO
socket.emit('join-room', { roomId: 'room-123' });

// Listen for room join confirmation
socket.on('room-joined', (data) => {
  console.log('Joined room:', data);
});
```

#### 2. Send a Message

```typescript
// Send a message
socket.emit('send-message', {
  roomId: 'room-123',
  content: 'Hello, world!',
  type: 'text'
});

// Listen for message confirmation
socket.on('message-sent', (message) => {
  console.log('Message sent:', message);
});
```

#### 3. Receive Messages

```typescript
// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});
```

### Using the Chat Component

#### Basic Implementation

```tsx
import Chat from './components/Chat';

function App() {
  const [socket, setSocket] = useState(null);
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      <Chat
        roomId="room-123"
        socket={socket}
        isVisible={showChat}
        onToggle={() => setShowChat(!showChat)}
      />
    </div>
  );
}
```

#### Integration with Collaborative Editor

```tsx
// In CollaborativeEditor.tsx
<Chat
  roomId={roomId}
  socket={socketRef.current}
  isVisible={showChatPanel}
  onToggle={() => setShowChatPanel(!showChatPanel)}
/>
```

### Advanced Features

#### Typing Indicators

```typescript
// Start typing indicator
socket.emit('typing-start', { roomId: 'room-123' });

// Stop typing indicator
socket.emit('typing-stop', { roomId: 'room-123' });

// Listen for typing indicators
socket.on('user-typing', (data) => {
  console.log(`${data.displayName} is typing`);
});
```

#### Message Reactions

```typescript
// Add reaction to message
const response = await fetch(`/api/messages/${messageId}/reactions`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ emoji: '👍' })
});
```

#### Message Editing

```typescript
// Edit a message (within 5 minutes)
const response = await fetch(`/api/messages/${messageId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ content: 'Updated message' })
});
```

## 🔌 API Reference

### Message Endpoints

#### GET `/api/messages/room/:roomId`
Get messages for a room with pagination.

**Query Parameters:**
- `limit` (number): Number of messages to return (default: 50)
- `skip` (number): Number of messages to skip (default: 0)

**Response:**
```json
{
  "messages": [...],
  "hasMore": true,
  "total": 150
}
```

#### POST `/api/messages/room/:roomId`
Send a new message.

**Body:**
```json
{
  "content": "Message content",
  "type": "text",
  "metadata": {}
}
```

#### PUT `/api/messages/:messageId`
Edit a message.

**Body:**
```json
{
  "content": "Updated message content"
}
```

#### DELETE `/api/messages/:messageId`
Delete a message (soft delete).

#### POST `/api/messages/:messageId/reactions`
Add/remove reaction to a message.

**Body:**
```json
{
  "emoji": "👍"
}
```

### Socket.IO Events

#### Client to Server

- `join-room`: Join a room
- `leave-room`: Leave a room
- `send-message`: Send a message
- `typing-start`: Start typing indicator
- `typing-stop`: Stop typing indicator

#### Server to Client

- `room-joined`: Confirmation of room join
- `new-message`: New message received
- `message-sent`: Confirmation of message sent
- `user-typing`: User typing indicator
- `user-joined-room`: User joined room
- `user-left-room`: User left room

## 🧩 Component Documentation

### Chat Component

The main chat component with full real-time functionality.

**Props:**
```typescript
interface ChatProps {
  roomId: string;           // Room identifier
  socket: any;             // Socket.IO instance
  isVisible: boolean;      // Whether chat is visible
  onToggle: () => void;    // Toggle visibility callback
}
```

**Features:**
- Real-time message updates
- Typing indicators
- Message reactions
- Load more messages
- Auto-scroll to bottom
- Responsive design

### ChatDemo Component

A standalone demo component for testing the chat feature.

**Usage:**
```tsx
import ChatDemo from './components/ChatDemo';

function App() {
  return <ChatDemo />;
}
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/your-database
CLIENT_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

**Frontend:**
Update the Socket.IO server URL in components:
```typescript
const socket = io('http://localhost:5000', {
  auth: { token },
  reconnection: true
});
```

### Message Types

Supported message types:
- `text`: Regular text message
- `system`: System notification
- `code`: Code snippet
- `file`: File attachment
- `reaction`: Message reaction

### Room Types

- `public`: Anyone can join
- `private`: Only invited users can join
- `team`: Team-specific rooms

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Issues

**Problem:** Socket.IO connection fails
**Solution:** 
- Check server is running on correct port
- Verify CORS configuration
- Check authentication token

#### 2. Messages Not Persisting

**Problem:** Messages disappear after page reload
**Solution:**
- Verify MongoDB connection
- Check Message model is properly imported
- Ensure database permissions

#### 3. Room Access Issues

**Problem:** Users can't access private rooms
**Solution:**
- Verify user authentication
- Check room participant list
- Ensure proper room permissions

#### 4. Typing Indicators Not Working

**Problem:** Typing indicators don't show
**Solution:**
- Check Socket.IO event handlers
- Verify client-side event emission
- Check network connectivity

### Debug Mode

Enable debug logging:

```typescript
// Backend
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
  debug: true
});

// Frontend
const socket = io('http://localhost:5000', {
  debug: true
});
```

### Performance Optimization

1. **Message Pagination:** Load messages in chunks
2. **Debounced Typing:** Reduce typing indicator frequency
3. **Connection Pooling:** Optimize database connections
4. **Message Caching:** Cache recent messages

## 🚀 Deployment

### Production Setup

1. **Environment Variables:**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   CLIENT_URL=https://your-domain.com
   ```

2. **Build Frontend:**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy Backend:**
   ```bash
   cd server
   npm start
   ```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [MongoDB with Mongoose](https://mongoosejs.com/docs/)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Chatting! 💬** 
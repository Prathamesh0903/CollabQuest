# Quick Start Guide - Collaborative Coding System

Get your real-time collaborative coding environment up and running in minutes!

## 🚀 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## ⚡ Quick Setup (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd collaborative-coding-platform

# Install all dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ../executor && npm install
cd ..
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your settings
# (See Configuration section below)
```

### 3. Start the System
```bash
# Start all services with Docker Compose
docker-compose up --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Code Executor**: http://localhost:5001

## 🔧 Configuration

### Basic Configuration (.env)
```env
# Main Server
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/collaborative-coding
CLIENT_URL=http://localhost:3000

# Code Execution
EXECUTOR_URL=http://localhost:5001
JUDGE0_API_KEY=your-judge0-api-key  # Optional

# Firebase (for authentication)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Optional: Judge0 API Key
For enhanced code execution reliability, get a free API key from [Judge0](https://rapidapi.com/judge0-official/api/judge0-ce/).

## 🎯 First Steps

### 1. Create an Account
1. Open http://localhost:3000
2. Click "Sign Up" or "Login"
3. Complete authentication

### 2. Create a Collaborative Room
1. Click "Create Room" or "Join Room"
2. Choose a room name and settings
3. Share the room link with collaborators

### 3. Start Coding Together
1. **Real-time Editing**: See changes as they happen
2. **Cursor Tracking**: View other users' cursor positions
3. **Code Execution**: Run code and see results together
4. **Language Switching**: Switch between JavaScript and Python

## 🧪 Testing the System

### Run the Test Suite
```bash
# Test collaborative features
node test-collaborative-features.js
```

### Manual Testing
1. Open the app in multiple browser tabs
2. Join the same room with different accounts
3. Try editing code simultaneously
4. Test code execution
5. Verify cursor tracking

## 🔍 Troubleshooting

### Common Issues

**Docker not running**
```bash
# Start Docker Desktop first
# Then run:
docker-compose up --build
```

**Port conflicts**
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5000
lsof -i :5001

# Kill processes if needed
kill -9 <PID>
```

**MongoDB connection issues**
```bash
# Start MongoDB locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Code execution not working**
```bash
# Check Docker is running
docker ps

# Check executor service
curl http://localhost:5001/health

# Check logs
docker-compose logs executor
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* docker-compose up

# Monitor specific services
DEBUG=socket.io* docker-compose up
DEBUG=executor* docker-compose up
```

## 📱 Features Overview

### Real-Time Collaboration
- ✅ **Live Code Editing** - See changes instantly
- ✅ **Cursor Tracking** - View other users' cursors
- ✅ **Selection Sharing** - See text selections
- ✅ **User Presence** - Know who's online
- ✅ **Activity Indicators** - See who's editing

### Code Execution
- ✅ **Secure Containers** - Isolated execution
- ✅ **Multiple Languages** - JavaScript & Python
- ✅ **Real-time Results** - All users see output
- ✅ **Input Support** - Custom input for programs
- ✅ **Error Handling** - Clear error messages

### User Experience
- ✅ **VS Code-like UI** - Familiar interface
- ✅ **User Avatars** - Visual identification
- ✅ **Connection Status** - Real-time status
- ✅ **Keyboard Shortcuts** - Quick actions
- ✅ **Responsive Design** - Works on mobile

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run code |
| `Ctrl+\`` | Toggle terminal |
| `Esc` | Close terminal |
| `Ctrl+S` | Save (auto-save enabled) |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## 🔗 API Endpoints

### Real-time Events (Socket.IO)
- `join-collab-room` - Join collaborative room
- `code-change` - Send code changes
- `cursor-move` - Broadcast cursor position
- `execute-code` - Request code execution

### REST API
- `POST /api/rooms/:roomId/execute` - Execute code
- `GET /api/health` - Health check
- `GET /api/users` - Get users

## 🚀 Production Deployment

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build

# Use environment variables
NODE_ENV=production docker-compose up
```

### Manual Deployment
```bash
# Build client
cd client && npm run build

# Start server
cd server && npm start

# Start executor
cd executor && npm start
```

## 📞 Support

### Getting Help
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Full Documentation](ENHANCED_COLLABORATIVE_CODING.md)
3. Check [GitHub Issues](https://github.com/your-repo/issues)
4. Contact support team

### Reporting Issues
When reporting issues, please include:
- Browser and version
- Operating system
- Error messages
- Steps to reproduce
- Expected vs actual behavior

## 🎉 You're Ready!

Your collaborative coding system is now running! 

**Next steps:**
1. Invite team members to your room
2. Start coding together in real-time
3. Explore advanced features
4. Customize the system for your needs

**Happy collaborative coding! 🚀** 
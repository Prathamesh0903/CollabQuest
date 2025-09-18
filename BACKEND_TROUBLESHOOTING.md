# Backend Troubleshooting Guide

## Common Issues Preventing Backend from Running

### 1. **MongoDB Connection Issues** 🔴

**Problem**: `mongodb://localhost:27017/collaborative_coding` - MongoDB not running locally

**Solutions**:

#### Option A: Use MongoDB Atlas (Recommended)
Update your `.env` file:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collaborative_coding?retryWrites=true&w=majority
```

#### Option B: Install MongoDB Locally
1. Download MongoDB Community Server
2. Install and start MongoDB service
3. Keep the current `.env` configuration

#### Option C: Run Without Database (Development Only)
Comment out the MongoDB connection in `server.js` for testing:
```javascript
// if (process.env.MONGODB_URI) {
//   mongoose.connect(process.env.MONGODB_URI)...
// }
```

### 2. **Firebase Configuration Issues** 🔴

**Problem**: Placeholder Firebase credentials in `.env`

**Solution**: Update with real Firebase credentials:
```bash
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
```

### 3. **Port Already in Use** 🔴

**Problem**: Port 5001 already occupied

**Solutions**:
```bash
# Check what's using port 5001
netstat -ano | findstr :5001

# Kill the process
taskkill /PID <process_id> /F

# Or use a different port
PORT=5002 npm start
```

### 4. **Missing Environment Variables** 🔴

**Problem**: Required environment variables not set

**Quick Fix**: Create a minimal `.env` for testing:
```bash
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/collaborative_coding
JWT_SECRET=test-secret-key
FIREBASE_PROJECT_ID=test-project
FIREBASE_PRIVATE_KEY=test-key
FIREBASE_CLIENT_EMAIL=test@test.com
CLIENT_URL=http://localhost:3000
DOCKER_ENABLED=false
```

## Quick Start Commands

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Start with Development Mode**
```bash
npm run dev
```

### 3. **Start with Production Mode**
```bash
npm start
```

### 4. **Start with Custom Port**
```bash
PORT=5002 npm start
```

## Debugging Steps

### 1. **Check Node.js Version**
```bash
node --version
# Should be >= 16.0.0
```

### 2. **Check Dependencies**
```bash
npm list --depth=0
# All dependencies should be installed
```

### 3. **Test MongoDB Connection**
```bash
# If using MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/collaborative_coding"

# If using local MongoDB
mongosh mongodb://localhost:27017/collaborative_coding
```

### 4. **Check Port Availability**
```bash
netstat -ano | findstr :5001
```

## Error Messages and Solutions

### "Cannot connect to MongoDB"
- **Solution**: Check MongoDB URI and ensure MongoDB is running

### "Port 5001 already in use"
- **Solution**: Kill the process or use a different port

### "Firebase Admin SDK initialization failed"
- **Solution**: Update Firebase credentials in `.env`

### "Module not found"
- **Solution**: Run `npm install`

## Quick Test Setup

### Minimal Working Configuration:
1. **Update `.env`**:
```bash
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/collaborative_coding
JWT_SECRET=test-secret-key-change-in-production
CLIENT_URL=http://localhost:3000
DOCKER_ENABLED=false
```

2. **Start MongoDB** (if using local):
```bash
# Windows
net start MongoDB

# Or start MongoDB service
```

3. **Start Server**:
```bash
npm start
```

## Expected Success Output:
```
Firebase Admin SDK initialized successfully
Server running on port 5001
Environment: development
Connected to MongoDB
✅ Room state manager initialized
```

## Still Having Issues?

Run these diagnostic commands:
```bash
# Check environment
echo $NODE_ENV

# Check if port is free
netstat -ano | findstr :5001

# Test Node.js
node -e "console.log('Node.js is working')"

# Check npm
npm --version
```


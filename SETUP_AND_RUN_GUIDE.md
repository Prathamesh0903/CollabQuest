# 🚀 Setup and Run Guide - Collaborative Editor

## 📋 **Prerequisites**

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## 🔧 **Step-by-Step Setup**

### 1. **Install Dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install root dependencies
cd ..
npm install
```

### 2. **Environment Configuration**

```bash
# Copy environment files
cp server/env.example server/.env
cp .env.example .env

# Edit server/.env with your settings:
```

**server/.env:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collaborative-coding
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
NODE_ENV=development
DOCKER_ENABLED=true
```

### 3. **Start MongoDB (Optional - for full features)**

```bash
# Option A: Using Docker
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Option B: Using Docker Compose
docker-compose up mongodb -d
```

### 4. **Start the Server**

```bash
cd server
npm start
```

**Expected output:**
```
Server running on port 5000
Environment: development
```

### 5. **Start the Client**

```bash
cd client
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### 6. **Test the System**

```bash
# Test server connection
node test-server-connection.js
```

## 🎯 **How to Use the Collaborative Editor**

### **1. Access the Application**
- Open: http://localhost:3000
- Create an account or login

### **2. Create/Join a Collaborative Session**
- Click "Create Room" or "Join Room"
- Share the room link with collaborators

### **3. Code Execution Flow**
1. **Write code** in the Monaco editor
2. **Select language** (JavaScript, Python, Java, etc.)
3. **Click "Run Code"** button
4. **View results** in the terminal panel

### **4. File Uploading**
- **Create new files**: Click "New File" in sidebar
- **Upload local files**: Click "Open Local Folder"
- **Import folders**: Select entire folders to import

## 🔍 **Troubleshooting**

### **Terminal Not Showing Output**

**Problem**: Terminal doesn't display after clicking "Run Code"

**Solutions**:

1. **Check Server Status**:
   ```bash
   node test-server-connection.js
   ```

2. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Verify Server is Running**:
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Check Docker** (if using Docker executor):
   ```bash
   docker ps
   docker --version
   ```

### **Common Issues**

#### **1. "Cannot connect to server" Error**
```bash
# Solution: Start the server
cd server
npm start
```

#### **2. "API endpoint not found" Error**
```bash
# Solution: Check server is running on correct port
# Verify server/.env has PORT=5000
```

#### **3. "Docker not available" Error**
```bash
# Solution: Install and start Docker Desktop
# Or disable Docker in server/.env:
DOCKER_ENABLED=false
```

#### **4. "MongoDB connection failed" Error**
```bash
# Solution: Start MongoDB or disable database features
# The app works without MongoDB for basic features
```

## 🧪 **Testing Code Execution**

### **Test JavaScript**
```javascript
console.log("Hello, World!");
console.log("Testing collaborative editor!");
```

### **Test Python**
```python
print("Hello from Python!")
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

### **Test with Input**
```python
# Python code that needs input
name = input("What's your name? ")
age = input("How old are you? ")
print(f"Hello {name}, you are {age} years old!")
```

## 📁 **File Management Features**

### **Creating Files**
1. Click "New File" in sidebar
2. Enter filename (e.g., `main.js`)
3. Select language
4. Click "Create File"

### **Uploading Files**
1. Click "Open Local Folder"
2. Select files or folders
3. Files are imported into the session

### **File Switching**
1. Click on files in the sidebar
2. Content loads in the editor
3. Changes are synchronized across collaborators

## 🔧 **Advanced Configuration**

### **Docker Executor Setup**
```bash
# Ensure Docker is running
docker --version

# Test Docker executor
docker run --rm node:18-alpine node -e "console.log('Docker works!')"
```

### **Custom Code Execution**
```bash
# Test with custom executor
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "console.log(\"Hello from curl!\");"
  }'
```

## 🚀 **Production Deployment**

### **Using Docker Compose**
```bash
# Start all services
docker-compose up --build

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### **Environment Variables for Production**
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
DOCKER_ENABLED=true
```

## 📞 **Support**

If you encounter issues:

1. **Check the logs**:
   ```bash
   # Server logs
   cd server && npm start
   
   # Client logs
   cd client && npm start
   ```

2. **Test individual components**:
   ```bash
   node test-server-connection.js
   ```

3. **Verify prerequisites**:
   - Node.js 18+
   - Docker Desktop
   - Ports 3000 and 5000 available

4. **Check browser console** for JavaScript errors

---

**🎉 You're all set! The collaborative editor should now work properly with terminal output display.**

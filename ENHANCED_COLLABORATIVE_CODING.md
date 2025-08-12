# 🚀 Enhanced Collaborative Coding Platform

A fully-featured, VS Code-like collaborative coding platform with real-time collaboration, multi-language support, file management, and Docker-based code execution.

## ✨ **New Features Added**

### 🗂️ **Real File Management**
- **Create/Delete Files**: Create new files with any programming language
- **Create/Delete Folders**: Organize your project with folder structures
- **File Persistence**: Files are saved to the backend and persist across sessions
- **Multi-file Support**: Work with multiple files in the same session
- **Real-time File Sync**: All collaborators see file changes in real-time

### 🔧 **Enhanced Language Support**
- **JavaScript/TypeScript**: Full Node.js support
- **Python**: Python 3.11 with all standard libraries
- **Java**: OpenJDK 17 with compilation and execution
- **C++**: GCC compiler with full C++ support
- **C#**: .NET 7.0 runtime
- **Go**: Go 1.21 runtime
- **Rust**: Rust 1.75 compiler
- **PHP**: PHP 8.2 runtime
- **Ruby**: Ruby 3.2 runtime

### 🐳 **Docker-Based Code Execution**
- **Secure Isolation**: Each code execution runs in a separate Docker container
- **Resource Limits**: Memory and CPU limits prevent abuse
- **No Network Access**: Containers run without network access for security
- **Automatic Cleanup**: Containers are automatically removed after execution

### 💻 **VS Code-like Experience**
- **File Explorer**: Real file tree with folder expansion
- **Terminal**: Integrated terminal for code execution output
- **Save Functionality**: Ctrl+S to save files
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Theme Support**: Dark and light themes

### 🔄 **Real-time Collaboration**
- **Live Cursors**: See where other users are typing
- **Live Selections**: See what other users have selected
- **Code Sync**: All changes are synchronized in real-time
- **User Presence**: See who's online and active
- **Execution Sharing**: Code execution results are shared with all collaborators

## 🚀 **Quick Start**

### **Option 1: Docker Compose (Recommended)**

1. **Prerequisites**
   ```bash
   # Install Docker and Docker Compose
   # Make sure Docker daemon is running
   ```

2. **Clone and Start**
   ```bash
   git clone <your-repo>
   cd collaborative-coding-platform
   
   # Start all services
   docker-compose up -d
   ```

3. **Access the Platform**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### **Option 2: Local Development**

1. **Backend Setup**
   ```bash
   cd server
   npm install
   
   # Set environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm start
   ```

3. **Database Setup**
   ```bash
   # Install MongoDB locally or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

## 📁 **File Management Guide**

### **Creating Files**
1. Click the 📄 button in the file explorer
2. Enter filename with appropriate extension (e.g., `main.java`)
3. Select programming language
4. Click "Create File"

### **Creating Folders**
1. Click the 📁 button in the file explorer
2. Enter folder name
3. Click "Create Folder"

### **Opening Files**
- Click on any file in the explorer to open it
- The editor will automatically detect the language
- Syntax highlighting and IntelliSense will be enabled

### **Saving Files**
- Use Ctrl+S (Cmd+S on Mac) to save
- Click the Save button in the header
- Files are automatically saved to the backend

## 🖥️ **Code Execution Guide**

### **Running Code**
1. **Select Language**: Choose the correct language for your file
2. **Write Code**: Type your code in the editor
3. **Run**: Press Ctrl+Enter or click the Run button
4. **View Output**: Results appear in the integrated terminal

### **Supported Languages & Extensions**
| Language | Extension | Features |
|----------|-----------|----------|
| JavaScript | `.js` | Node.js runtime, npm packages |
| TypeScript | `.ts` | TypeScript compilation |
| Python | `.py` | Python 3.11, pip packages |
| Java | `.java` | OpenJDK 17, compilation |
| C++ | `.cpp` | GCC compiler, STL support |
| C# | `.cs` | .NET 7.0 runtime |
| Go | `.go` | Go 1.21 runtime |
| Rust | `.rs` | Rust 1.75 compiler |
| PHP | `.php` | PHP 8.2 runtime |
| Ruby | `.rb` | Ruby 3.2 runtime |

### **Input/Output**
- **Custom Input**: Use the input field in the terminal for stdin
- **Output Display**: stdout, stderr, and compilation errors are clearly shown
- **Execution Time**: See how long your code took to run
- **Error Handling**: Clear error messages with line numbers

## 👥 **Collaboration Features**

### **Joining Sessions**
1. **Create Session**: Start a new collaborative session
2. **Share Link**: Copy the shareable link
3. **Invite Others**: Send the link to your team
4. **Real-time Sync**: All changes are synchronized instantly

### **User Presence**
- **Online Status**: See who's currently online
- **Active Indicators**: Know who's typing or editing
- **User Avatars**: Visual identification of team members
- **Connection Status**: Monitor real-time connection health

### **Live Collaboration**
- **Cursor Tracking**: See where others are typing
- **Selection Sharing**: View what others have selected
- **Code Changes**: Watch code updates in real-time
- **Execution Sharing**: See when others run code

## 🔧 **Advanced Configuration**

### **Environment Variables**

#### **Backend (.env)**
```bash
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/collaborative_coding
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
DOCKER_ENABLED=true
JUDGE0_API_KEY=your-judge0-key
```

#### **Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### **Docker Configuration**
```yaml
# Enable/disable Docker execution
DOCKER_ENABLED: true

# Resource limits for containers
DOCKER_MEMORY_LIMIT: 512MB
DOCKER_CPU_LIMIT: 50%
```

## 🛠️ **Development & Customization**

### **Adding New Languages**
1. **Update Backend**: Add language config in `dockerExecutor.js`
2. **Update Frontend**: Add language to `LanguageSwitcher.tsx`
3. **Add Icons**: Update file icons in `VSCodeSidebar.tsx`
4. **Test**: Verify compilation and execution work

### **Custom File Types**
1. **Backend**: Add MIME type handling in file routes
2. **Frontend**: Add syntax highlighting support
3. **Execution**: Configure appropriate runtime/compiler

### **Extending Features**
- **Git Integration**: Add version control capabilities
- **Package Management**: Integrate with language-specific package managers
- **Debugging**: Add step-through debugging support
- **Testing**: Integrate testing frameworks

## 🔒 **Security Features**

### **Code Execution Security**
- **Container Isolation**: Each execution runs in isolated containers
- **Resource Limits**: Memory and CPU limits prevent abuse
- **Network Isolation**: Containers have no network access
- **Automatic Cleanup**: Temporary files and containers are removed

### **Authentication & Authorization**
- **Firebase Auth**: Secure user authentication
- **JWT Tokens**: Secure API access
- **User Permissions**: Role-based access control
- **Session Management**: Secure session handling

## 📊 **Performance & Scalability**

### **Optimizations**
- **WebSocket Connections**: Efficient real-time communication
- **File Caching**: Smart file caching strategies
- **Container Reuse**: Optimized Docker container management
- **Database Indexing**: Optimized MongoDB queries

### **Scaling Considerations**
- **Load Balancing**: Multiple server instances
- **Database Sharding**: MongoDB cluster support
- **Redis Caching**: Session and data caching
- **CDN Integration**: Static asset delivery

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Code Execution Fails**
```bash
# Check Docker status
docker ps
docker logs collab-server

# Verify language support
curl http://localhost:5000/api/health
```

#### **File Creation Issues**
```bash
# Check file permissions
ls -la server/uploads/
ls -la server/temp/

# Verify MongoDB connection
docker logs collab-mongodb
```

#### **Real-time Issues**
```bash
# Check WebSocket connections
docker logs collab-server | grep socket

# Verify client connection
# Check browser console for errors
```

### **Debug Mode**
```bash
# Enable debug logging
NODE_ENV=development DEBUG=* npm start

# View detailed logs
docker-compose logs -f server
```

## 🚀 **Deployment**

### **Production Setup**
1. **Environment**: Set `NODE_ENV=production`
2. **Secrets**: Use secure JWT secrets and API keys
3. **SSL**: Configure HTTPS with proper certificates
4. **Monitoring**: Set up logging and monitoring
5. **Backup**: Configure MongoDB backups

### **Cloud Deployment**
- **AWS**: Use ECS/EKS with RDS and ElastiCache
- **Google Cloud**: Use GKE with Cloud SQL and Memorystore
- **Azure**: Use AKS with Azure Database and Redis Cache
- **DigitalOcean**: Use App Platform with managed databases

## 📚 **API Documentation**

### **File Management Endpoints**
```bash
# Get files for session
GET /api/files/session/:sessionId

# Create new file
POST /api/files/session/:sessionId

# Create new folder
POST /api/files/session/:sessionId/folder

# Read file content
GET /api/files/session/:sessionId/file/:filename

# Update file content
PUT /api/files/session/:sessionId/file/:filename

# Delete file/folder
DELETE /api/files/session/:sessionId/:itemType/:itemName

# Rename file/folder
PATCH /api/files/session/:sessionId/:itemType/:itemName/rename
```

### **Code Execution Endpoints**
```bash
# Execute code
POST /api/rooms/:roomId/execute

# Health check
GET /api/health
```

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Code Style**
- **TypeScript**: Use strict mode and proper typing
- **React**: Use functional components with hooks
- **Backend**: Use async/await and proper error handling
- **Testing**: Write unit and integration tests

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 **Acknowledgments**

- **Monaco Editor**: VS Code's web editor
- **Socket.IO**: Real-time communication
- **Docker**: Container-based execution
- **MongoDB**: Database storage
- **React**: Frontend framework

---

**🎉 You now have a fully-functional, VS Code-like collaborative coding platform!**

Start coding collaboratively with your team, create and manage files, and execute code in multiple programming languages with full real-time synchronization. 
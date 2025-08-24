# CollabQuest Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (via Docker)
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd CollabQuest

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ../executor && npm install
```

### Starting the Application

#### Option 1: Using PowerShell Script (Windows)
```powershell
./start-services.ps1
```

#### Option 2: Using Docker Compose
```bash
docker-compose up -d
```

#### Option 3: Manual Start
```bash
# Terminal 1: Start MongoDB (if not using Docker)
mongod

# Terminal 2: Start Server
cd server
npm start

# Terminal 3: Start Executor Service
cd executor
npm start

# Terminal 4: Start Client
cd client
npm start
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Executor Service**: http://localhost:5001
- **MongoDB**: localhost:27017

## 🏗️ Project Structure

```
CollabQuest/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Frontend utilities
├── server/                 # Express.js backend
│   ├── routes/            # API routes
│   ├── models/            # Mongoose models
│   ├── utils/             # Backend utilities
│   └── plugins/           # Language plugins
├── executor/              # Code execution service
│   └── index.js           # Main executor
├── docker-compose.yml     # Main Docker setup
└── docker-compose-resource-limits.yml  # Resource-limited services
```

## 🔧 Core Features

### 1. Collaborative Coding
- Real-time code editing with multiple users
- Cursor tracking and user presence
- Room-based collaboration sessions

### 2. Code Execution
- Multi-language support (JavaScript, Python, Java, C++)
- Secure Docker-based execution
- Resource limits and security isolation
- Interactive terminal support

### 3. DSA Practice Sheet
- Curated problem sets
- Multiple difficulty levels
- Progress tracking
- Submission history

### 4. Quiz System
- Interactive quizzes
- Multiple categories
- Real-time scoring
- Performance analytics

### 5. Chat System
- Real-time messaging
- Room-based conversations
- User presence indicators

## 🛠️ Development

### Environment Variables

#### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collabquest
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
DOCKER_ENABLED=true
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

#### Collaborative Sessions
- `POST /api/rooms` - Create room
- `GET /api/rooms` - List rooms
- `GET /api/rooms/:id` - Get room details

#### Code Execution
- `POST /api/execute` - Execute code
- `GET /api/execute/health` - Health check

#### DSA Problems
- `GET /api/dsa/problems` - List problems
- `GET /api/dsa/problems/:slug` - Get problem
- `POST /api/dsa/problems/:slug/submit` - Submit solution

### Database Models

#### User
```javascript
{
  username: String,
  email: String,
  password: String,
  profile: Object,
  createdAt: Date
}
```

#### Room
```javascript
{
  name: String,
  description: String,
  createdBy: ObjectId,
  members: [ObjectId],
  settings: Object
}
```

#### Problem
```javascript
{
  title: String,
  slug: String,
  description: String,
  difficulty: String,
  category: String,
  tags: [String],
  problemStatement: String,
  examples: [Object],
  constraints: [String],
  starterCode: Object,
  solution: Object,
  testCases: [Object]
}
```

## 🔒 Security Features

### Code Execution Security
- Docker container isolation
- Resource limits (CPU, memory, disk)
- Network isolation
- Read-only filesystem
- Process limits
- Security capabilities dropped

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Session management
- Role-based access control

## 🐳 Docker Configuration

### Main Services
- **MongoDB**: Database
- **Redis**: Session storage
- **Server**: Backend API
- **Client**: Frontend
- **Nginx**: Reverse proxy

### Resource-Limited Services
- **code-executor-basic**: Basic execution with 256MB memory limit
- **code-executor-advanced**: Advanced execution with 512MB memory limit

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Code Execution Tests
```bash
node test-code-execution.js
node test-executor.js
```

## 📝 Code Style

### JavaScript/TypeScript
- Use ES6+ features
- Prefer const/let over var
- Use async/await for promises
- Follow camelCase naming

### React Components
- Use functional components with hooks
- Follow PascalCase for component names
- Use TypeScript interfaces for props

### API Design
- RESTful endpoints
- Consistent error responses
- Proper HTTP status codes
- Input validation

## 🚀 Deployment

### Production Setup
1. Set environment variables
2. Build client: `cd client && npm run build`
3. Start services with PM2 or Docker
4. Configure Nginx reverse proxy
5. Set up SSL certificates

### Docker Deployment
```bash
docker-compose -f docker-compose.yml up -d
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 <PID>
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"
# Restart MongoDB
sudo systemctl restart mongod
```

#### Docker Issues
```bash
# Clean up containers
docker system prune -a
# Restart Docker
sudo systemctl restart docker
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Socket.io Documentation](https://socket.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

# CollabQuest Backend Server

A robust Node.js backend server powering the CollabQuest platform with real-time collaboration, code execution, and comprehensive API services.

## 🚀 Features

### Core Services
- **Authentication**: Supabase-based user authentication and authorization
- **Real-time Communication**: WebSocket-based live collaboration
- **Code Execution**: Secure Docker-based code execution system
- **Database Management**: MongoDB with Mongoose ODM
- **File Management**: Secure file upload and storage
- **API Gateway**: RESTful API with comprehensive endpoints

### Real-time Features
- **Live Collaboration**: Real-time code editing and cursor tracking
- **Battle System**: Live competitive coding battles
- **Chat System**: Real-time messaging and notifications
- **Progress Tracking**: Live progress updates and synchronization
- **User Presence**: Online/offline status tracking

### Security Features
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting and abuse prevention
- **CORS Configuration**: Secure cross-origin resource sharing
- **Error Handling**: Centralized error handling and logging
- **Performance Monitoring**: Request performance tracking

## 📁 Project Structure

```
server/
├── config/                 # Configuration files
│   └── supabaseAuth.js    # Supabase authentication setup
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js    # Error handling middleware
│   ├── performance.js     # Performance monitoring
│   └── validation.js      # Request validation
├── models/                 # Database models
│   ├── dsa/               # DSA-related models
│   ├── User.js            # User model
│   ├── Room.js            # Collaboration room model
│   ├── Problem.js         # Problem model
│   └── Quiz.js            # Quiz model
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── dsa.js             # DSA problem routes
│   ├── battles.js         # Battle system routes
│   ├── quizzes.js         # Quiz system routes
│   └── users.js           # User management routes
├── services/               # Business logic services
├── utils/                  # Utility functions
│   ├── codeExecutor.js    # Code execution utilities
│   ├── dockerExecutor.js  # Docker execution wrapper
│   └── socketHandler.js   # WebSocket handling
├── scripts/                # Database scripts
│   ├── seed-dsa.js        # DSA data seeding
│   └── seed-javascript-quiz.js # Quiz data seeding
├── tests/                  # Test files
└── server.js              # Main server file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- Docker (for code execution)
- Supabase account

### Installation
```bash
cd server
npm install
```

### Environment Setup
```bash
cp env.example .env
```

### Environment Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collabquest

# Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/keys
JWT_SECRET=your-jwt-secret

# Client Configuration
CLIENT_URL=http://localhost:3000

# Code Execution
DOCKER_ENABLED=true
DOCKER_SOCKET=/var/run/docker.sock
```

### Database Setup
```bash
# Seed DSA problems
npm run seed:dsa

# Seed quiz data
npm run seed:quiz
```

## 🚀 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With Database Seeding
```bash
npm run start:with-seed
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### DSA Problem Endpoints
- `GET /api/dsa/problems` - Get all problems
- `GET /api/dsa/problems/:id` - Get specific problem
- `POST /api/dsa/problems` - Create problem (admin)
- `PUT /api/dsa/problems/:id` - Update problem (admin)
- `DELETE /api/dsa/problems/:id` - Delete problem (admin)

### Battle System Endpoints
- `GET /api/battles` - Get available battles
- `POST /api/battles` - Create new battle
- `GET /api/battles/:id` - Get battle details
- `POST /api/battles/:id/join` - Join battle
- `POST /api/battles/:id/submit` - Submit solution
- `GET /api/battles/:id/results` - Get battle results

### Quiz System Endpoints
- `GET /api/quizzes/categories` - Get quiz categories
- `GET /api/quizzes/questions` - Get questions
- `POST /api/quizzes/submit` - Submit quiz answers
- `GET /api/quizzes/results/:id` - Get quiz results

### Code Execution Endpoints
- `POST /api/execute` - Execute code
- `POST /api/execute/batch` - Execute multiple code snippets
- `GET /api/execute/languages` - Get supported languages

## 🔧 Configuration

### Database Models

#### User Model
```javascript
{
  id: String,           // Supabase user ID
  email: String,        // User email
  displayName: String,  // Display name
  avatarUrl: String,    // Profile picture
  role: String,         // User role (user, admin, teacher)
  createdAt: Date,      // Account creation date
  lastLogin: Date       // Last login timestamp
}
```

#### DSA Problem Model
```javascript
{
  problemNumber: Number,    // Unique problem number
  title: String,           // Problem title
  description: String,     // Problem description
  difficulty: String,      // Difficulty level
  topic: String,           // Problem topic
  constraints: String,     // Problem constraints
  examples: Array,         // Example inputs/outputs
  testCases: Array,        // Test cases
  hints: Array,           // Problem hints
  solution: String,       // Solution code
  timeLimit: Number,      // Time limit in seconds
  spaceLimit: Number      // Space limit in MB
}
```

#### Battle Model
```javascript
{
  id: String,             // Battle ID
  participants: Array,    // Battle participants
  problems: Array,        // Battle problems
  status: String,         // Battle status
  startTime: Date,        // Battle start time
  endTime: Date,          // Battle end time
  results: Object         // Battle results
}
```

### Middleware Configuration

#### Authentication Middleware
```javascript
const authMiddleware = require('./middleware/auth');

// Protect routes
app.use('/api/protected', authMiddleware);
```

#### Validation Middleware
```javascript
const { validateRequest } = require('./middleware/validation');

// Validate request body
app.post('/api/problems', validateRequest(problemSchema));
```

#### Performance Middleware
```javascript
const performanceMiddleware = require('./middleware/performance');

// Monitor request performance
app.use(performanceMiddleware);
```

## 🐳 Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  server:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/collabquest
    depends_on:
      - mongo
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
  
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                  # End-to-end tests
└── fixtures/             # Test data fixtures
```

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Test Examples
```javascript
// Unit test example
describe('DSA Problem Service', () => {
  it('should create a new problem', async () => {
    const problemData = {
      title: 'Test Problem',
      difficulty: 'easy',
      topic: 'arrays'
    };
    
    const result = await dsaService.createProblem(problemData);
    expect(result.title).toBe(problemData.title);
  });
});

// Integration test example
describe('Battle API', () => {
  it('should create a new battle', async () => {
    const response = await request(app)
      .post('/api/battles')
      .send({
        mode: 'quick',
        duration: 30,
        difficulty: 'medium'
      })
      .expect(201);
    
    expect(response.body.id).toBeDefined();
  });
});
```

## 🔒 Security

### Security Measures
- **Input Validation**: All inputs validated and sanitized
- **Authentication**: JWT-based authentication with Supabase
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Code Execution**: Sandboxed Docker containers

### Security Best Practices
1. **Never log sensitive data**
2. **Use environment variables for secrets**
3. **Validate all user inputs**
4. **Implement proper error handling**
5. **Use HTTPS in production**
6. **Regular security audits**

## 📊 Monitoring & Logging

### Logging Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Performance Monitoring
```javascript
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};
```

### Health Check
```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

## 🚀 Deployment

### Production Deployment
1. **Set up environment variables**
2. **Configure MongoDB connection**
3. **Set up Docker for code execution**
4. **Configure reverse proxy (nginx)**
5. **Set up SSL certificates**
6. **Configure monitoring and logging**

### Environment-specific Configuration
```javascript
const config = {
  development: {
    mongodb: 'mongodb://localhost:27017/collabquest-dev',
    cors: ['http://localhost:3000'],
    logLevel: 'debug'
  },
  production: {
    mongodb: process.env.MONGODB_URI,
    cors: [process.env.CLIENT_URL],
    logLevel: 'info'
  }
};
```

## 🤝 Contributing

### Development Guidelines
1. **Follow ESLint configuration**
2. **Write comprehensive tests**
3. **Document API changes**
4. **Follow semantic versioning**
5. **Update this README for significant changes**

### Code Review Process
1. **Create feature branch**
2. **Write tests for new features**
3. **Update documentation**
4. **Submit pull request**
5. **Address review feedback**

## 📞 Support

### Troubleshooting
- **Check server logs** for error details
- **Verify environment variables** are set correctly
- **Test database connectivity**
- **Check Docker daemon** is running
- **Verify Supabase configuration**

### Common Issues
1. **MongoDB Connection**: Check connection string and network access
2. **Docker Issues**: Ensure Docker daemon is running and accessible
3. **Authentication**: Verify Supabase configuration and keys
4. **CORS Errors**: Check CORS configuration and client URL
5. **Performance**: Monitor memory usage and database queries

## 🔮 Future Enhancements

### Planned Features
- **Microservices Architecture**: Split into smaller services
- **Caching Layer**: Redis for improved performance
- **Message Queue**: RabbitMQ for async processing
- **API Versioning**: Versioned API endpoints
- **GraphQL Support**: GraphQL API alongside REST
- **Real-time Analytics**: Live usage analytics
- **Auto-scaling**: Kubernetes deployment
- **Multi-region**: Global deployment support

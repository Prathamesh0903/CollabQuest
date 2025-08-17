# REST API Design Summary: Code Execution

## 🎯 Overview

This document provides a comprehensive design for a REST API endpoint that accepts code, programming language, and optionally input, then returns the output or error. The design is based on your existing codebase and follows REST API best practices.

## 📋 API Endpoints

### 1. Execute Code (Public)
```
POST /api/execute
```

**Request:**
```json
{
  "language": "javascript",
  "code": "console.log('Hello World');",
  "input": "optional input data"
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "status": "success",
  "executionTime": 1640995200000,
  "metrics": {
    "codeLength": 25,
    "executionDuration": 45,
    "language": "javascript"
  }
}
```

### 2. Execute Code (Authenticated)
```
POST /api/execute/secure
Authorization: Bearer <jwt_token>
```

### 3. Get Supported Languages
```
GET /api/execute/languages
```

### 4. Health Check
```
GET /api/execute/health
```

## 🔧 Implementation Details

### File Structure
```
server/
├── routes/
│   └── codeExecution.js          # New API routes
├── utils/
│   ├── codeExecutor.js           # Existing execution logic
│   └── dockerExecutor.js         # Docker-based execution
└── server.js                     # Updated with new routes
```

### Key Features

1. **Multi-Language Support**: JavaScript, Python, Java, C++, C#, TypeScript, Go, Rust, PHP, Ruby
2. **Security**: Docker sandboxing, input validation, resource limits
3. **Error Handling**: Comprehensive error responses with detailed information
4. **Metrics**: Execution time, memory usage, code length tracking
5. **Authentication**: Optional JWT-based authentication
6. **Health Monitoring**: Service status and uptime tracking

## 🛡️ Security Measures

- **Code Sandboxing**: Isolated Docker containers
- **Input Validation**: Pattern matching for dangerous operations
- **Resource Limits**: CPU, memory, and time constraints
- **Rate Limiting**: Prevents abuse
- **Network Isolation**: No network access by default

## 📊 Validation Rules

| Parameter | Max Length | Required | Content |
|-----------|------------|----------|---------|
| `language` | N/A | Yes | Supported language ID |
| `code` | 50KB | Yes | Source code |
| `input` | 1KB | No | Plain text |

## 🚀 Usage Examples

### JavaScript
```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "console.log(\"Hello World\");"
  }'
```

### Python with Input
```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "name = input()\nprint(f\"Hello, {name}!\")",
    "input": "Alice"
  }'
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
node test-api-examples.js
```

This will test:
- ✅ Successful code execution
- ❌ Error handling
- 🏥 Health checks
- 📚 Language support

## 📈 Response Format

### Success Response
```json
{
  "success": true,
  "stdout": "program output",
  "stderr": "error output",
  "compile_output": "compilation output",
  "status": "success",
  "executionTime": 1640995200000,
  "metrics": {
    "codeLength": 100,
    "executionDuration": 45,
    "language": "javascript",
    "memoryUsed": "2.5MB"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "error message",
  "stderr": "error output",
  "status": "error",
  "executionTime": 1640995200000,
  "metrics": {
    "codeLength": 100,
    "executionDuration": 12,
    "language": "javascript",
    "errorType": "SyntaxError"
  }
}
```

## 🔄 Integration with Existing System

The new API integrates seamlessly with your existing:
- **Collaborative Editor**: Real-time code execution
- **Quiz System**: Automated testing
- **Battle System**: Competitive coding
- **Socket.IO**: Real-time updates

## 📝 Next Steps

1. **Start the server**: `npm start` in the server directory
2. **Test the API**: Run `node test-api-examples.js`
3. **Integrate with frontend**: Update client components to use new endpoints
4. **Monitor usage**: Check logs and metrics
5. **Scale as needed**: Add more languages or execution methods

## 🎉 Benefits

- **Standardized**: RESTful design following best practices
- **Secure**: Multiple layers of security
- **Scalable**: Docker-based execution with fallbacks
- **User-Friendly**: Clear error messages and documentation
- **Extensible**: Easy to add new languages or features

This design provides a robust, secure, and user-friendly API for code execution that integrates perfectly with your existing collaborative coding platform.

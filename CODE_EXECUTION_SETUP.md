# Secure Code Execution System

This document describes the secure code execution system implemented for the collaborative platform. The system provides a containerized, secure environment for executing user-submitted JavaScript and Python code.

## Architecture

The code execution system consists of two main components:

1. **Main Server** (`server/`) - Handles API requests and routes code execution to the executor service
2. **Code Executor Service** (`executor/`) - Runs in a separate container and handles the actual code execution

## Security Features

### Container Security
- **Isolation**: Each code execution runs in a separate Docker container
- **Resource Limits**: Memory (256MB), CPU (50%), and process limits (50 PIDs)
- **Network Isolation**: Containers run with `--network=none`
- **Read-only Filesystem**: Containers use read-only root filesystem
- **Privilege Dropping**: All capabilities dropped, no new privileges
- **Non-root User**: Containers run as non-root user

### Code Validation
- **Pattern Detection**: Blocks dangerous imports and functions
- **Length Limits**: Maximum 10KB code size
- **Language-specific Checks**: Validates against language-specific dangerous patterns
- **Input Sanitization**: Validates and sanitizes all inputs

### Timeout Protection
- **Execution Timeout**: 3-second maximum execution time
- **HTTP Timeout**: 5-second timeout for API calls
- **Automatic Cleanup**: Containers are automatically removed after execution

## Supported Languages

### JavaScript (Node.js)
- **Image**: `node:18-alpine`
- **Memory Limit**: 256MB
- **Forbidden Patterns**:
  - `require('fs')`, `require('child_process')`, `require('process')`
  - `eval()`, `Function()`, `setTimeout()`, `setInterval()`
  - `process.exit()`, `process.kill()`

### Python
- **Image**: `python:3.10-alpine`
- **Memory Limit**: 256MB
- **Forbidden Patterns**:
  - `import os`, `import subprocess`, `import sys`
  - `__import__()`, `exec()`, `open()`, `file()`
  - `exit()`, `quit()`

## API Endpoints

### Main Server
- `POST /api/rooms/:roomId/execute` - Execute code with test cases
- `GET /api/health` - Health check with service status

### Executor Service
- `POST /execute` - Execute code in secure container
- `GET /health` - Executor service health check

## Request/Response Format

### Execute Code Request
```json
{
  "language": "javascript|python",
  "code": "console.log('Hello World');",
  "input": "optional input data",
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output"
    }
  ]
}
```

### Execute Code Response
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "executionTime": 1640995200000
}
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- MongoDB (for main server)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Main Server
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/your-database
CLIENT_URL=http://localhost:3000

# Code Execution
EXECUTOR_URL=http://localhost:5001
JUDGE0_API_KEY=your-judge0-api-key  # Optional fallback

# Firebase (if using)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Running with Docker Compose

1. **Build and start services**:
   ```bash
   docker-compose up --build
   ```

2. **Check service health**:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Test code execution**:
   ```bash
   curl -X POST http://localhost:5000/api/rooms/test/execute \
     -H "Content-Type: application/json" \
     -d '{
       "language": "javascript",
       "code": "console.log(\"Hello World\");"
     }'
   ```

### Running Locally (Development)

1. **Start the executor service**:
   ```bash
   cd executor
   npm install
   npm start
   ```

2. **Start the main server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

## Monitoring and Logs

### Health Checks
- Main server: `GET /api/health`
- Executor service: `GET /health`

### Logs
```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs executor
docker-compose logs server

# Follow logs in real-time
docker-compose logs -f
```

## Error Handling

### Common Error Scenarios
1. **Timeout**: Code execution exceeds 3 seconds
2. **Memory Limit**: Code uses more than 256MB
3. **Forbidden Code**: Code contains dangerous patterns
4. **Service Unavailable**: Executor service is down
5. **Invalid Language**: Unsupported programming language

### Fallback Strategy
1. Try local executor service first
2. Fall back to Judge0 API (if configured)
3. Return detailed error message

## Security Considerations

### Container Escape Prevention
- Read-only filesystem
- No new privileges
- Dropped capabilities
- Network isolation
- Resource limits

### Code Injection Prevention
- Input validation
- Pattern matching
- Length limits
- Language-specific restrictions

### Resource Exhaustion Prevention
- Memory limits
- CPU limits
- Process limits
- Automatic cleanup
- Timeout protection

## Performance Optimization

### Container Reuse
- Containers are created fresh for each execution
- Automatic cleanup prevents resource leaks
- Lightweight Alpine images for faster startup

### Caching
- Docker layer caching for faster builds
- Node modules caching in development

## Troubleshooting

### Common Issues

1. **Executor service not responding**:
   - Check if Docker is running
   - Verify executor service is started
   - Check Docker socket permissions

2. **Code execution timeout**:
   - Verify timeout settings
   - Check for infinite loops in code
   - Monitor resource usage

3. **Permission denied errors**:
   - Ensure Docker socket is accessible
   - Check user permissions
   - Verify container security settings

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## Contributing

When adding new features to the code execution system:

1. Update security patterns for new languages
2. Add appropriate resource limits
3. Test with malicious code samples
4. Update documentation
5. Add health checks for new services

## License

This code execution system is part of the collaborative platform and follows the same license terms. 
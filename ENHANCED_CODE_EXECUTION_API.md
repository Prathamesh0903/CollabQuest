# Enhanced Code Execution API

This document describes the enhanced code execution API that returns comprehensive JSON responses with standard output, standard error, runtime logs, and graceful handling of infinite loops and crashes.

## 🎯 Overview

The enhanced API provides:
- **Comprehensive JSON responses** with structured data
- **Runtime logs** for execution monitoring
- **Resource monitoring** (memory, CPU usage)
- **Graceful error handling** for infinite loops and crashes
- **Timeout management** with configurable limits
- **Security features** with Docker sandboxing

## 📋 API Endpoints

### Base URL
```
http://localhost:5000/api/execute
```

### 1. Execute Code (Public)
**Endpoint:** `POST /api/execute`

**Description:** Execute code with comprehensive monitoring and logging

**Request Body:**
```json
{
  "language": "javascript",
  "code": "console.log('Hello World');",
  "input": "optional input data",
  "timeout": 10000,
  "memoryLimit": "256MB"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "stdout": "Hello World\n",
    "stderr": "",
    "compile_output": "",
    "runtime_logs": [
      {
        "timestamp": "2024-01-01T00:00:00.000Z",
        "level": "INFO",
        "message": "Starting javascript code execution",
        "details": {
          "code_length": 25,
          "input_length": 0,
          "timeout": 10000,
          "memory_limit": "256MB"
        }
      },
      {
        "timestamp": "2024-01-01T00:00:00.100Z",
        "level": "INFO",
        "message": "Docker container started",
        "details": {
          "container_id": "abc123def456",
          "image": "node:18-alpine"
        }
      },
      {
        "timestamp": "2024-01-01T00:00:00.200Z",
        "level": "INFO",
        "message": "Code execution completed successfully",
        "details": {
          "execution_time": 150,
          "stdout_length": 12,
          "stderr_length": 0
        }
      }
    ],
    "exit_code": 0
  },
  "status": "success",
  "execution": {
    "start_time": "2024-01-01T00:00:00.000Z",
    "end_time": "2024-01-01T00:00:00.200Z",
    "duration_ms": 200,
    "language": "javascript",
    "timeout_occurred": false,
    "memory_exceeded": false,
    "crashed": false
  },
  "metrics": {
    "code_length": 25,
    "input_length": 0,
    "memory_used": "45.2MB",
    "cpu_usage": "12.5%",
    "container_id": "abc123def456"
  },
  "timestamp": "2024-01-01T00:00:00.200Z"
}
```

**Response (Error - Timeout):**
```json
{
  "success": false,
  "error": {
    "message": "Execution timed out after 10000ms",
    "type": "TIMEOUT_ERROR",
    "code": "TIMEOUT_ERROR",
    "details": {
      "execution_time": 10000,
      "language": "python",
      "timeout_occurred": true,
      "memory_exceeded": false,
      "crashed": false
    }
  },
  "data": {
    "stdout": "Starting infinite loop...\n",
    "stderr": "",
    "compile_output": "",
    "runtime_logs": [
      {
        "timestamp": "2024-01-01T00:00:00.000Z",
        "level": "INFO",
        "message": "Starting python code execution",
        "details": {
          "code_length": 45,
          "input_length": 0,
          "timeout": 10000,
          "memory_limit": "256MB"
        }
      },
      {
        "timestamp": "2024-01-01T00:00:10.000Z",
        "level": "ERROR",
        "message": "Execution timed out - possible infinite loop detected",
        "details": {
          "execution_time": 10000,
          "timeout_limit": 10000
        }
      }
    ],
    "exit_code": -1
  },
  "execution": {
    "start_time": "2024-01-01T00:00:00.000Z",
    "end_time": "2024-01-01T00:00:10.000Z",
    "duration_ms": 10000,
    "language": "python",
    "timeout_occurred": true,
    "memory_exceeded": false,
    "crashed": false
  },
  "metrics": {
    "code_length": 45,
    "input_length": 0,
    "memory_used": "128.5MB",
    "cpu_usage": "95.2%",
    "container_id": "def456ghi789"
  },
  "timestamp": "2024-01-01T00:00:10.000Z"
}
```

### 2. Execute Code (Authenticated)
**Endpoint:** `POST /api/execute/secure`

**Description:** Execute code with authentication required

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:** Same as public endpoint

**Response:** Same as public endpoint with additional user information:
```json
{
  "success": true,
  "data": { /* same as public endpoint */ },
  "status": "success",
  "execution": { /* same as public endpoint */ },
  "user": {
    "id": "user_id",
    "display_name": "John Doe",
    "email": "john@example.com"
  },
  "metrics": { /* same as public endpoint */ },
  "timestamp": "2024-01-01T00:00:00.200Z"
}
```

### 3. Get Supported Languages
**Endpoint:** `GET /api/execute/languages`

**Response:**
```json
{
  "success": true,
  "data": {
    "languages": [
      {
        "id": "javascript",
        "name": "JavaScript",
        "version": "Node.js 18+",
        "extension": ".js"
      },
      {
        "id": "python",
        "name": "Python",
        "version": "3.11+",
        "extension": ".py"
      },
      {
        "id": "java",
        "name": "Java",
        "version": "OpenJDK 17",
        "extension": ".java"
      }
    ],
    "count": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Health Check
**Endpoint:** `GET /api/execute/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "local": true,
      "docker": true,
      "judge0": false
    },
    "uptime": 3600,
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📊 Response Structure

### Success Response
```json
{
  "success": true,
  "data": {
    "stdout": "string",           // Standard output
    "stderr": "string",           // Standard error
    "compile_output": "string",   // Compilation output (for compiled languages)
    "runtime_logs": [             // Array of runtime log entries
      {
        "timestamp": "ISO-8601",
        "level": "INFO|WARN|ERROR|DEBUG",
        "message": "string",
        "details": {}             // Optional additional details
      }
    ],
    "exit_code": 0               // Process exit code
  },
  "status": "success",
  "execution": {
    "start_time": "ISO-8601",
    "end_time": "ISO-8601",
    "duration_ms": 200,
    "language": "string",
    "timeout_occurred": false,
    "memory_exceeded": false,
    "crashed": false
  },
  "metrics": {
    "code_length": 25,
    "input_length": 0,
    "memory_used": "45.2MB",
    "cpu_usage": "12.5%",
    "container_id": "string"
  },
  "timestamp": "ISO-8601"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "string",
    "type": "string",
    "code": "string",
    "details": {}                 // Optional error details
  },
  "data": {
    "stdout": "string",
    "stderr": "string",
    "compile_output": "string",
    "runtime_logs": [],
    "exit_code": -1
  },
  "execution": {
    "start_time": "ISO-8601",
    "end_time": "ISO-8601",
    "duration_ms": 10000,
    "language": "string",
    "timeout_occurred": true,
    "memory_exceeded": false,
    "crashed": false
  },
  "metrics": {
    "code_length": 45,
    "input_length": 0,
    "memory_used": "128.5MB",
    "cpu_usage": "95.2%",
    "container_id": "string"
  },
  "timestamp": "ISO-8601"
}
```

## 🔍 Runtime Logs

Runtime logs provide detailed execution monitoring:

### Log Levels
- **INFO**: General execution information
- **WARN**: Warning conditions (high resource usage)
- **ERROR**: Error conditions (timeout, crash, compilation failure)
- **DEBUG**: Detailed debugging information

### Log Entry Structure
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "message": "Starting javascript code execution",
  "details": {
    "code_length": 25,
    "input_length": 0,
    "timeout": 10000,
    "memory_limit": "256MB"
  }
}
```

### Common Log Messages
- `"Starting {language} code execution"`
- `"Docker container started"`
- `"Starting compilation"`
- `"Compilation completed successfully"`
- `"Compilation failed"`
- `"Starting code execution"`
- `"Code execution completed"`
- `"Execution timed out - possible infinite loop detected"`
- `"Memory limit exceeded"`
- `"Process crashed or was killed"`
- `"Resource usage update"`
- `"Memory usage approaching limit"`
- `"CPU usage is high"`
- `"Docker container stopped and removed"`

## ⚡ Error Handling

### Error Types
1. **TIMEOUT_ERROR**: Execution exceeded time limit
2. **MEMORY_ERROR**: Memory limit exceeded
3. **CRASH_ERROR**: Process crashed or was killed
4. **COMPILATION_ERROR**: Code compilation failed
5. **EXECUTION_ERROR**: General execution error
6. **VALIDATION_ERROR**: Input validation failed

### Graceful Handling Features
- **Infinite Loop Detection**: Automatic timeout with detailed logging
- **Memory Protection**: Container memory limits with OOM killer
- **Process Isolation**: Docker containers with security restrictions
- **Resource Monitoring**: Real-time CPU and memory tracking
- **Cleanup**: Automatic container cleanup on completion or error

## 🛡️ Security Features

### Docker Container Security
- **Network Isolation**: `--network=none`
- **Read-only Filesystem**: `--read-only`
- **Non-root User**: `--user=nobody:nobody`
- **Capability Dropping**: `--cap-drop=ALL`
- **Security Options**: `--security-opt=no-new-privileges`
- **Resource Limits**: Memory, CPU, process limits
- **Auto-removal**: `--rm` flag for automatic cleanup

### Resource Limits
```javascript
{
  Memory: 512 * 1024 * 1024,        // 512MB
  MemorySwap: 0,                     // No swap
  CpuPeriod: 100000,                 // 100ms period
  CpuQuota: 50000,                   // 50% CPU
  PidsLimit: 50,                     // Max processes
  Ulimits: [
    { Name: 'nofile', Soft: 64, Hard: 64 },
    { Name: 'nproc', Soft: 50, Hard: 50 },
    { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 },
    { Name: 'core', Soft: 0, Hard: 0 }
  ]
}
```

## 📈 Usage Examples

### Basic JavaScript Execution
```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "console.log(\"Hello World\"); console.log(\"2 + 2 =\", 2 + 2);"
  }'
```

### Python with Input
```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "name = input()\nage = int(input())\nprint(f\"Hello, {name}! You are {age} years old.\")",
    "input": "Alice\n25"
  }'
```

### Java Compilation and Execution
```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "java",
    "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello from Java!\"); } }"
  }'
```

### Testing Infinite Loop (Timeout)
```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Starting infinite loop...\")\nwhile True:\n    pass",
    "timeout": 5000
  }'
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
node test-enhanced-execution.js
```

The test suite includes:
- Basic execution tests
- Input handling tests
- Infinite loop timeout tests
- Memory limit tests
- Syntax error tests
- Runtime error tests
- Health check tests
- Language support tests

## 🔧 Configuration

### Environment Variables
```env
# Docker Configuration
DOCKER_ENABLED=true
DOCKER_SOCKET=/var/run/docker.sock

# Timeout Configuration
DEFAULT_TIMEOUT=10000
MAX_TIMEOUT=30000

# Memory Configuration
DEFAULT_MEMORY_LIMIT=256MB
MAX_MEMORY_LIMIT=1GB

# Judge0 Fallback (Optional)
JUDGE0_API_KEY=your-judge0-api-key
```

### Supported Languages
| Language | ID | Version | Extension | Compilation Required |
|----------|----|---------|-----------|---------------------|
| JavaScript | `javascript` | Node.js 18+ | `.js` | No |
| Python | `python` | 3.11+ | `.py` | No |
| Java | `java` | OpenJDK 17 | `.java` | Yes |
| C++ | `cpp` | GCC 9.2+ | `.cpp` | Yes |
| C# | `csharp` | .NET 7.0 | `.cs` | Yes |
| TypeScript | `typescript` | Node.js 18+ | `.ts` | No |
| Go | `go` | 1.21+ | `.go` | No |
| Rust | `rust` | 1.75+ | `.rs` | Yes |
| PHP | `php` | 8.2+ | `.php` | No |
| Ruby | `ruby` | 3.2+ | `.rb` | No |

## 🚀 Best Practices

### Client Implementation
1. **Handle Timeouts**: Set appropriate HTTP timeouts
2. **Parse Runtime Logs**: Monitor execution progress
3. **Check Exit Codes**: Verify successful execution
4. **Monitor Resources**: Track memory and CPU usage
5. **Error Handling**: Implement comprehensive error handling

### Security Considerations
1. **Input Validation**: Validate code and input on client side
2. **Rate Limiting**: Implement client-side rate limiting
3. **Authentication**: Use secure endpoints for sensitive operations
4. **Logging**: Monitor execution logs for security issues

### Performance Optimization
1. **Connection Pooling**: Reuse HTTP connections
2. **Request Batching**: Batch multiple executions when possible
3. **Caching**: Cache common code snippets
4. **Monitoring**: Track API response times and success rates

This enhanced API provides comprehensive code execution capabilities with detailed monitoring, security features, and graceful error handling for production use.

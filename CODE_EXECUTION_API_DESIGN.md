# Code Execution REST API Design

## Overview

This document outlines the design for a REST API endpoint that accepts code, programming language, and optionally input, then returns the output or error. The API is designed to be secure, scalable, and user-friendly.

## Base URL

```
http://localhost:5000/api/execute
```

## Endpoints

### 1. Execute Code (Public)

**Endpoint:** `POST /api/execute`

**Description:** Execute code with language and optional input

**Request Body:**
```json
{
  "language": "javascript",
  "code": "console.log('Hello World');",
  "input": "optional input data",
  "timeout": 5000,
  "memoryLimit": "256MB"
}
```

**Response (Success):**
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "compile_output": "",
  "status": "success",
  "executionTime": 1640995200000,
  "metrics": {
    "codeLength": 25,
    "executionDuration": 45,
    "language": "javascript",
    "memoryUsed": "2.5MB"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "SyntaxError: Unexpected token",
  "stderr": "SyntaxError: Unexpected token at line 1",
  "status": "error",
  "executionTime": 1640995200000,
  "metrics": {
    "codeLength": 25,
    "executionDuration": 12,
    "language": "javascript",
    "errorType": "SyntaxError"
  }
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
  "stdout": "Hello World\n",
  "stderr": "",
  "compile_output": "",
  "status": "success",
  "executionTime": 1640995200000,
  "executedBy": "user_id",
  "userDisplayName": "John Doe",
  "metrics": {
    "codeLength": 25,
    "executionDuration": 45,
    "language": "javascript",
    "memoryUsed": "2.5MB"
  }
}
```

### 3. Get Supported Languages

**Endpoint:** `GET /api/execute/languages`

**Description:** Get list of supported programming languages

**Response:**
```json
{
  "success": true,
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
      "version": "3.10+",
      "extension": ".py"
    }
  ],
  "count": 10
}
```

### 4. Health Check

**Endpoint:** `GET /api/execute/health`

**Description:** Check the health of code execution services

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "local": true,
    "docker": true,
    "judge0": false
  },
  "uptime": 3600
}
```

## Request Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `language` | string | Programming language identifier | `"javascript"` |
| `code` | string | Source code to execute | `"console.log('Hello');"` |

### Optional Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `input` | string | Input data for the program | `""` | `"5\n10"` |
| `timeout` | number | Execution timeout in milliseconds | `5000` | `10000` |
| `memoryLimit` | string | Memory limit for execution | `"256MB"` | `"512MB"` |

## Supported Languages

| Language | ID | Version | Extension |
|----------|----|---------|-----------|
| JavaScript | `javascript` | Node.js 18+ | `.js` |
| Python | `python` | 3.10+ | `.py` |
| Java | `java` | OpenJDK 13+ | `.java` |
| C++ | `cpp` | GCC 9.2+ | `.cpp` |
| C# | `csharp` | Mono 6.6+ | `.cs` |
| TypeScript | `typescript` | 4.9+ | `.ts` |
| Go | `go` | 1.19+ | `.go` |
| Rust | `rust` | 1.65+ | `.rs` |
| PHP | `php` | 8.1+ | `.php` |
| Ruby | `ruby` | 3.0+ | `.rb` |

## Validation Rules

### Code Validation
- **Maximum length:** 50KB
- **Required:** Yes
- **Content:** Must not contain forbidden patterns (system calls, file operations, etc.)

### Input Validation
- **Maximum length:** 1KB
- **Required:** No
- **Content:** Plain text input

### Language Validation
- **Required:** Yes
- **Must be:** One of the supported language IDs

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `MISSING_REQUIRED_FIELDS` | Language or code is missing |
| 400 | `UNSUPPORTED_LANGUAGE` | Language is not supported |
| 400 | `CODE_TOO_LONG` | Code exceeds maximum length |
| 400 | `INPUT_TOO_LONG` | Input exceeds maximum length |
| 401 | `UNAUTHORIZED` | Authentication required (for secure endpoint) |
| 500 | `EXECUTION_ERROR` | Code execution failed |

## Security Features

### 1. Code Sandboxing
- **Docker containers:** Isolated execution environment
- **Resource limits:** CPU, memory, and time constraints
- **Network isolation:** No network access by default

### 2. Input Validation
- **Pattern matching:** Blocks dangerous system calls
- **Length limits:** Prevents resource exhaustion
- **Language-specific:** Different rules per language

### 3. Authentication
- **JWT tokens:** For authenticated endpoints
- **Rate limiting:** Prevents abuse
- **User tracking:** Logs execution history

## Usage Examples

### JavaScript Example

```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "console.log(\"Hello World\");",
    "input": ""
  }'
```

### Python Example with Input

```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "name = input()\nprint(f\"Hello, {name}!\")",
    "input": "Alice"
  }'
```

### Java Example

```bash
curl -X POST http://localhost:5000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "java",
    "code": "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}"
  }'
```

## Response Fields

### Success Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful execution |
| `stdout` | string | Standard output from the program |
| `stderr` | string | Standard error from the program |
| `compile_output` | string | Compilation output (for compiled languages) |
| `status` | string | Execution status (`success`, `error`, `timeout`) |
| `executionTime` | number | Unix timestamp of execution |
| `metrics` | object | Execution metrics |

### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error` | string | Error message |
| `stderr` | string | Standard error output |
| `status` | string | Error status |
| `executionTime` | number | Unix timestamp of execution |
| `metrics` | object | Execution metrics including error type |

### Metrics Object

| Field | Type | Description |
|-------|------|-------------|
| `codeLength` | number | Length of source code in characters |
| `executionDuration` | number | Execution time in milliseconds |
| `language` | string | Programming language used |
| `memoryUsed` | string | Memory usage during execution |
| `errorType` | string | Type of error (if applicable) |

## Rate Limiting

- **Public endpoint:** 10 requests per minute per IP
- **Authenticated endpoint:** 100 requests per minute per user
- **Burst limit:** 5 requests per second

## Monitoring and Logging

### Execution Logs
- **Success:** Language, execution time, code length
- **Errors:** Error type, stack trace, user context
- **Security:** Blocked patterns, resource usage

### Metrics
- **Performance:** Response times, throughput
- **Usage:** Language popularity, error rates
- **Resources:** Memory usage, CPU utilization

## Best Practices

### Client Implementation

1. **Always handle errors:** Check `success` field in response
2. **Set appropriate timeouts:** Match server timeout settings
3. **Validate input:** Check language support before sending
4. **Use authentication:** For production applications
5. **Implement retry logic:** For transient failures

### Security Considerations

1. **Never trust user input:** Always validate on server
2. **Use HTTPS:** In production environments
3. **Implement rate limiting:** Prevent abuse
4. **Monitor usage:** Track suspicious patterns
5. **Regular updates:** Keep dependencies updated

## Integration Examples

### JavaScript/TypeScript

```javascript
async function executeCode(language, code, input = '') {
  try {
    const response = await fetch('http://localhost:5000/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, code, input })
    });

    const result = await response.json();
    
    if (result.success) {
      return {
        output: result.stdout,
        error: result.stderr,
        executionTime: result.metrics.executionDuration
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Code execution failed:', error);
    throw error;
  }
}
```

### Python

```python
import requests
import json

def execute_code(language, code, input_data=""):
    try:
        response = requests.post(
            'http://localhost:5000/api/execute',
            headers={'Content-Type': 'application/json'},
            json={
                'language': language,
                'code': code,
                'input': input_data
            },
            timeout=30
        )
        
        result = response.json()
        
        if result['success']:
            return {
                'output': result['stdout'],
                'error': result['stderr'],
                'execution_time': result['metrics']['executionDuration']
            }
        else:
            raise Exception(result['error'])
            
    except Exception as e:
        print(f"Code execution failed: {e}")
        raise
```

## Troubleshooting

### Common Issues

1. **Connection refused:** Check if server is running
2. **Timeout errors:** Increase timeout or optimize code
3. **Language not supported:** Check supported languages list
4. **Authentication errors:** Verify JWT token validity
5. **Resource limits:** Check memory and CPU constraints

### Debug Information

Enable debug logging by setting environment variable:
```bash
DEBUG=code-execution npm start
```

This will provide detailed logs for:
- Container creation and cleanup
- Code validation steps
- Execution metrics
- Error details

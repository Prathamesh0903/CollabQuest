# Enhanced Code Execution Guide

This guide explains how to use the enhanced code execution features that support file upload/download and interactive stdin for languages like Python.

## Features Overview

The enhanced code execution system provides three execution modes:

1. **Basic Mode**: Standard code execution with stdin input
2. **Files Mode**: Code execution with file upload/download support
3. **Interactive Mode**: Real-time interactive stdin support

## Setup Requirements

### Server Dependencies

Make sure you have the following packages installed in your server:

```bash
npm install multer uuid
```

### Docker Setup

Ensure Docker is running and accessible. The system uses Docker containers for secure code execution.

## API Endpoints

### 1. Basic Code Execution

**Endpoint**: `POST /api/execute`

```json
{
  "language": "python",
  "code": "print('Hello World')",
  "input": "optional input data",
  "timeout": 10000,
  "memoryLimit": "256MB"
}
```

### 2. Code Execution with Files

**Endpoint**: `POST /api/execute/with-files`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `language`: Programming language
- `code`: Source code
- `input`: Optional input data
- `sessionId`: Session identifier
- `files`: Array of uploaded files

**Response**:
```json
{
  "success": true,
  "data": {
    "stdout": "Hello World",
    "stderr": "",
    "compile_output": "",
    "generated_files": [
      {
        "name": "output.txt",
        "size": 1024,
        "path": "output.txt"
      }
    ]
  },
  "execution": {
    "files_uploaded": 2,
    "files_generated": 1
  }
}
```

### 3. Interactive Execution

**Create Session**: `POST /api/execute/interactive`
```json
{
  "language": "python",
  "code": "name = input('Enter your name: ')\nprint(f'Hello, {name}!')",
  "sessionId": "unique_session_id"
}
```

**Send Input**: `POST /api/execute/interactive/:sessionId/input`
```json
{
  "input": "John"
}
```

**Terminate Session**: `DELETE /api/execute/interactive/:sessionId`

### 4. File Management

**List Files**: `GET /api/execute/files/:sessionId`

**Download File**: `GET /api/execute/files/:sessionId/:filename`

## Usage Examples

### Python File Processing Example

```python
# Example: Read from uploaded file and create output
import os

print("Files in current directory:")
for file in os.listdir('.'):
    print(f"- {file}")

# Read from input file if it exists
try:
    with open('input.txt', 'r') as f:
        content = f.read()
        print(f"\nInput file content:\n{content}")
except FileNotFoundError:
    print("\nNo input.txt file found")

# Process data and create output
data = "Processed data from input file"
with open('output.txt', 'w') as f:
    f.write(data)

print(f"\nCreated output.txt with processed data")
```

### JavaScript File Processing Example

```javascript
const fs = require('fs');

console.log('Files in current directory:');
const files = fs.readdirSync('.');
files.forEach(file => console.log(`- ${file}`));

// Read from input file if it exists
try {
    const content = fs.readFileSync('input.txt', 'utf8');
    console.log(`\nInput file content:\n${content}`);
} catch (error) {
    console.log('\nNo input.txt file found');
}

// Process data and create output
const data = 'Processed data from input file';
fs.writeFileSync('output.txt', data);

console.log('\nCreated output.txt with processed data');
```

### Interactive Python Example

```python
# Interactive calculator
print("Simple Calculator")
print("Enter 'quit' to exit")

while True:
    try:
        expression = input("Enter expression (e.g., 2 + 3): ")
        
        if expression.lower() == 'quit':
            print("Goodbye!")
            break
            
        result = eval(expression)
        print(f"Result: {result}")
        
    except Exception as e:
        print(f"Error: {e}")
```

## Frontend Component Usage

### Import the Component

```tsx
import EnhancedCodeExecution from './components/EnhancedCodeExecution';

function App() {
  return (
    <div>
      <EnhancedCodeExecution />
    </div>
  );
}
```

### Component Features

1. **Mode Selection**: Choose between Basic, Files, and Interactive modes
2. **Language Support**: Supports 10+ programming languages
3. **File Upload**: Drag and drop or click to upload files
4. **File Download**: Download generated files after execution
5. **Interactive Input**: Real-time stdin support for interactive programs
6. **Session Management**: Persistent file storage per session

## Security Considerations

### File Upload Security

- **File Type Validation**: Only allows safe file extensions
- **Size Limits**: 10MB per file, 20 files maximum
- **Sandboxed Execution**: Code runs in isolated Docker containers
- **Path Validation**: Prevents directory traversal attacks

### Code Execution Security

- **Resource Limits**: CPU and memory restrictions
- **Network Isolation**: Containers have no network access
- **Process Limits**: Maximum 50 processes per container
- **Timeout Protection**: Automatic termination of long-running code

### Allowed File Extensions

```
Programming: .py, .js, .ts, .java, .cpp, .c, .cs, .go, .rs, .php, .rb
Web: .html, .css, .json, .xml
Data: .txt, .md, .sql, .csv, .dat
Config: .cfg, .ini, .yml, .yaml
Scripts: .sh, .bat
Logs: .log
```

## Docker Configuration

The system uses language-specific Docker images:

- **Python**: `python:3.11-alpine`
- **JavaScript**: `node:18-alpine`
- **Java**: `openjdk:17-alpine`
- **C++**: `gcc:latest`
- **Go**: `golang:1.21-alpine`
- **Rust**: `rust:1.75-alpine`

### Container Security Settings

```javascript
HostConfig: {
  Memory: 512 * 1024 * 1024, // 512MB limit
  MemorySwap: 0,
  CpuPeriod: 100000,
  CpuQuota: 50000, // 50% CPU limit
  PidsLimit: 50,
  NetworkMode: 'none',
  SecurityOpt: ['no-new-privileges'],
  ReadonlyRootfs: false,
  Ulimits: [
    { Name: 'nofile', Soft: 64, Hard: 64 },
    { Name: 'nproc', Soft: 50, Hard: 50 },
    { Name: 'fsize', Soft: 1024 * 1024, Hard: 1024 * 1024 },
    { Name: 'core', Soft: 0, Hard: 0 }
  ]
}
```

## Error Handling

### Common Error Types

1. **Timeout Errors**: Code runs too long
2. **Memory Errors**: Code exceeds memory limits
3. **Compilation Errors**: Syntax errors in compiled languages
4. **File Errors**: Missing or inaccessible files
5. **Security Errors**: Attempted security violations

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Execution timed out after 10000ms",
    "type": "TIMEOUT_ERROR",
    "code": "TIMEOUT_ERROR",
    "details": {
      "execution_time": 10000,
      "language": "python"
    }
  },
  "data": {
    "stdout": "",
    "stderr": "",
    "exit_code": -1
  }
}
```

## Performance Optimization

### Best Practices

1. **Use Alpine Images**: Smaller, faster Docker images
2. **Limit File Sizes**: Keep uploaded files under 1MB when possible
3. **Optimize Code**: Avoid infinite loops and memory leaks
4. **Use Sessions**: Reuse session IDs for related executions
5. **Clean Up**: Terminate interactive sessions when done

### Monitoring

The system provides detailed execution metrics:

- Execution time
- Memory usage
- CPU usage
- File operations
- Container statistics

## Troubleshooting

### Common Issues

1. **Docker Not Running**
   - Ensure Docker daemon is started
   - Check Docker permissions

2. **File Upload Fails**
   - Verify file size limits
   - Check file extension restrictions
   - Ensure proper form data format

3. **Interactive Session Issues**
   - Check session timeout settings
   - Verify input format
   - Ensure proper session termination

4. **Permission Errors**
   - Check file system permissions
   - Verify Docker container permissions
   - Ensure proper user access

### Debug Information

Enable debug logging by setting environment variables:

```bash
DEBUG=code-execution:*
NODE_ENV=development
```

## API Rate Limiting

The system implements rate limiting to prevent abuse:

- **15-minute window**: 100 requests per IP
- **File uploads**: 20 files per request
- **Interactive sessions**: 10 concurrent sessions per user

## Future Enhancements

Planned features for future releases:

1. **Real-time Collaboration**: Multiple users in same session
2. **Advanced File Management**: File editing and versioning
3. **Custom Docker Images**: User-defined execution environments
4. **WebSocket Support**: Real-time interactive communication
5. **Plugin System**: Language-specific extensions
6. **Analytics Dashboard**: Usage statistics and monitoring

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review error logs in server console
3. Verify Docker and system requirements
4. Test with simple examples first
5. Check API documentation for endpoint details

## License

This enhanced code execution system is part of the collaborative coding platform and follows the same licensing terms.

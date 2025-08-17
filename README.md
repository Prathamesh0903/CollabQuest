# Docker Code Executor

A secure, Docker-based code execution system that safely runs untrusted user code in isolated containers. Supports Python, JavaScript, and Java with comprehensive security measures.

## 🚀 Features

- **Multi-language Support**: Python, JavaScript, and Java
- **Security First**: Isolated containers with strict resource limits
- **Input/Output Handling**: Supports stdin/stdout for interactive programs
- **Automatic Cleanup**: Containers are automatically removed after execution
- **Comprehensive Validation**: Pattern-based security checks for dangerous operations
- **Resource Limits**: Memory, CPU, and time constraints
- **Error Handling**: Detailed error reporting and logging

## 🔒 Security Features

- **Container Isolation**: Each execution runs in a separate Docker container
- **Resource Limits**: 
  - Memory: 256MB maximum
  - CPU: 50% maximum
  - Time: 10 seconds maximum
  - Processes: 50 maximum
- **Network Isolation**: No network access by default
- **Read-only Filesystem**: Prevents file system modifications
- **Non-root User**: Containers run as `nobody:nobody`
- **Pattern Validation**: Blocks dangerous imports and system calls
- **Input Sanitization**: Validates and limits input size

## 📋 Prerequisites

- **Docker**: Must be installed and running
- **Node.js**: Version 16 or higher
- **Linux/macOS**: For Docker support

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd docker-code-executor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Ensure Docker is running**:
   ```bash
   docker --version
   docker ps
   ```

## 🚀 Quick Start

### Basic Usage

```javascript
const { DockerCodeExecutor } = require('./docker-code-executor');

// Create executor instance
const executor = new DockerCodeExecutor();

// Execute Python code
const result = await executor.executeCode('python', 'print("Hello, World!")');
console.log(result);
// Output: { success: true, stdout: 'Hello, World!\n', stderr: '', executionTime: 123, ... }

// Execute JavaScript code
const jsResult = await executor.executeCode('javascript', 'console.log("Hello from JS!");');
console.log(jsResult);

// Execute Java code
const javaResult = await executor.executeCode('java', `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`);
console.log(javaResult);
```

### With Input

```javascript
// Python with input
const result = await executor.executeCode('python', `
name = input()
print(f"Hello, {name}!")
`, 'Alice');

// JavaScript with input
const jsResult = await executor.executeCode('javascript', `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', (answer) => {
  console.log("Hello, " + answer + "!");
  rl.close();
});
`, 'Bob');
```

### Configuration Options

```javascript
const executor = new DockerCodeExecutor({
  dockerSocket: '/var/run/docker.sock',  // Docker socket path
  tempDir: '/tmp',                       // Temporary directory
  maxExecutionTime: 10000,               // 10 seconds
  maxMemory: 256 * 1024 * 1024,         // 256MB
  maxCodeLength: 50000                   // 50KB
});
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

This will test:
- ✅ Basic code execution for all languages
- ✅ Input/output handling
- ✅ Security validation (blocking dangerous code)
- ✅ Resource limits
- ✅ Error handling
- ✅ Health checks

## 📚 API Reference

### DockerCodeExecutor Class

#### Constructor
```javascript
new DockerCodeExecutor(options)
```

**Options:**
- `dockerSocket` (string): Docker socket path (default: `/var/run/docker.sock`)
- `tempDir` (string): Temporary directory (default: system temp dir)
- `maxExecutionTime` (number): Maximum execution time in ms (default: 10000)
- `maxMemory` (number): Maximum memory in bytes (default: 256MB)
- `maxCodeLength` (number): Maximum code length in characters (default: 50000)

#### Methods

##### `executeCode(language, code, input)`
Execute code in the specified language.

**Parameters:**
- `language` (string): Language identifier (`python`, `javascript`, `java`)
- `code` (string): Source code to execute
- `input` (string, optional): Input data for the program

**Returns:**
```javascript
{
  success: boolean,
  stdout: string,
  stderr: string,
  executionTime: number,
  language: string,
  codeLength: number,
  error?: string
}
```

##### `validateCode(code, language)`
Validate code for security and syntax.

**Parameters:**
- `code` (string): Source code to validate
- `language` (string): Language identifier

**Returns:** `true` if valid, throws error if invalid

##### `getSupportedLanguages()`
Get list of supported programming languages.

**Returns:**
```javascript
[
  {
    id: 'python',
    name: 'Python',
    version: '3.11',
    extension: '.py'
  },
  // ...
]
```

##### `healthCheck()`
Check the health of the Docker daemon.

**Returns:**
```javascript
{
  status: 'healthy' | 'unhealthy',
  docker: boolean,
  error?: string
}
```

## 🔧 Supported Languages

### Python
- **Image**: `python:3.11-alpine`
- **Version**: Python 3.11
- **Features**: Full Python standard library (except dangerous modules)
- **Security**: Blocks `os`, `subprocess`, `sys`, file operations, etc.

### JavaScript
- **Image**: `node:18-alpine`
- **Version**: Node.js 18
- **Features**: Full Node.js runtime (except dangerous modules)
- **Security**: Blocks `fs`, `child_process`, `process`, `eval`, etc.

### Java
- **Image**: `openjdk:17-alpine`
- **Version**: OpenJDK 17
- **Features**: Full Java standard library (except dangerous packages)
- **Security**: Blocks `java.io`, `java.nio`, `java.net`, file operations, etc.

## 🛡️ Security Measures

### Code Validation
The system validates code before execution to prevent dangerous operations:

**Python Forbidden Patterns:**
- `import os`, `import subprocess`, `import sys`
- `exec()`, `eval()`, `open()`
- `os.system()`, `subprocess.call()`

**JavaScript Forbidden Patterns:**
- `require('fs')`, `require('child_process')`
- `eval()`, `Function()`
- `process.exit()`, `process.kill()`

**Java Forbidden Patterns:**
- `import java.io.*`, `import java.nio.*`
- `System.exit()`, `Runtime.getRuntime()`
- `File`, `FileInputStream`, `ProcessBuilder`

### Container Security
- **Isolation**: Each execution runs in a separate container
- **Resource Limits**: Strict memory, CPU, and time constraints
- **Network Isolation**: No network access by default
- **Read-only Filesystem**: Prevents file system modifications
- **Non-root User**: Containers run as unprivileged user
- **Automatic Cleanup**: Containers are removed after execution

## 📊 Performance

Typical execution times:
- **Python**: 100-500ms
- **JavaScript**: 50-300ms
- **Java**: 500-2000ms (includes compilation)

Resource usage per execution:
- **Memory**: 50-200MB
- **CPU**: 10-50% (limited to 50% max)
- **Disk**: Minimal (read-only filesystem)

## 🚨 Error Handling

The system provides detailed error information:

```javascript
{
  success: false,
  error: "Forbidden pattern detected: /import\\s+os\\s*$/m",
  stderr: "",
  executionTime: 45,
  language: "python",
  codeLength: 25
}
```

Common error types:
- **Validation Errors**: Code contains forbidden patterns
- **Timeout Errors**: Execution exceeds time limit
- **Resource Errors**: Memory or CPU limits exceeded
- **Docker Errors**: Container creation or execution failed

## 🔍 Monitoring and Logging

The system includes comprehensive logging:

```javascript
// Enable debug logging
const executor = new DockerCodeExecutor({
  debug: true
});

// Monitor resource usage
const result = await executor.executeCode('python', 'print("test")');
console.log(`Execution time: ${result.executionTime}ms`);
console.log(`Code length: ${result.codeLength} characters`);
```

## 🚀 Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  code-executor:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Environment Variables
```bash
# Docker configuration
DOCKER_SOCKET=/var/run/docker.sock
DOCKER_HOST=unix:///var/run/docker.sock

# Resource limits
MAX_EXECUTION_TIME=10000
MAX_MEMORY=268435456
MAX_CODE_LENGTH=50000

# Security
SECURITY_LEVEL=high
ENABLE_LOGGING=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This system is designed for educational and development purposes. While it includes comprehensive security measures, no sandbox is 100% secure. Use at your own risk in production environments.

## 🆘 Troubleshooting

### Common Issues

**Docker not running:**
```bash
# Start Docker
sudo systemctl start docker
# or
sudo service docker start
```

**Permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**Container creation failed:**
```bash
# Check Docker daemon
docker ps
# Check available images
docker images
```

**Memory limit exceeded:**
```bash
# Increase memory limit
const executor = new DockerCodeExecutor({
  maxMemory: 512 * 1024 * 1024 // 512MB
});
```

### Debug Mode
Enable debug logging for troubleshooting:

```javascript
const executor = new DockerCodeExecutor({
  debug: true,
  verbose: true
});
```

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the test suite for examples

---

**Happy coding! 🎉** 
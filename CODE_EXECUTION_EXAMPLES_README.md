# Code Execution API Examples

This document provides comprehensive examples of how to send code to the backend `/api/execute` endpoint and display the results in the editor UI.

## 📋 Overview

The code execution API allows you to:
- Execute code in multiple programming languages
- Send custom input data to your code
- Set execution timeouts and memory limits
- Handle authentication for secure execution
- Display comprehensive execution results

## 🚀 Quick Start

### 1. React Component Example

Use the `CodeExecutionExample` component for a full-featured React implementation:

```tsx
import CodeExecutionExample from './components/CodeExecutionExample';

function App() {
  return (
    <div className="App">
      <CodeExecutionExample />
    </div>
  );
}
```

### 2. Vanilla JavaScript Example

Use the utility functions for vanilla JavaScript:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Code Execution Demo</title>
</head>
<body>
    <div id="code-execution-container"></div>
    
    <script src="./utils/codeExecutionExample.js"></script>
    <script>
        // Create the UI when page loads
        document.addEventListener('DOMContentLoaded', () => {
            CodeExecutionAPI.createCodeExecutionUI('code-execution-container');
        });
    </script>
</body>
</html>
```

## 📚 API Endpoints

### 1. Public Code Execution

**Endpoint:** `POST /api/execute`

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    language: 'javascript',
    code: 'console.log("Hello World");',
    input: 'optional input data',
    timeout: 10000,
    memoryLimit: '256MB'
  })
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "compile_output": "",
  "status": "success",
  "executionTime": 45,
  "metrics": {
    "codeLength": 25,
    "executionDuration": 45,
    "language": "javascript",
    "memoryUsed": "2.5MB"
  },
  "runtime_logs": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "level": "INFO",
      "message": "Starting javascript code execution",
      "details": {
        "code_length": 25,
        "input_length": 0,
        "timeout": 10000,
        "memory_limit": "256MB"
      }
    }
  ]
}
```

### 2. Authenticated Code Execution

**Endpoint:** `POST /api/execute/secure`

**Request:**
```javascript
const response = await fetch('http://localhost:5000/api/execute/secure', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    language: 'javascript',
    code: 'console.log("Hello World");',
    input: 'optional input data'
  })
});

const result = await response.json();
```

## 🔧 Implementation Examples

### Example 1: Basic Code Execution

```javascript
// Using the utility function
const result = await CodeExecutionAPI.executeCodeBasic('javascript', `
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));
`);

if (result.success) {
  console.log('Output:', result.stdout);
  console.log('Execution time:', result.executionTime);
} else {
  console.error('Error:', result.error);
}
```

### Example 2: Authenticated Execution

```javascript
// Get token from your auth system
const token = localStorage.getItem('authToken');

const result = await CodeExecutionAPI.executeCodeAuthenticated(
  'python',
  'print("Hello from Python!")\nprint(input())',
  'World',
  token
);

if (result.success) {
  console.log('Python output:', result.stdout);
} else {
  console.error('Authentication or execution error:', result.error);
}
```

### Example 3: Execution with Custom Limits

```javascript
const result = await CodeExecutionAPI.executeCodeWithLimits(
  'javascript',
  'while(true) { console.log("Infinite loop"); }',
  '',
  3000,  // 3 second timeout
  '64MB' // 64MB memory limit
);

if (result.status === 'timeout') {
  console.log('Code execution timed out');
}
```

### Example 4: Display Results in UI

```javascript
// Display results in a specific element
CodeExecutionAPI.displayExecutionResult(result, 'output-container');

// Or create a complete UI
CodeExecutionAPI.createCodeExecutionUI('container-id');
```

## 🎨 React Component Features

The `CodeExecutionExample` React component includes:

### Features
- **Multi-language Support**: JavaScript, Python, Java, C++, C#, TypeScript, Go, Rust, PHP, Ruby
- **Three Execution Modes**:
  - Basic execution (public endpoint)
  - Authenticated execution (requires token)
  - Limited execution (custom timeout/memory)
- **Real-time Output Display**: Shows stdout, stderr, compile output, and errors
- **Execution History**: Tracks last 10 executions
- **Custom Input Support**: Send input data to your code
- **Status Indicators**: Visual feedback for success, error, and timeout states
- **Execution Metrics**: Shows timing, memory usage, and code length
- **Runtime Logs**: Detailed execution logs when available

### Usage

```tsx
import CodeExecutionExample from './components/CodeExecutionExample';

function App() {
  return (
    <div className="App">
      <CodeExecutionExample />
    </div>
  );
}
```

## 🛡️ Error Handling

The examples include comprehensive error handling:

### Common Error Scenarios

1. **Server Not Running**
```javascript
// Error: Cannot connect to server. Please ensure the server is running on http://localhost:5000
```

2. **Invalid Response Format**
```javascript
// Error: Server returned invalid response. This usually means the server is not running or there's a configuration issue.
```

3. **Authentication Required**
```javascript
// Error: Authentication required. Please log in first.
```

4. **Unsupported Language**
```javascript
// Error: Unsupported language. Supported: javascript, python, java, cpp, csharp, typescript, go, rust, php, ruby
```

5. **Code Too Long**
```javascript
// Error: Code too long (max 50KB)
```

6. **Execution Timeout**
```javascript
// Status: timeout
// Error: Execution timed out after 5000ms
```

### Error Handling Best Practices

```javascript
try {
  const result = await executeCodeBasic(language, code, input);
  
  if (result.success) {
    // Handle success
    displayOutput(result.stdout);
  } else {
    // Handle execution error
    displayError(result.error);
  }
} catch (error) {
  // Handle network/connection errors
  if (error.message.includes('Failed to fetch')) {
    showServerError();
  } else {
    showGenericError(error.message);
  }
}
```

## 🔒 Security Considerations

### Input Validation
- Code length is limited to 50KB
- Input data is limited to 1KB
- Supported languages are validated
- Dangerous patterns are blocked

### Authentication
- Use the `/api/execute/secure` endpoint for authenticated requests
- Include JWT token in Authorization header
- Handle 401 Unauthorized responses

### Resource Limits
- Set appropriate timeouts (default: 10 seconds)
- Set memory limits (default: 256MB)
- Monitor execution metrics

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "stdout": "Program output",
  "stderr": "",
  "compile_output": "",
  "status": "success",
  "executionTime": 123,
  "metrics": {
    "codeLength": 150,
    "executionDuration": 123,
    "language": "javascript",
    "memoryUsed": "2.5MB"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "stderr": "Error details",
  "status": "error",
  "executionTime": 45
}
```

### Timeout Response
```json
{
  "success": false,
  "error": "Execution timed out after 5000ms",
  "status": "timeout",
  "executionTime": 5000
}
```

## 🎯 Supported Languages

| Language | ID | File Extension | Example |
|----------|----|----------------|---------|
| JavaScript | `javascript` | `.js` | `console.log("Hello");` |
| Python | `python` | `.py` | `print("Hello")` |
| Java | `java` | `.java` | `System.out.println("Hello");` |
| C++ | `cpp` | `.cpp` | `cout << "Hello" << endl;` |
| C# | `csharp` | `.cs` | `Console.WriteLine("Hello");` |
| TypeScript | `typescript` | `.ts` | `console.log("Hello");` |
| Go | `go` | `.go` | `fmt.Println("Hello")` |
| Rust | `rust` | `.rs` | `println!("Hello");` |
| PHP | `php` | `.php` | `echo "Hello";` |
| Ruby | `ruby` | `.rb` | `puts "Hello"` |

## 🚀 Getting Started

### Prerequisites
1. Ensure the backend server is running on `http://localhost:5000`
2. The `/api/execute` endpoint is available
3. For authenticated requests, obtain a valid JWT token

### Installation
1. Copy the example files to your project
2. Import the components or utility functions
3. Start using the code execution API

### Testing
```javascript
// Test basic execution
const result = await CodeExecutionAPI.executeCodeBasic('javascript', 'console.log("Test successful");');
console.log('Test result:', result);
```

## 📝 Notes

- The server must be running on `http://localhost:5000` for the examples to work
- Authentication tokens should be obtained from your auth system
- All examples include proper error handling and user feedback
- The React component is fully styled and responsive
- The vanilla JavaScript utilities can be used in any web application

## 🤝 Contributing

Feel free to extend these examples with:
- Additional language support
- More sophisticated error handling
- Enhanced UI features
- Integration with other frameworks
- Additional security measures

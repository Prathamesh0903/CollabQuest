# Terminal Component

A modern, feature-rich terminal component for displaying code execution output in React applications.

## Features

### ✅ Core Functionality
- **Separate Output Streams**: Displays stdout, stderr, and compilation output in distinct sections
- **Error Handling**: Shows syntax errors, runtime errors, and compilation errors with proper formatting
- **Auto-clear**: Automatically clears terminal when new code execution starts
- **Execution Time**: Displays execution time for performance monitoring

### ✅ User Experience
- **Color-coded Output**: Different colors for success, error, and info messages
- **Copy Functionality**: Copy button for each output section
- **Custom Input**: Textarea for stdin input
- **Loading States**: Spinner animation during code execution
- **Empty States**: Helpful message when no output is available

### ✅ Keyboard Shortcuts
- `Ctrl+Enter` or `Cmd+Enter`: Run code
- `Ctrl+\`` or `Cmd+\``: Toggle terminal visibility
- `Esc`: Close terminal

### ✅ Responsive Design
- Adapts to different screen sizes
- Mobile-friendly interface
- Proper scrolling for long outputs

## Usage

### Basic Implementation

```tsx
import React, { useState } from 'react';
import Terminal, { TerminalOutput } from './Terminal';

const MyComponent: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const handleRunCode = async () => {
    setIsLoading(true);
    setShowTerminal(true);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'print("Hello World")', language: 'python' })
      });

      const result = await response.json();
      
      if (result.success) {
        setTerminalOutput({
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compile_output: result.compile_output || '',
          status: result.status || 'success',
          executionTime: result.executionTime
        });
      } else {
        setTerminalOutput({ error: result.error || 'Execution failed' });
      }
    } catch (error) {
      setTerminalOutput({ error: 'Failed to execute code' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTerminal = () => {
    setTerminalOutput(null);
  };

  return (
    <div>
      <button onClick={handleRunCode}>Run Code</button>
      
      <Terminal
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
        output={terminalOutput}
        isLoading={isLoading}
        customInput={customInput}
        onCustomInputChange={setCustomInput}
        onClear={handleClearTerminal}
      />
    </div>
  );
};
```

### TerminalOutput Interface

```tsx
interface TerminalOutput {
  stdout?: string;           // Standard output
  stderr?: string;           // Standard error
  compile_output?: string;   // Compilation errors
  status?: string;           // Execution status
  executionTime?: number;    // Execution time in milliseconds
  error?: string;            // General error message
}
```

## Integration with Backend

The terminal component expects the backend to return execution results in this format:

```json
{
  "success": true,
  "result": {
    "stdout": "Hello World\n",
    "stderr": "",
    "compile_output": "",
    "status": "success",
    "executionTime": 45
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Execution failed: timeout"
}
```

## Styling

The component uses CSS modules and includes:

- Dark theme optimized for code editors
- Smooth animations and transitions
- Custom scrollbars
- Hover effects for interactive elements
- Responsive breakpoints for mobile devices

### Customization

You can override styles by targeting the CSS classes:

```css
.terminal-panel {
  /* Custom terminal panel styles */
}

.terminal-header {
  /* Custom header styles */
}

.output-section.stdout .output-label {
  /* Custom stdout label styles */
}

.output-text.error {
  /* Custom error text styles */
}
```

## Examples

### Python Code Execution

```python
# Sample Python code
print("Hello from Python!")
x = 10
y = 20
print(f"Sum: {x + y}")
```

**Output:**
```
📤 Standard Output
Hello from Python!
Sum: 30
```

### JavaScript Error

```javascript
// Sample JavaScript with error
console.log("Starting...");
undefinedVariable.someMethod();
console.log("This won't run");
```

**Output:**
```
❌ Standard Error
ReferenceError: undefinedVariable is not defined
    at <anonymous>:1:1
```

### Compilation Error

```python
# Python syntax error
print("Hello World"  # Missing closing parenthesis
```

**Output:**
```
🔨 Compilation Output
SyntaxError: invalid syntax
  File "<string>", line 1
    print("Hello World"
                    ^
```

## Best Practices

1. **Always handle loading states** to provide user feedback
2. **Clear terminal on new execution** to avoid confusion
3. **Use proper error handling** to catch and display execution failures
4. **Provide meaningful error messages** from the backend
5. **Consider execution timeouts** for long-running code
6. **Validate input** before sending to execution service

## Dependencies

- React 16.8+ (for hooks)
- TypeScript (for type safety)
- Modern browser with clipboard API support

## Browser Support

- Chrome 66+
- Firefox 63+
- Safari 13.1+
- Edge 79+

## License

MIT License - feel free to use in your projects! 
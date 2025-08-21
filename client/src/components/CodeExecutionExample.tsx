import React, { useState, useCallback } from 'react';
import './CodeExecutionExample.css';

// Types for code execution
interface CodeExecutionRequest {
  language: string;
  code: string;
  input?: string;
  timeout?: number;
  memoryLimit?: string;
}

interface CodeExecutionResponse {
  success: boolean;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: 'success' | 'error' | 'timeout';
  executionTime?: number;
  error?: string;
  metrics?: {
    codeLength: number;
    executionDuration: number;
    language: string;
    memoryUsed?: string;
  };
  runtime_logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
    details?: any;
  }>;
}

interface TerminalOutput {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: string;
  executionTime?: number;
  error?: string;
}

const CodeExecutionExample: React.FC = () => {
  const [code, setCode] = useState<string>(`// Welcome to the Code Execution Example!
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));
console.log("Code execution successful! 🎉");`);

  const [language, setLanguage] = useState<string>('javascript');
  const [customInput, setCustomInput] = useState<string>('');
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [executionHistory, setExecutionHistory] = useState<CodeExecutionResponse[]>([]);

  // Supported languages
  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript', extension: 'js' },
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'java', name: 'Java', extension: 'java' },
    { id: 'cpp', name: 'C++', extension: 'cpp' },
    { id: 'csharp', name: 'C#', extension: 'cs' },
    { id: 'typescript', name: 'TypeScript', extension: 'ts' },
    { id: 'go', name: 'Go', extension: 'go' },
    { id: 'rust', name: 'Rust', extension: 'rs' },
    { id: 'php', name: 'PHP', extension: 'php' },
    { id: 'ruby', name: 'Ruby', extension: 'rb' }
  ];

  // Example 1: Basic code execution
  const executeCodeBasic = useCallback(async () => {
    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setShowTerminal(true);

    try {
      const requestBody: CodeExecutionRequest = {
        language,
        code,
        input: customInput
      };

      console.log('Sending code execution request:', requestBody);

      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received HTML instead of JSON:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status} with non-JSON response. Please check if the server is running.`);
      }

      const result: CodeExecutionResponse = await response.json();
      console.log('Code execution result:', result);

      if (result.success) {
        setTerminalOutput({
          stdout: (result as any).data?.stdout || (result as any).stdout || '',
          stderr: (result as any).data?.stderr || (result as any).stderr || '',
          compile_output: (result as any).data?.compile_output || (result as any).compile_output || '',
          status: (result as any).status || 'success',
          executionTime: (result as any).execution?.duration_ms || (result as any).executionTime
        });
      } else {
        setTerminalOutput({
          error: (result as any).error || 'Execution failed',
          stderr: (result as any).data?.stderr || (result as any).stderr || '',
          status: 'error'
        });
      }

      // Add to execution history
      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 executions

    } catch (error) {
      console.error('Code execution error:', error);
      
      let errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
      } else if (errorMessage.includes('Unexpected token')) {
        errorMessage = 'Server returned invalid response. This usually means the server is not running or there\'s a configuration issue.';
      }
      
      setTerminalOutput({
        error: `Failed to execute code: ${errorMessage}`,
        status: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, customInput]);

  // Example 2: Authenticated code execution
  const executeCodeAuthenticated = useCallback(async () => {
    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setShowTerminal(true);

    try {
      // Get authentication token (you would typically get this from your auth context)
      const token = localStorage.getItem('authToken'); // Replace with your actual auth method
      
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }

      const requestBody: CodeExecutionRequest = {
        language,
        code,
        input: customInput,
        timeout: 10000, // 10 seconds
        memoryLimit: '256MB'
      };

      console.log('Sending authenticated code execution request:', requestBody);

      const response = await fetch('http://localhost:5000/api/execute/secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received HTML instead of JSON:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status} with non-JSON response.`);
      }

      const result: CodeExecutionResponse = await response.json();
      console.log('Authenticated code execution result:', result);

      if (result.success) {
        setTerminalOutput({
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compile_output: result.compile_output || '',
          status: result.status || 'success',
          executionTime: result.executionTime
        });
      } else {
        setTerminalOutput({
          error: result.error || 'Execution failed',
          stderr: result.stderr || '',
          status: 'error'
        });
      }

      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Authenticated code execution error:', error);
      
      let errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Authentication failed. Please log in again.';
      }
      
      setTerminalOutput({
        error: `Failed to execute code: ${errorMessage}`,
        status: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, customInput]);

  // Example 3: Code execution with custom timeout and memory limits
  const executeCodeWithLimits = useCallback(async () => {
    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    setIsExecuting(true);
    setShowTerminal(true);

    try {
      const requestBody: CodeExecutionRequest = {
        language,
        code,
        input: customInput,
        timeout: 5000, // 5 seconds timeout
        memoryLimit: '128MB' // 128MB memory limit
      };

      console.log('Sending code execution request with limits:', requestBody);

      const response = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received HTML instead of JSON:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status} with non-JSON response.`);
      }

      const result: CodeExecutionResponse = await response.json();
      console.log('Code execution result with limits:', result);

      if (result.success) {
        setTerminalOutput({
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          compile_output: result.compile_output || '',
          status: result.status || 'success',
          executionTime: result.executionTime
        });
      } else {
        setTerminalOutput({
          error: result.error || 'Execution failed',
          stderr: result.stderr || '',
          status: 'error'
        });
      }

      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error('Code execution with limits error:', error);
      
      let errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
      }
      
      setTerminalOutput({
        error: `Failed to execute code: ${errorMessage}`,
        status: 'error'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, customInput]);

  // Clear terminal output
  const clearTerminal = () => {
    setTerminalOutput(null);
  };

  // Get status color for terminal
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'timeout':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  // Format execution time
  const formatExecutionTime = (time?: number) => {
    if (!time) return '';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className="code-execution-example">
      <div className="example-header">
        <h2>Code Execution API Examples</h2>
        <p>Demonstrates how to send code to the /api/execute endpoint and display results</p>
      </div>

      <div className="example-content">
        {/* Language Selector */}
        <div className="language-selector">
          <label htmlFor="language-select">Programming Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {supportedLanguages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Code Editor */}
        <div className="code-editor-section">
          <div className="editor-header">
            <h3>Code Editor</h3>
            <div className="editor-controls">
              <button 
                className="execute-btn basic" 
                onClick={executeCodeBasic}
                disabled={isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute Basic'}
              </button>
              <button 
                className="execute-btn authenticated" 
                onClick={executeCodeAuthenticated}
                disabled={isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute (Auth)'}
              </button>
              <button 
                className="execute-btn limits" 
                onClick={executeCodeWithLimits}
                disabled={isExecuting}
              >
                {isExecuting ? 'Executing...' : 'Execute (Limits)'}
              </button>
            </div>
          </div>
          
          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code here..."
            rows={15}
          />
        </div>

        {/* Custom Input */}
        <div className="input-section">
          <label htmlFor="custom-input">Custom Input (optional):</label>
          <textarea
            id="custom-input"
            className="custom-input"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter input data for your code..."
            rows={3}
          />
        </div>

        {/* Terminal Output */}
        {showTerminal && (
          <div className="terminal-section">
            <div className="terminal-header">
              <h3>Execution Output</h3>
              <div className="terminal-controls">
                <button className="clear-btn" onClick={clearTerminal}>
                  Clear
                </button>
                <button className="close-btn" onClick={() => setShowTerminal(false)}>
                  Close
                </button>
              </div>
            </div>
            
            <div className="terminal-content">
              {isExecuting && (
                <div className="terminal-loading">
                  <div className="loading-spinner"></div>
                  <span>Executing code...</span>
                </div>
              )}

              {terminalOutput && (
                <div className="terminal-output">
                  {/* Status and timing */}
                  <div className="execution-info">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(terminalOutput.status) }}
                    >
                      {terminalOutput.status || 'unknown'}
                    </span>
                    {terminalOutput.executionTime && (
                      <span className="execution-time">
                        Time: {formatExecutionTime(terminalOutput.executionTime)}
                      </span>
                    )}
                  </div>

                  {/* Standard Output */}
                  {terminalOutput.stdout && (
                    <div className="output-section">
                      <div className="output-label">stdout:</div>
                      <pre className="output-content stdout">{terminalOutput.stdout}</pre>
                    </div>
                  )}

                  {/* Standard Error */}
                  {terminalOutput.stderr && (
                    <div className="output-section">
                      <div className="output-label">stderr:</div>
                      <pre className="output-content stderr">{terminalOutput.stderr}</pre>
                    </div>
                  )}

                  {/* Compile Output */}
                  {terminalOutput.compile_output && (
                    <div className="output-section">
                      <div className="output-label">compile_output:</div>
                      <pre className="output-content compile">{terminalOutput.compile_output}</pre>
                    </div>
                  )}

                  {/* Error */}
                  {terminalOutput.error && (
                    <div className="output-section">
                      <div className="output-label">error:</div>
                      <pre className="output-content error">{terminalOutput.error}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution History */}
        {executionHistory.length > 0 && (
          <div className="history-section">
            <h3>Execution History</h3>
            <div className="history-list">
              {executionHistory.map((execution, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <span className="history-language">{execution.metrics?.language || 'unknown'}</span>
                    <span 
                      className="history-status"
                      style={{ backgroundColor: getStatusColor(execution.status) }}
                    >
                      {execution.status || 'unknown'}
                    </span>
                    <span className="history-time">
                      {execution.executionTime ? formatExecutionTime(execution.executionTime) : 'N/A'}
                    </span>
                  </div>
                  {execution.stdout && (
                    <div className="history-output">
                      <strong>Output:</strong> {execution.stdout.substring(0, 100)}
                      {execution.stdout.length > 100 && '...'}
                    </div>
                  )}
                  {execution.error && (
                    <div className="history-error">
                      <strong>Error:</strong> {execution.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Documentation */}
        <div className="api-docs">
          <h3>API Documentation</h3>
          <div className="api-endpoints">
            <div className="endpoint">
              <h4>POST /api/execute</h4>
              <p>Execute code with language and optional input (Public endpoint)</p>
              <pre className="request-example">
{`// Request Body
{
  "language": "javascript",
  "code": "console.log('Hello World');",
  "input": "optional input data",
  "timeout": 10000,
  "memoryLimit": "256MB"
}

// Response
{
  "success": true,
  "stdout": "Hello World\\n",
  "stderr": "",
  "status": "success",
  "executionTime": 45,
  "metrics": {
    "codeLength": 25,
    "executionDuration": 45,
    "language": "javascript"
  }
}`}
              </pre>
            </div>

            <div className="endpoint">
              <h4>POST /api/execute/secure</h4>
              <p>Execute code with authentication required</p>
              <pre className="request-example">
{`// Headers
Authorization: Bearer <jwt_token>

// Request Body (same as public endpoint)
{
  "language": "javascript",
  "code": "console.log('Hello World');",
  "input": "optional input data"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExecutionExample;

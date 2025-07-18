import React, { useState } from 'react';
import Terminal, { TerminalOutput } from './Terminal';

const TerminalDemo: React.FC = () => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const demoOutputs = [
    {
      name: 'Python Success',
      output: {
        stdout: 'Hello, World!\nWelcome to Python!\n',
        stderr: '',
        status: 'success',
        executionTime: 45
      }
    },
    {
      name: 'Python Error',
      output: {
        stdout: '',
        stderr: 'Traceback (most recent call last):\n  File "<string>", line 1, in <module>\nNameError: name \'undefined_variable\' is not defined\n',
        status: 'error',
        executionTime: 12
      }
    },
    {
      name: 'JavaScript Success',
      output: {
        stdout: 'Hello from JavaScript!\nThe result is: 42\n',
        stderr: '',
        status: 'success',
        executionTime: 23
      }
    },
    {
      name: 'JavaScript Error',
      output: {
        stdout: '',
        stderr: 'ReferenceError: undefinedVariable is not defined\n    at <anonymous>:1:1\n',
        status: 'error',
        executionTime: 8
      }
    },
    {
      name: 'Compilation Error',
      output: {
        stdout: '',
        stderr: '',
        compile_output: 'SyntaxError: invalid syntax\n  File "<string>", line 1\n    print("Hello World"\n                    ^\n',
        status: 'compilation_error',
        executionTime: 5
      }
    }
  ];

  const handleDemo = (demo: typeof demoOutputs[0]) => {
    setIsLoading(true);
    setShowTerminal(true);
    
    // Simulate loading
    setTimeout(() => {
      setTerminalOutput(demo.output);
      setIsLoading(false);
    }, 1000);
  };

  const handleClearTerminal = () => {
    setTerminalOutput(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Terminal Component Demo</h1>
      <p>Click on any demo to see the terminal in action:</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        {demoOutputs.map((demo, index) => (
          <button
            key={index}
            onClick={() => handleDemo(demo)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              background: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {demo.name}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            background: '#007acc',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
        </button>
      </div>

      <div style={{ fontSize: '14px', color: '#666' }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ Displays stdout and stderr separately with color coding</li>
          <li>✅ Shows compilation errors</li>
          <li>✅ Displays execution time</li>
          <li>✅ Auto-clears on new execution</li>
          <li>✅ Copy functionality for each output section</li>
          <li>✅ Custom input support</li>
          <li>✅ Keyboard shortcuts (Ctrl+` to toggle, Esc to close)</li>
          <li>✅ Responsive design</li>
        </ul>
      </div>

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

export default TerminalDemo; 
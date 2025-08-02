import React, { useEffect, useRef } from 'react';
import './Terminal.css';

export interface TerminalOutput {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: string;
  executionTime?: number;
  error?: string;
}

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
  output: TerminalOutput | null;
  isLoading: boolean;
  customInput: string;
  onCustomInputChange: (input: string) => void;
  onClear: () => void;
}

const Terminal: React.FC<TerminalProps> = ({
  isVisible,
  onClose,
  output,
  isLoading,
  customInput,
  onCustomInputChange,
  onClear
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, isVisible]);

  if (!isVisible) return null;

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

  const formatExecutionTime = (time?: number) => {
    if (!time) return '';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className="terminal-overlay">
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-title">
            <span className="terminal-icon">💻</span>
            Terminal Output
          </div>
          <div className="terminal-controls">
            <button className="terminal-btn clear-btn" onClick={onClear} title="Clear Output">
              🗑️ Clear
            </button>
            <button className="terminal-btn close-btn" onClick={onClose} title="Close Terminal">
              ×
            </button>
          </div>
        </div>

        <div className="terminal-content" ref={terminalRef}>
          {isLoading && (
            <div className="terminal-loading">
              <div className="loading-spinner"></div>
              <span>Executing code...</span>
            </div>
          )}

          {output && (
            <div className="terminal-output">
              {output.error && (
                <div className="output-error">
                  <span className="error-icon">❌</span>
                  <span className="error-text">{output.error}</span>
                </div>
              )}

              {output.stdout && (
                <div className="output-section">
                  <div className="output-label">stdout:</div>
                  <pre className="output-content">{output.stdout}</pre>
                </div>
              )}

              {output.stderr && (
                <div className="output-section">
                  <div className="output-label stderr">stderr:</div>
                  <pre className="output-content stderr">{output.stderr}</pre>
                </div>
              )}

              {output.compile_output && (
                <div className="output-section">
                  <div className="output-label">compile_output:</div>
                  <pre className="output-content">{output.compile_output}</pre>
                </div>
              )}

              {output.status && (
                <div className="output-status">
                  <span 
                    className="status-indicator" 
                    style={{ backgroundColor: getStatusColor(output.status) }}
                  ></span>
                  <span className="status-text">
                    Status: {output.status}
                    {output.executionTime && (
                      <span className="execution-time">
                        (Executed in {formatExecutionTime(output.executionTime)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {!output && !isLoading && (
            <div className="terminal-empty">
              <span className="empty-icon">📝</span>
              <span className="empty-text">No output yet. Run your code to see results here.</span>
            </div>
          )}
        </div>

        <div className="terminal-input-section">
          <div className="input-label">Custom Input (optional):</div>
          <textarea
            className="terminal-input"
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            placeholder="Enter custom input for your program..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal; 
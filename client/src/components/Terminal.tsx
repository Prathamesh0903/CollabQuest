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

  // Debug logging
  useEffect(() => {
    console.log('Terminal props:', { isVisible, output, isLoading });
  }, [isVisible, output, isLoading]);

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
    <div className={`terminal-panel ${isVisible ? 'visible' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 17l6-6-6-6"/>
            <path d="M12 19h8"/>
          </svg>
          <span>Terminal</span>
        </div>
        <div className="terminal-controls">
          <button className="terminal-btn clear-btn" onClick={onClear} title="Clear Output">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Clear
          </button>
          <button className="terminal-btn close-btn" onClick={onClose} title="Close Terminal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
                <span className="error-text">{output.error}</span>
              </div>
            )}

            {output.stdout && output.stdout.trim() && (
              <div className="output-section">
                <div className="output-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                  stdout
                </div>
                <pre className="output-content">{output.stdout}</pre>
              </div>
            )}

            {output.stderr && output.stderr.trim() && (
              <div className="output-section">
                <div className="output-label stderr">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                  stderr
                </div>
                <pre className="output-content stderr">{output.stderr}</pre>
              </div>
            )}

            {output.compile_output && output.compile_output.trim() && (
              <div className="output-section">
                <div className="output-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  compile_output
                </div>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            <span className="empty-text">No output yet. Run your code to see results here.</span>
          </div>
        )}
      </div>

      <div className="terminal-input-section">
        <div className="input-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Custom Input (optional)
        </div>
        <textarea
          className="terminal-input"
          value={customInput}
          onChange={(e) => onCustomInputChange(e.target.value)}
          placeholder="Enter custom input for your program..."
          rows={3}
        />
      </div>
    </div>
  );
};

export default Terminal; 
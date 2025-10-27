import React from 'react';

interface StatusBarProps {
  code: string;
  executionHistory: Array<{ timestamp?: number }>;
  showTerminal: boolean;
  onToggleTerminal: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ code, executionHistory, showTerminal, onToggleTerminal }) => {
  return (
    <div className="vscode-status-bar">
      <div className="status-left">
        <span className="status-item">
          Lines: {code.split('\n').length}
        </span>
        <span className="status-item">
          Characters: {code.length}
        </span>
        {executionHistory.length > 0 && (
          <span className="status-item">
            Last run: {new Date(executionHistory[executionHistory.length - 1]?.timestamp || 0).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="status-right">
        <button 
          className={`status-btn ${showTerminal ? 'active' : ''}`}
          onClick={onToggleTerminal}
          title="Toggle Terminal (Ctrl+`)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 17l6-6-6-6"/>
            <path d="M12 19h8"/>
          </svg>
          Terminal
        </button>
        <span className="shortcuts-hint">
          Ctrl+Enter: Run • Ctrl+`: Terminal • Ctrl+B: Sidebar • Esc: Close
        </span>
      </div>
    </div>
  );
};

export default StatusBar;




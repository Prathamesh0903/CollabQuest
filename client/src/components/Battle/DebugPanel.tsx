import React from 'react';

interface DebugPanelProps {
  isActive: boolean;
  currentLine: number | null;
  variables: Record<string, any>;
  breakpoints: Array<{ lineNumber: number; users: string[] }>;
  onStart: () => void;
  onStop: () => void;
  onStep: () => void;
  onContinue: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isActive, currentLine, variables, breakpoints, onStart, onStop, onStep, onContinue }) => {
  return (
    <div className="debug-panel">
      <div className="debug-header">
        <div className="debug-title">Debug</div>
        <div className="debug-actions">
          {!isActive ? (
            <button className="cta cta--secondary" onClick={onStart}>Start</button>
          ) : (
            <>
              <button className="cta cta--secondary" onClick={onStep}>Step</button>
              <button className="cta cta--secondary" onClick={onContinue}>Continue</button>
              <button className="cta cta--ghost" onClick={onStop}>Stop</button>
            </>
          )}
        </div>
      </div>
      <div className="debug-content">
        <div className="debug-section">
          <div className="debug-section-title">State</div>
          <div className="debug-state-line">Current line: {currentLine ?? '-'}</div>
        </div>
        <div className="debug-section">
          <div className="debug-section-title">Variables</div>
          <pre className="debug-vars">{JSON.stringify(variables || {}, null, 2)}</pre>
        </div>
        <div className="debug-section">
          <div className="debug-section-title">Breakpoints</div>
          <div className="debug-bps-list">
            {breakpoints.length === 0 ? (
              <div className="debug-empty">No breakpoints</div>
            ) : breakpoints.map(bp => (
              <div key={bp.lineNumber} className="debug-bp-item">Line {bp.lineNumber} · Users: {bp.users.length}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;


import React from 'react';
import './ResultScreen.css';

interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isPass: boolean;
  error?: string | null;
}

interface ResultScreenProps {
  result: {
    passed: number;
    total: number;
    testCaseResults: TestCaseResult[];
    accuracyScore: number;
    speedScore: number;
    totalScore: number;
    timeTaken: number | null;
  };
  onClose: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, onClose }) => {
  const {
    passed,
    total,
    testCaseResults,
    accuracyScore,
    speedScore,
    totalScore,
    timeTaken
  } = result;
  const perfect = passed === total;

  return (
    <div className="result-screen-vscode">
      {perfect && <div className="confetti">🎉</div>}
      <div className="result-header">
        <span className="result-title">Battle Results</span>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>
      <div className="score-summary">
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${accuracyScore}%` }} />
        </div>
        <div className="score-details">
          <span>Accuracy: <b>{accuracyScore}</b> / 100</span>
          <span>Speed Bonus: <b>{speedScore}</b> / 50</span>
          <span>Total Score: <b>{totalScore}</b> / 150</span>
          {timeTaken !== null && <span>Time Taken: <b>{timeTaken}s</b></span>}
        </div>
        {perfect && <span className="badge">🏅 Perfect!</span>}
      </div>
      <div className="test-cases-section">
        <div className="test-cases-title">Test Cases</div>
        <div className="test-cases-list">
          {testCaseResults.map((tc, idx) => (
            <div className={`test-case-row ${tc.isPass ? 'pass' : 'fail'}`} key={idx}>
              <div className="test-case-index">#{idx + 1}</div>
              <div className="test-case-io">
                <div><span className="label">Input:</span> <code>{tc.input}</code></div>
                <div><span className="label">Expected:</span> <code>{tc.expectedOutput}</code></div>
                <div><span className="label">Output:</span> <code>{tc.actualOutput}</code></div>
                {tc.error && <div className="error-msg">{tc.error}</div>}
              </div>
              <div className="test-case-status">{tc.isPass ? '✔️' : '❌'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultScreen; 
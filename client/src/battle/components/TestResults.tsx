import React from 'react';

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  results?: Array<{ success: boolean; output?: string; error?: string; input?: string; expected?: string }>;
  testsPassed?: number;
  totalTests?: number;
}

interface ScoreBreakdown {
  total: number;
  breakdown: { [k: string]: number };
}

interface TestResultsProps {
  executionResult?: ExecutionResult;
  score?: ScoreBreakdown;
}

export const TestResults: React.FC<TestResultsProps> = ({ executionResult, score }) => {
  if (!executionResult) return null;

  const passed = executionResult.testsPassed || 0;
  const total = executionResult.totalTests || 0;
  const allPass = executionResult.success;

  return (
    <div className="test-results">
      <div className={`summary ${allPass ? 'pass' : 'fail'}`}>
        {allPass ? 'All tests passed' : `${passed}/${total} tests passed`}
        {score && (
          <span className="score">Score: {score.total}</span>
        )}
      </div>
      {executionResult.results && (
        <div className="cases">
          {executionResult.results.map((r, idx) => (
            <div key={idx} className={`case ${r.success ? 'pass' : 'fail'}`}>
              <div className="case-header">Test #{idx + 1}: {r.success ? 'Pass' : 'Fail'}</div>
              {!r.success && (
                <div className="case-body">
                  {r.error ? (
                    <div className="error">{r.error}</div>
                  ) : (
                    <>
                      <div><strong>Input:</strong> {String(r.input)}</div>
                      <div><strong>Expected:</strong> {String(r.expected)}</div>
                      <div><strong>Output:</strong> {String(r.output)}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



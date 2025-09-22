import React, { useState, useRef } from 'react';
import { Code, Play, CheckCircle, XCircle, Loader } from 'lucide-react';
import { localCodeExecutor } from '../../../utils/localCodeExecutor';
import './EnhancedCodingQuestion.css';

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface CodingQuestionProps {
  question: string;
  codeSnippet?: string;
  language?: string;
  testCases?: TestCase[];
  answer: string;
  showExplanation: boolean;
  onAnswerChange: (answer: string) => void;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime?: number;
  testResults?: Array<{
    testCase: TestCase;
    passed: boolean;
    actualOutput: string;
  }>;
}

const EnhancedCodingQuestion: React.FC<CodingQuestionProps> = ({
  question,
  codeSnippet,
  language = 'javascript',
  testCases,
  answer,
  showExplanation,
  onAnswerChange
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  const executeCode = async () => {
    if (!answer.trim()) {
      setExecutionResult({
        output: '',
        error: 'Please write some code before executing.'
      });
      setShowOutput(true);
      return;
    }

    setIsExecuting(true);
    setShowOutput(true);

    try {
      // Use local code executor; route by language for Python support
      const { result, testResults } = await localCodeExecutor.executeCodeGeneric(language || 'javascript', answer, testCases);

      setExecutionResult({
        output: result.stdout || '',
        error: result.stderr,
        executionTime: result.executionTime,
        testResults
      });

    } catch (error) {
      setExecutionResult({
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0,
        testResults: []
      });
    } finally {
      setIsExecuting(false);
    }
  };


  const getPassedTests = () => {
    if (!executionResult?.testResults) return 0;
    return executionResult.testResults.filter(test => test.passed).length;
  };

  const getTotalTests = () => {
    return executionResult?.testResults?.length || 0;
  };

  return (
    <div className="enhanced-coding-container">
      <div className="code-editor-container">
        <div className="code-editor-header">
          <Code className="w-4 h-4" />
          <span>{language?.toUpperCase()} Code Editor</span>
          <button
            className="run-button"
            onClick={executeCode}
            disabled={isExecuting || showExplanation}
          >
            {isExecuting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isExecuting ? 'Running...' : 'Run Code'}
          </button>
        </div>
        <textarea
          ref={codeEditorRef}
          className="code-editor"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={codeSnippet || "Write your code here..."}
          disabled={showExplanation}
        />
      </div>

      {testCases && testCases.length > 0 && (
        <div className="test-cases">
          <h4>Test Cases:</h4>
          {testCases.map((testCase, index) => (
            <div key={index} className="test-case">
              <div className="test-case-header">
                <strong>Test {index + 1}:</strong> {testCase.description}
              </div>
              <div className="test-case-details">
                <div><strong>Input:</strong> <code>{testCase.input}</code></div>
                <div><strong>Expected Output:</strong> <code>{testCase.expectedOutput}</code></div>
                {executionResult?.testResults?.[index] && (
                  <div className={`test-result ${executionResult.testResults[index].passed ? 'passed' : 'failed'}`}>
                    <strong>Result:</strong> 
                    {executionResult.testResults[index].passed ? (
                      <><CheckCircle className="w-4 h-4" /> Passed</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Failed</>
                    )}
                    <div><strong>Actual Output:</strong> <code>{executionResult.testResults[index].actualOutput}</code></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showOutput && executionResult && (
        <div className="execution-output">
          <div className="output-header">
            <h4>Execution Output</h4>
            {executionResult.testResults && (
              <div className="test-summary">
                Tests: {getPassedTests()}/{getTotalTests()} passed
              </div>
            )}
          </div>
          
          {executionResult.error ? (
            <div className="error-output">
              <XCircle className="w-4 h-4" />
              <pre>{executionResult.error}</pre>
            </div>
          ) : (
            <div className="success-output">
              <CheckCircle className="w-4 h-4" />
              <pre>{executionResult.output || 'No output'}</pre>
            </div>
          )}
          
          {executionResult.executionTime && (
            <div className="execution-time">
              Execution time: {executionResult.executionTime}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCodingQuestion;

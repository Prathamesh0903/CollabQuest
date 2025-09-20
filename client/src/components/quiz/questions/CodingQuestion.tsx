import React, { useRef } from 'react';
import { Code } from 'lucide-react';
import './CodingQuestion.css';

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

const CodingQuestion: React.FC<CodingQuestionProps> = ({
  question,
  codeSnippet,
  language,
  testCases,
  answer,
  showExplanation,
  onAnswerChange
}) => {
  const codingEditorRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="coding-container">
      <div className="code-editor-container">
        <div className="code-editor-header">
          <Code className="w-4 h-4" />
          {language?.toUpperCase()} Code Editor
        </div>
        <textarea
          ref={codingEditorRef}
          className="code-editor"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your code here..."
          disabled={showExplanation}
        />
      </div>
      {testCases && (
        <div className="test-cases">
          <h4>Test Cases:</h4>
          {testCases.map((testCase, index) => (
            <div key={index} className="test-case">
              <strong>Test {index + 1}:</strong> {testCase.description}<br />
              <strong>Input:</strong> {testCase.input}<br />
              <strong>Expected Output:</strong> {testCase.expectedOutput}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodingQuestion;

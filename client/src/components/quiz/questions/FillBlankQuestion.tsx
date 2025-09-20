import React from 'react';
import './FillBlankQuestion.css';

interface FillBlankQuestionProps {
  question: string;
  correctAnswer: string;
  answer: string;
  showExplanation: boolean;
  onAnswerChange: (answer: string) => void;
}

const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({
  question,
  correctAnswer,
  answer,
  showExplanation,
  onAnswerChange
}) => {
  return (
    <div className="fill-blank-container">
      <input
        type="text"
        className="fill-blank-input"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Enter your answer..."
        disabled={showExplanation}
        aria-describedby="question-text"
      />
      {showExplanation && (
        <div className="explanation">
          <strong>Correct Answer:</strong> {correctAnswer}
        </div>
      )}
    </div>
  );
};

export default FillBlankQuestion;

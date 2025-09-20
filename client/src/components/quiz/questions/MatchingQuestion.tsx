import React from 'react';
import './MatchingQuestion.css';

interface MatchingQuestionProps {
  question: string;
  options: string[];
  correctAnswer: string[];
  answers: string[];
  showExplanation: boolean;
  onAnswerChange: (answers: string[]) => void;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  options,
  correctAnswer,
  answers,
  showExplanation,
  onAnswerChange
}) => {
  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    onAnswerChange(newAnswers);
  };

  return (
    <div className="matching-container">
      <div className="matching-pairs">
        {options.map((option, index) => (
          <div key={index} className="matching-pair">
            <span className="matching-term">{option}</span>
            <input
              type="text"
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Enter matching term..."
              className="matching-input"
              disabled={showExplanation}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchingQuestion;

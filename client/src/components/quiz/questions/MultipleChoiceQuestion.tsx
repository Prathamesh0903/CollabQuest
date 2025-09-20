import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import './MultipleChoiceQuestion.css';

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  onAnswerSelect: (answerIndex: number) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  options,
  correctAnswer,
  selectedAnswer,
  showExplanation,
  onAnswerSelect
}) => {
  return (
    <div className="multiple-choice-container">
      <div className="options-grid">
        {options.map((option, index) => (
          <motion.button
            key={index}
            className={`option-button ${selectedAnswer === index ? 'selected' : ''} ${
              showExplanation ? 
                (index === correctAnswer ? 'correct' : 
                 selectedAnswer === index ? 'incorrect' : '') : ''
            }`}
            onClick={() => !showExplanation && onAnswerSelect(index)}
            disabled={showExplanation}
            whileHover={{ scale: showExplanation ? 1 : 1.02 }}
            whileTap={{ scale: showExplanation ? 1 : 0.98 }}
            aria-describedby="question-text"
            aria-pressed={selectedAnswer === index}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="option-text">{option}</span>
            {showExplanation && index === correctAnswer && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {showExplanation && selectedAnswer === index && index !== correctAnswer && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;

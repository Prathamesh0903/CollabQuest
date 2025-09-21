import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import './MultipleChoiceQuestion.css';

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[] | Array<{
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: number;
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
  // Find the correct answer index if not provided
  const correctAnswerIndex = correctAnswer !== undefined 
    ? correctAnswer 
    : options.findIndex(option => 
        typeof option === 'object' ? option.isCorrect : false
      );

  return (
    <div className="multiple-choice-container">
      <div className="options-grid">
        {options.map((option, index) => {
          const optionText = typeof option === 'string' ? option : option.text;
          const isCorrectOption = typeof option === 'object' ? option.isCorrect : false;
          
          return (
            <motion.button
              key={index}
              className={`option-button ${selectedAnswer === index ? 'selected' : ''} ${
                showExplanation ? 
                  (index === correctAnswerIndex ? 'correct' : 
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
              <span className="option-text">{optionText}</span>
              {showExplanation && index === correctAnswerIndex && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {showExplanation && selectedAnswer === index && index !== correctAnswerIndex && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;

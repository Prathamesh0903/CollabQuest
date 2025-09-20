import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import './TrueFalseQuestion.css';

interface TrueFalseQuestionProps {
  question: string;
  correctAnswer: boolean;
  selectedAnswer: boolean | null;
  showExplanation: boolean;
  onAnswerSelect: (answer: boolean) => void;
}

const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  correctAnswer,
  selectedAnswer,
  showExplanation,
  onAnswerSelect
}) => {
  return (
    <div className="true-false-container">
      <div className="true-false-grid">
        <motion.button
          className={`true-false-button ${selectedAnswer === true ? 'selected' : ''} ${
            showExplanation ? 
              (true === correctAnswer ? 'correct' : 
               selectedAnswer === true ? 'incorrect' : '') : ''
          }`}
          onClick={() => !showExplanation && onAnswerSelect(true)}
          disabled={showExplanation}
          whileHover={{ scale: showExplanation ? 1 : 1.02 }}
          whileTap={{ scale: showExplanation ? 1 : 0.98 }}
        >
          True
          {showExplanation && true === correctAnswer && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </motion.button>
        <motion.button
          className={`true-false-button ${selectedAnswer === false ? 'selected' : ''} ${
            showExplanation ? 
              (false === correctAnswer ? 'correct' : 
               selectedAnswer === false ? 'incorrect' : '') : ''
          }`}
          onClick={() => !showExplanation && onAnswerSelect(false)}
          disabled={showExplanation}
          whileHover={{ scale: showExplanation ? 1 : 1.02 }}
          whileTap={{ scale: showExplanation ? 1 : 0.98 }}
        >
          False
          {showExplanation && false === correctAnswer && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default TrueFalseQuestion;

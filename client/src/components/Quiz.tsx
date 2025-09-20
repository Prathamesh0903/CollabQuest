import React from 'react';
import { Quiz as NewQuiz } from './quiz/index';

interface QuizProps {
  onComplete?: (score: number, totalQuestions: number) => void;
  onClose?: () => void;
  isAdvanced?: boolean;
}

const Quiz: React.FC<QuizProps> = ({ onComplete, onClose, isAdvanced = true }) => {
  return <NewQuiz onComplete={onComplete} onClose={onClose} isAdvanced={isAdvanced} />;
};

export default Quiz;
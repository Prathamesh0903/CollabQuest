import React from 'react';
import Quiz from '../components/Quiz';

const AdvancedQuizPage: React.FC = () => {
  const handleAdvancedQuizComplete = (score: number, totalQuestions: number) => {
    console.log(`Advanced quiz completed with score: ${score}/${totalQuestions}`);
  };

  return (
    <Quiz 
      isAdvanced={true}
      onComplete={handleAdvancedQuizComplete} 
      onClose={() => window.location.href = '/'} 
    />
  );
};

export default AdvancedQuizPage;




import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { QuizStats } from './types';
import './QuizResults.css';

interface QuizResultsProps {
  quizStats: QuizStats;
  timeLimit: number;
  timeLeft: number;
  isAdvanced?: boolean;
  onRetake: () => void;
  onBackToDashboard: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  quizStats,
  timeLimit,
  timeLeft,
  isAdvanced = false,
  onRetake,
  onBackToDashboard
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="quiz-results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="results-card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="results-header">
          <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="results-title">Quiz Complete!</h2>
          <p className="results-subtitle">
            {isAdvanced ? 'Great job on completing the advanced quiz' : 'Great job on completing the quiz'}
          </p>
        </div>
        
        <div className="results-stats">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">
              {quizStats.earnedPoints}/{quizStats.totalPoints}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">
              {Math.round(quizStats.accuracy)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time Used</span>
            <span className="stat-value">{formatTime(timeLimit * 60 - timeLeft)}</span>
          </div>
        </div>

        {isAdvanced && (
          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Max Streak</span>
              <span className="stat-value">{quizStats.maxStreak}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lives Left</span>
              <span className="stat-value">{quizStats.livesRemaining}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hints Used</span>
              <span className="stat-value">{quizStats.hintsUsed}</span>
            </div>
          </div>
        )}

        <div className="results-actions">
          <button 
            className="btn-primary"
            onClick={onRetake}
          >
            Retake Quiz
          </button>
          <button 
            className="btn-secondary"
            onClick={onBackToDashboard}
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizResults;

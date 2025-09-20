import React from 'react';
import { ChevronLeft, Clock, Heart, Zap, Pause, Play, Settings } from 'lucide-react';
import { QuizCategory, QuizStats } from './types';
import './QuizHeader.css';

interface QuizHeaderProps {
  selectedCategory: QuizCategory | null;
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  isPaused: boolean;
  quizStats: QuizStats;
  currentStreak: number;
  livesRemaining: number;
  onBack: () => void;
  onPause: () => void;
  onShowConfig?: () => void;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  selectedCategory,
  currentQuestion,
  totalQuestions,
  timeLeft,
  isPaused,
  quizStats,
  currentStreak,
  livesRemaining,
  onBack,
  onPause,
  onShowConfig
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="quiz-header">
      <div className="quiz-header-left">
        <button 
          className="back-button"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Categories
        </button>
        
        <div className="quiz-info">
          <h2 className="quiz-title">{selectedCategory?.title}</h2>
          <div className="quiz-meta">
            <span className="question-counter">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <div className="timer">
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            {selectedCategory && (
              <div className="difficulty-badge">
                {selectedCategory.difficulty}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="quiz-header-right">
        <div className="lives-container">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 ${i < livesRemaining ? 'text-red-500' : 'text-gray-300'}`}
              fill={i < livesRemaining ? 'currentColor' : 'none'}
            />
          ))}
        </div>

        <div className="streak-container">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>{currentStreak}</span>
        </div>

        {onShowConfig && (
          <button 
            className="config-button"
            onClick={onShowConfig}
            title="Quiz Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <button 
          className="pause-button"
          onClick={onPause}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default QuizHeader;

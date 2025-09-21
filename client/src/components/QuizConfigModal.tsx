import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Clock, BookOpen, Target, Settings, ChevronLeft, ChevronRight, Play, Lightbulb, FileText } from 'lucide-react';
import './QuizConfigModal.css';

interface QuizCategory {  
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
}

interface QuizConfig {
  timeLimit: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  enableHints: boolean;
  showExplanations: boolean;
}

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: QuizConfig) => void;
  category: QuizCategory | null;
}

const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
  isOpen,
  onClose,
  onStart,
  category
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [config, setConfig] = useState<QuizConfig>({
    timeLimit: category?.timeLimit || 20,
    questionCount: category?.questionCount || 10,
    difficulty: category?.difficulty || 'Medium',
    enableHints: true,
    showExplanations: true
  });

  // Reset config when category changes
  useEffect(() => {
    if (category) {
      setConfig({
        timeLimit: category.timeLimit,
        questionCount: category.questionCount,
        difficulty: category.difficulty,
        enableHints: true,
        showExplanations: true
      });
      setCurrentPage(1);
    }
  }, [category]);

  const handleStart = () => {
    // Navigate to the dedicated quiz page with config
    // Remove React elements from category to avoid serialization issues
    const categoryForState = {
      id: category?.id,
      title: category?.title,
      description: category?.description,
      color: category?.color,
      questionCount: category?.questionCount,
      difficulty: category?.difficulty,
      timeLimit: category?.timeLimit
    };
    
    navigate('/quiz', {
      state: {
        quizConfig: config,
        category: categoryForState,
        quizId: 'javascript-fundamentals' // Default quiz ID for now
      }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleNextPage = () => {
    if (currentPage < 2) {
      setCurrentPage(2);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  };

  const handleClose = () => {
    setCurrentPage(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && category && (
        <motion.div
          className="quiz-config-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="quiz-config-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="header-content">
                <div 
                  className="category-icon"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div className="header-text">
                  <h2 className="modal-title">{category.title}</h2>
                  <p className="modal-subtitle">{category.description}</p>
                </div>
              </div>
              <button className="close-button" onClick={handleClose}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Page Indicator */}
            <div className="page-indicator">
              <div className={`page-dot ${currentPage === 1 ? 'active' : ''}`}></div>
              <div className={`page-dot ${currentPage === 2 ? 'active' : ''}`}></div>
            </div>

            {/* Page Content */}
            <div className="page-content">
              {currentPage === 1 ? (
                /* Page 1: Basic Configuration */
                <div className="config-page">
                  <div className="section-header">
                    <Settings className="w-5 h-5" />
                    <h3>Basic Settings</h3>
                  </div>

                  {/* Number of Questions */}
                  <div className="config-item">
                    <div className="config-label">
                      <BookOpen className="w-4 h-4" />
                      <span>Number of Questions</span>
                    </div>
                    <div className="config-control">
                      <select
                        value={config.questionCount}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          questionCount: parseInt(e.target.value)
                        }))}
                        className="config-select"
                      >
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                      </select>
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div className="config-item">
                    <div className="config-label">
                      <Target className="w-4 h-4" />
                      <span>Difficulty Level</span>
                    </div>
                    <div className="difficulty-buttons">
                      {(['Easy', 'Medium', 'Hard'] as const).map((difficulty) => (
                        <button
                          key={difficulty}
                          className={`difficulty-button ${config.difficulty === difficulty ? 'active' : ''}`}
                          style={{
                            backgroundColor: config.difficulty === difficulty ? getDifficultyColor(difficulty) : 'transparent',
                            borderColor: getDifficultyColor(difficulty)
                          }}
                          onClick={() => setConfig(prev => ({ ...prev, difficulty }))}
                        >
                          {difficulty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div className="config-item">
                    <div className="config-label">
                      <Clock className="w-4 h-4" />
                      <span>Time Limit</span>
                    </div>
                    <div className="config-control">
                      <select
                        value={config.timeLimit}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          timeLimit: parseInt(e.target.value)
                        }))}
                        className="config-select"
                      >
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* Page 2: Advanced Options */
                <div className="config-page">
                  <div className="section-header">
                    <Settings className="w-5 h-5" />
                    <h3>Advanced Options</h3>
                  </div>

                  {/* Hints Option */}
                  <div className="config-item">
                    <div className="config-label">
                      <Lightbulb className="w-4 h-4" />
                      <span>Enable Hints</span>
                    </div>
                    <div className="toggle-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={config.enableHints}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            enableHints: e.target.checked
                          }))}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        {config.enableHints ? 'Hints enabled' : 'Hints disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Explanations Option */}
                  <div className="config-item">
                    <div className="config-label">
                      <FileText className="w-4 h-4" />
                      <span>Show Explanations</span>
                    </div>
                    <div className="toggle-control">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={config.showExplanations}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            showExplanations: e.target.checked
                          }))}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        {config.showExplanations ? 'Explanations enabled' : 'Explanations disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  <div className="config-summary">
                    <div className="summary-item">
                      <BookOpen className="w-4 h-4" />
                      <span>{config.questionCount} Questions</span>
                    </div>
                    <div className="summary-item">
                      <Clock className="w-4 h-4" />
                      <span>{config.timeLimit} Minutes</span>
                    </div>
                    <div className="summary-item">
                      <Target className="w-4 h-4" />
                      <span 
                        className="difficulty-text"
                        style={{ color: getDifficultyColor(config.difficulty) }}
                      >
                        {config.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="modal-actions">
              {currentPage === 1 ? (
                <>
                  <button className="cancel-button" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="quiz-config-next-btn" onClick={handleNextPage}>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button className="back-button" onClick={handlePrevPage}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button className="quiz-config-submit-btn" onClick={handleStart}>
                    <Play className="w-4 h-4" />
                    Start Quiz
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuizConfigModal;

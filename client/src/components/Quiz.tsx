import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Target, Trophy, Zap, BookOpen, Code, Brain, Star } from 'lucide-react';
import './Quiz.css';

interface QuizProps {
  onComplete?: (score: number, totalQuestions: number) => void;
  onClose?: () => void;
}

interface QuizCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // in minutes
}

const quizCategories: QuizCategory[] = [
  {
    id: 'javascript-basics',
    title: 'JavaScript Fundamentals',
    description: 'Master the basics of JavaScript programming',
    icon: <Code className="w-6 h-6" />,
    color: '#f7df1e',
    questionCount: 15,
    difficulty: 'Easy',
    timeLimit: 20
  },
  {
    id: 'python-basics',
    title: 'Python Essentials',
    description: 'Learn Python programming fundamentals',
    icon: <Code className="w-6 h-6" />,
    color: '#3776ab',
    questionCount: 15,
    difficulty: 'Easy',
    timeLimit: 20
  },
  {
    id: 'data-structures',
    title: 'Data Structures',
    description: 'Test your knowledge of arrays, linked lists, and more',
    icon: <Brain className="w-6 h-6" />,
    color: '#8b5cf6',
    questionCount: 20,
    difficulty: 'Medium',
    timeLimit: 30
  },
  {
    id: 'algorithms',
    title: 'Algorithms',
    description: 'Challenge yourself with algorithmic thinking',
    icon: <Target className="w-6 h-6" />,
    color: '#ef4444',
    questionCount: 25,
    difficulty: 'Hard',
    timeLimit: 45
  },
  {
    id: 'web-development',
    title: 'Web Development',
    description: 'HTML, CSS, and modern web technologies',
    icon: <BookOpen className="w-6 h-6" />,
    color: '#06b6d4',
    questionCount: 18,
    difficulty: 'Medium',
    timeLimit: 25
  },
  {
    id: 'system-design',
    title: 'System Design',
    description: 'Design scalable systems and architectures',
    icon: <Zap className="w-6 h-6" />,
    color: '#f59e0b',
    questionCount: 12,
    difficulty: 'Hard',
    timeLimit: 40
  }
];

const Quiz: React.FC<QuizProps> = ({ onComplete, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock questions for demonstration
  const mockQuestions = [
    {
      question: "What is the output of console.log(typeof [])?",
      options: ["array", "object", "undefined", "Array"],
      correct: 1
    },
    {
      question: "Which method is used to add an element to the end of an array?",
      options: ["push()", "pop()", "shift()", "unshift()"],
      correct: 0
    },
    {
      question: "What does 'this' keyword refer to in JavaScript?",
      options: ["The function itself", "The global object", "The object that owns the function", "The parent function"],
      correct: 2
    }
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isQuizActive) {
      handleQuizComplete();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isQuizActive]);

  const startQuiz = (category: QuizCategory) => {
    setSelectedCategory(category);
    setTimeLeft(category.timeLimit * 60);
    setIsQuizActive(true);
    setCurrentQuestion(0);
    setScore(0);
  };

  const handleAnswer = (selectedOption: number) => {
    if (mockQuestions[currentQuestion].correct === selectedOption) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < mockQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = () => {
    setIsQuizActive(false);
    setShowResults(true);
    onComplete?.(score, mockQuestions.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (showResults) {
    return (
      <motion.div 
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="quiz-results">
          <motion.div 
            className="results-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="results-header">
              <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="results-title">Quiz Complete!</h2>
              <p className="results-subtitle">Great job on completing the quiz</p>
            </div>
            
            <div className="results-stats">
              <div className="stat-item">
                <span className="stat-label">Score</span>
                <span className="stat-value">{score}/{mockQuestions.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{Math.round((score / mockQuestions.length) * 100)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Time Used</span>
                <span className="stat-value">{formatTime((selectedCategory?.timeLimit || 0) * 60 - timeLeft)}</span>
              </div>
            </div>

            <div className="results-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowResults(false);
                  setSelectedCategory(null);
                }}
              >
                Take Another Quiz
              </button>
              <button 
                className="btn-secondary"
                onClick={() => window.location.href = '/'}
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (isQuizActive && selectedCategory) {
    return (
      <motion.div 
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="quiz-header">
          <button 
            className="back-button"
            onClick={() => {
              setIsQuizActive(false);
              setSelectedCategory(null);
            }}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Categories
          </button>
          
          <div className="quiz-info">
            <h2 className="quiz-title">{selectedCategory.title}</h2>
            <div className="quiz-meta">
              <span className="question-counter">
                Question {currentQuestion + 1} of {mockQuestions.length}
              </span>
              <div className="timer">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        <div className="quiz-content">
          <motion.div 
            className="question-card"
            key={currentQuestion}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="question-text">
              {mockQuestions[currentQuestion].question}
            </h3>
            
            <div className="options-grid">
              {mockQuestions[currentQuestion].options.map((option, index) => (
                <motion.button
                  key={index}
                  className="option-button"
                  onClick={() => handleAnswer(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="quiz-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="quiz-landing">
        <div className="quiz-header-landing">
          <button 
            className="back-button"
            onClick={() => window.location.href = '/'}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="quiz-hero">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="quiz-hero-title">
                Test Your Skills
              </h1>
              <p className="quiz-hero-subtitle">
                Choose a category and challenge yourself with our interactive coding quizzes
              </p>
            </motion.div>
          </div>
        </div>

        <div className="categories-grid">
          {quizCategories.map((category, index) => (
            <motion.div
              key={category.id}
              className="category-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startQuiz(category)}
            >
              <div 
                className="category-icon"
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </div>
              
              <div className="category-content">
                <h3 className="category-title">{category.title}</h3>
                <p className="category-description">{category.description}</p>
                
                <div className="category-meta">
                  <div className="meta-item">
                    <BookOpen className="w-4 h-4" />
                    <span>{category.questionCount} questions</span>
                  </div>
                  <div className="meta-item">
                    <Clock className="w-4 h-4" />
                    <span>{category.timeLimit} min</span>
                  </div>
                  <div 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(category.difficulty) }}
                  >
                    {category.difficulty}
                  </div>
                </div>
              </div>
              
              <div className="category-arrow">
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="quiz-stats">
          <motion.div 
            className="stats-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="stat-item-large">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <h4 className="stat-title">Track Progress</h4>
                <p className="stat-description">Monitor your improvement over time</p>
              </div>
            </div>
            <div className="stat-item-large">
              <Trophy className="w-8 h-8 text-purple-500" />
              <div>
                <h4 className="stat-title">Earn Badges</h4>
                <p className="stat-description">Unlock achievements as you learn</p>
              </div>
            </div>
            <div className="stat-item-large">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <h4 className="stat-title">Personalized Learning</h4>
                <p className="stat-description">Adaptive questions based on your level</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Quiz;

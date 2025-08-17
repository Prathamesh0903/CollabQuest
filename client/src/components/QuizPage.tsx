import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Clock, Target, CheckCircle, XCircle, 
  BookOpen, Timer, ArrowRight, Home
} from 'lucide-react';
import './QuizPage.css';

interface QuizCategory {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
}

interface QuizConfig {
  timeLimit: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

interface UserAnswer {
  questionId: string;
  answer: string | number | boolean;
  timeSpent: number;
  isCorrect: boolean;
  points: number;
}

// Sample questions for demonstration
const sampleQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'What is the time complexity of binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 1,
    explanation: 'Binary search has a time complexity of O(log n) as it divides the search space in half with each iteration.',
    points: 10,
    timeLimit: 30,
    difficulty: 'medium',
    tags: ['algorithms', 'search', 'complexity']
  },
  {
    id: 'q2',
    type: 'multiple-choice',
    question: 'Which data structure uses LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Stack', 'Tree', 'Graph'],
    correctAnswer: 1,
    explanation: 'A Stack uses the LIFO principle where the last element added is the first one to be removed.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['data-structures', 'stack']
  },
  {
    id: 'q3',
    type: 'true-false',
    question: 'A binary tree can have more than two children per node.',
    options: ['True', 'False'],
    correctAnswer: false,
    explanation: 'A binary tree can have at most two children per node. If it can have more than two children, it\'s called a general tree.',
    points: 10,
    timeLimit: 30,
    difficulty: 'easy',
    tags: ['data-structures', 'trees']
  },
  {
    id: 'q4',
    type: 'multiple-choice',
    question: 'What is the space complexity of merge sort?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'Merge sort requires O(n) additional space to store the merged arrays during the sorting process.',
    points: 10,
    timeLimit: 30,
    difficulty: 'medium',
    tags: ['algorithms', 'sorting', 'complexity']
  },
  {
    id: 'q5',
    type: 'fill-blank',
    question: 'The process of converting a recursive algorithm to an iterative one is called _____ optimization.',
    options: ['Tail recursion', 'Memoization', 'Dynamic programming', 'Greedy'],
    correctAnswer: 0,
    explanation: 'Tail recursion optimization converts recursive calls to iterative loops to improve space efficiency.',
    points: 10,
    timeLimit: 30,
    difficulty: 'hard',
    tags: ['algorithms', 'optimization', 'recursion']
  }
];

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get quiz config from location state
  const quizConfig = location.state?.quizConfig as QuizConfig;
  const category = location.state?.category as QuizCategory;

  useEffect(() => {
    if (!quizConfig || !category) {
      navigate('/advanced-quiz');
      return;
    }

    setTimeLeft(quizConfig.timeLimit * 60);
    setTotalQuestions(quizConfig.questionCount);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleQuizComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizConfig, category, navigate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const currentQ = sampleQuestions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    const points = isCorrect ? currentQ.points : 0;

    const userAnswer: UserAnswer = {
      questionId: currentQ.id,
      answer: selectedAnswer,
      timeSpent: (quizConfig.timeLimit * 60) - timeLeft,
      isCorrect,
      points
    };

    setUserAnswers(prev => [...prev, userAnswer]);
    setScore(prev => prev + points);

    setShowExplanation(true);
    
    setTimeout(() => {
      setShowExplanation(false);
      setSelectedAnswer(null);
      
      if (currentQuestion + 1 < Math.min(quizConfig.questionCount, sampleQuestions.length)) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleQuizComplete();
      }
    }, 2000);
  };

  const handleQuizComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsQuizComplete(true);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (!quizConfig || !category) {
    return null;
  }

  if (isQuizComplete) {
    return (
      <div className="quiz-page">
        <div className="quiz-navbar">
          <div className="navbar-content">
            <button className="nav-button" onClick={handleGoHome}>
              <Home className="w-4 h-4" />
              Home
            </button>
            <div className="quiz-title">Quiz Complete</div>
          </div>
        </div>
        
        <div className="quiz-content">
          <motion.div 
            className="completion-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="completion-header">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2>Quiz Completed!</h2>
            </div>
            
            <div className="completion-stats">
              <div className="stat-item">
                <span className="stat-label">Score</span>
                <span className="stat-value">{score}/{totalQuestions * 10}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{Math.round((score / (totalQuestions * 10)) * 100)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Questions</span>
                <span className="stat-value">{totalQuestions}</span>
              </div>
            </div>
            
            <button className="home-button" onClick={handleGoHome}>
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQ = sampleQuestions[currentQuestion % sampleQuestions.length];

  return (
    <div className="quiz-page">
      {/* Small Height Navbar */}
      <div className="quiz-navbar">
        <div className="navbar-content">
          <button className="nav-button" onClick={() => navigate('/advanced-quiz')}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="quiz-info">
            <div className="quiz-title">{category.title}</div>
            <div className="quiz-progress">
              Question {currentQuestion + 1} of {totalQuestions}
            </div>
          </div>
          
          <div className="quiz-meta">
            <div className="timer">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(quizConfig.difficulty) }}
            >
              {quizConfig.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content - No Scrolling */}
      <div className="quiz-content">
        <motion.div 
          className="question-card"
          key={currentQuestion}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="question-header">
            <div className="question-number">Question {currentQuestion + 1}</div>
            <div className="question-type">{currentQ.type.replace('-', ' ').toUpperCase()}</div>
          </div>
          
          <div className="question-text">
            {currentQ.question}
          </div>
          
          <div className="answer-options">
            {currentQ.options?.map((option, index) => (
              <motion.button
                key={index}
                className={`answer-option ${selectedAnswer === index ? 'selected' : ''} ${
                  showExplanation ? 
                    (index === currentQ.correctAnswer ? 'correct' : 
                     selectedAnswer === index ? 'incorrect' : '') : ''
                }`}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
                disabled={showExplanation}
                whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                whileTap={{ scale: showExplanation ? 1 : 0.98 }}
              >
                <div className="option-content">
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </div>
                {showExplanation && index === currentQ.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {showExplanation && selectedAnswer === index && index !== currentQ.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </motion.button>
            ))}
          </div>
          
          {showExplanation && (
            <motion.div 
              className="explanation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="explanation-text">
                {currentQ.explanation}
              </div>
            </motion.div>
          )}
          
          {selectedAnswer !== null && !showExplanation && (
            <motion.button
              className="next-button"
              onClick={handleNextQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuizPage;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, Clock, Target, CheckCircle, XCircle, 
  BookOpen, ArrowRight, Home, Brain, Zap,
  Award, TrendingUp, Star, Eye, EyeOff, HelpCircle
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
  enableHints?: boolean;
  showExplanations?: boolean;
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
  hint?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string | number | boolean;
  timeSpent: number;
  isCorrect: boolean;
  points: number;
}

// Enhanced sample questions with hints
const sampleQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'What is the time complexity of binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 1,
    explanation: 'Binary search has a time complexity of O(log n) as it divides the search space in half with each iteration.',
    hint: 'Think about how binary search works - it eliminates half of the remaining elements in each step.',
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
    hint: 'Think of a stack of plates - you can only add or remove from the top.',
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
    hint: 'The word "binary" gives us a clue about the number of children allowed.',
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
    hint: 'Merge sort creates temporary arrays to store the merged results.',
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
    hint: 'This optimization is specifically about the last operation in a recursive function.',
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
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
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
    setQuestionStartTime(Date.now());
    
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

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setSelectedAnswer(null);
  }, [currentQuestion]);

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

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowHint(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const currentQ = sampleQuestions[currentQuestion % sampleQuestions.length];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    const points = isCorrect ? currentQ.points : 0;
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    const userAnswer: UserAnswer = {
      questionId: currentQ.id,
      answer: selectedAnswer,
      timeSpent,
      isCorrect,
      points
    };

    setUserAnswers(prev => [...prev, userAnswer]);
    setScore(prev => prev + points);

    // Update streak
    if (isCorrect) {
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(prevMax => Math.max(prevMax, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    setShowExplanation(true);
    
    setTimeout(() => {
      setShowExplanation(false);
      setSelectedAnswer(null);
      
      if (currentQuestion + 1 < Math.min(quizConfig.questionCount, sampleQuestions.length)) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleQuizComplete();
      }
    }, 3000);
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

  const handleShowHint = () => {
    if (!showHint && quizConfig.enableHints) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
    }
  };



  if (!quizConfig || !category) {
    return null;
  }

  if (isQuizComplete) {
    const accuracy = Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100);
    const totalPossibleScore = totalQuestions * 10;
    const scorePercentage = Math.round((score / totalPossibleScore) * 100);
    
    return (
      <div className="quiz-complete-page">
        
        <div className="completion-container">
          <div className="completion-header">
            <div className="completion-icon">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="completion-title">Quiz Complete!</h1>
            <p className="completion-subtitle">Great job completing the {category.title} quiz</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <Target className="w-5 h-5" />
              </div>
              <div className="stat-value">{score}/{totalPossibleScore}</div>
              <div className="stat-label">Final Score</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="stat-value">{accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Zap className="w-5 h-5" />
              </div>
              <div className="stat-value">{maxStreak}</div>
              <div className="stat-label">Best Streak</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="stat-value">{hintsUsed}</div>
              <div className="stat-label">Hints Used</div>
            </div>
          </div>

          <div className="completion-actions">
            <button 
              className="home-btn"
              onClick={handleGoHome}
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = sampleQuestions[currentQuestion % sampleQuestions.length];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="quiz-page">
      {/* Small Header with Timer */}
      <div className="quiz-header-small">
        <button className="exit-quiz-btn" onClick={() => navigate('/advanced-quiz')}>
          <ChevronLeft className="w-4 h-4" />
          Exit Quiz
        </button>
        <h1 className="quiz-title-small">{category.title}</h1>
        <div className="timer-display">
          <Clock className="timer-icon" />
          <span className="timer-text">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Quiz Content */}
      <div className="quiz-main">
        <div className="question-container">
          {/* Question Header */}
          <div className="question-header">
            <div className="question-meta">
              <span className="question-number">Question {currentQuestion + 1}</span>
              <span className="question-type">{currentQ.type.replace('-', ' ').toUpperCase()}</span>
            </div>
            <div className="question-points">{currentQ.points} pts</div>
          </div>

          {/* Question Text */}
          <div className="question-text">
            {currentQ.question}
          </div>

          {/* Answer Options */}
          <div className="answer-grid">
            {currentQ.options?.map((option, index) => (
              <button
                key={index}
                className={`answer-card ${selectedAnswer === index ? 'selected' : ''} ${
                  showExplanation ? 
                    (index === currentQ.correctAnswer ? 'correct' : 
                     selectedAnswer === index ? 'incorrect' : '') : ''
                }`}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
                disabled={showExplanation}
              >
                <div className="answer-content">
                  <div className="answer-letter">{String.fromCharCode(65 + index)}</div>
                  <div className="answer-text">{option}</div>
                </div>
                {showExplanation && index === currentQ.correctAnswer && (
                  <CheckCircle className="w-6 h-6 answer-icon correct" />
                )}
                {showExplanation && selectedAnswer === index && index !== currentQ.correctAnswer && (
                  <XCircle className="w-6 h-6 answer-icon incorrect" />
                )}
              </button>
            ))}
          </div>

          {/* Hint Section */}
          {quizConfig.enableHints && currentQ.hint && showHint && (
            <div className="hint-section">
              <div className="hint-content">
                <Brain className="w-5 h-5" />
                <span>{currentQ.hint}</span>
              </div>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && currentQ.explanation && (
            <div className="explanation-section">
              <div className="explanation-header">
                <Eye className="w-5 h-5" />
                <span>Explanation</span>
              </div>
              <div className="explanation-text">{currentQ.explanation}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {!showExplanation && (
              <>
                {currentQuestion > 0 && (
                  <button className="back-btn" onClick={handlePreviousQuestion}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
                
                {quizConfig.enableHints && currentQ.hint && !showHint && (
                  <button className="hint-btn" onClick={handleShowHint}>
                    <HelpCircle className="w-4 h-4" />
                    Show Hint
                  </button>
                )}
              </>
            )}

            {selectedAnswer !== null && !showExplanation && (
              <button
                className="next-btn"
                onClick={handleNextQuestion}
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
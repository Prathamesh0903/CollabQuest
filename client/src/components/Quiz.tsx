import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Clock, Target, Trophy, Zap, BookOpen, Code, Brain, Star,
  CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, BarChart3,
  Users, TrendingUp, Lightbulb, Shield, Crown, Heart, Timer, Settings,
  Volume2, VolumeX, Eye, EyeOff, Lock, Unlock, Award, Target as TargetIcon
} from 'lucide-react';
import './Quiz.css';
import QuizConfigModal from './QuizConfigModal';

interface QuizProps {
  onComplete?: (score: number, totalQuestions: number) => void;
  onClose?: () => void;
  isAdvanced?: boolean;
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



// Quiz Configuration Interface
interface QuizConfig {
  timeLimit: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// Advanced quiz interfaces
interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'coding' | 'matching' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number | string[] | boolean;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  codeSnippet?: string;
  language?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

interface UserAnswer {
  questionId: string;
  answer: string | number | string[] | boolean;
  timeSpent: number;
  isCorrect: boolean;
  points: number;
}

interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  accuracy: number;
  averageTime: number;
  timeRemaining: number;
  streak: number;
  maxStreak: number;
  difficulty: string;
  hintsUsed: number;
  livesRemaining: number;
}

// Default Quiz Configuration
const defaultQuizConfig: QuizConfig = {
  timeLimit: 20,
  questionCount: 10,
  difficulty: 'Medium'
};

// Dynamic Quiz Container Component
const DynamicQuizContainer: React.FC<{
  questions: Question[];
  timeLimit: number;
  onComplete: (score: number, totalQuestions: number, answers: UserAnswer[]) => void;
  onClose: () => void;
}> = ({ questions, timeLimit, onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // User answers and stats
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuestions: questions.length,
    correctAnswers: 0,
    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
    earnedPoints: 0,
    accuracy: 0,
    averageTime: 0,
    timeRemaining: timeLimit * 60,
    streak: 0,
    maxStreak: 0,
    difficulty: 'medium',
    hintsUsed: 0,
    livesRemaining: 3
  });
  
  // Current question state
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [matchingAnswers, setMatchingAnswers] = useState<string[]>([]);
  const [codingAnswer, setCodingAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Power-ups and lives
  const [powerUps, setPowerUps] = useState({
    skipQuestion: 1,
    timeFreeze: 1,
    fiftyFifty: 2,
    hint: 3
  });
  
  const [currentStreak, setCurrentStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  // Refs
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const codingEditorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize quiz
  useEffect(() => {
    if (questions.length > 0) {
      setIsQuizActive(true);
      setQuestionStartTime(Date.now());
    }
  }, [questions]);

  // Timer management
  useEffect(() => {
    if (isQuizActive && !isPaused && timeLeft > 0) {
      sessionTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isQuizActive, isPaused, timeLeft]);

  const handleTimeUp = () => {
    setIsQuizActive(false);
    calculateResults();
    setShowResults(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePowerUp = (type: keyof typeof powerUps) => {
    if (powerUps[type] <= 0) return;

    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

    switch (type) {
      case 'skipQuestion':
        handleNextQuestion();
        break;
      case 'timeFreeze':
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 10000); // 10 seconds
        break;
      case 'fiftyFifty':
        // Eliminate two wrong options for multiple choice
        break;
      case 'hint':
        setQuizStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
        break;
    }
  };

  const handleSubmitAnswer = () => {
    const currentQ = questions[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    
    let answer: any;
    let isCorrect = false;
    
    switch (currentQ.type) {
      case 'multiple-choice':
        answer = selectedAnswer;
        isCorrect = answer === currentQ.correctAnswer;
        break;
      case 'true-false':
        answer = selectedAnswer;
        isCorrect = answer === currentQ.correctAnswer;
        break;
      case 'fill-blank':
        answer = fillBlankAnswer;
        isCorrect = answer.toLowerCase().trim() === (currentQ.correctAnswer as string).toLowerCase().trim();
        break;
      case 'coding':
        answer = codingAnswer;
        isCorrect = false; // Placeholder
        break;
      case 'matching':
        answer = matchingAnswers;
        isCorrect = false; // Placeholder for matching logic
        break;
      default:
        answer = null;
        isCorrect = false;
    }

    const userAnswer: UserAnswer = {
      questionId: currentQ.id,
      answer,
      timeSpent,
      isCorrect,
      points: isCorrect ? currentQ.points : 0
    };

    setUserAnswers(prev => [...prev, userAnswer]);
    
    // Update streak
    if (isCorrect) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setQuizStats(prev => ({
        ...prev,
        maxStreak: Math.max(prev.maxStreak, newStreak)
      }));
    } else {
      setCurrentStreak(0);
      setQuizStats(prev => ({
        ...prev,
        livesRemaining: prev.livesRemaining - 1
      }));
    }

    // Show explanation briefly
    setShowExplanation(true);
    setTimeout(() => {
      setShowExplanation(false);
      handleNextQuestion();
    }, 3000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setFillBlankAnswer('');
      setMatchingAnswers([]);
      setCodingAnswer('');
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      // Quiz completed
      setIsQuizActive(false);
      calculateResults();
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
    const earnedPoints = userAnswers.reduce((sum, a) => sum + a.points, 0);
    const totalTime = userAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
    const averageTime = userAnswers.length > 0 ? totalTime / userAnswers.length : 0;
    const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;

    setQuizStats(prev => ({
      ...prev,
      correctAnswers,
      earnedPoints,
      accuracy,
      averageTime,
      timeRemaining: timeLeft
    }));

    onComplete(earnedPoints, questions.length, userAnswers);
  };

  const renderQuestionContent = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;

    switch (currentQ.type) {
      case 'multiple-choice':
        return (
          <div className="options-grid">
            {currentQ.options?.map((option, index) => (
              <motion.button
                key={index}
                className={`option-button ${selectedAnswer === index ? 'selected' : ''} ${
                  showExplanation ? 
                    (index === currentQ.correctAnswer ? 'correct' : 
                     selectedAnswer === index ? 'incorrect' : '') : ''
                }`}
                onClick={() => !showExplanation && setSelectedAnswer(index)}
                disabled={showExplanation}
                whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                whileTap={{ scale: showExplanation ? 1 : 0.98 }}
                aria-describedby="question-text"
                aria-pressed={selectedAnswer === index}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {showExplanation && index === currentQ.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {showExplanation && selectedAnswer === index && index !== currentQ.correctAnswer && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </motion.button>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="true-false-grid">
            <motion.button
              className={`true-false-button ${selectedAnswer === true ? 'selected' : ''} ${
                showExplanation ? 
                  (true === currentQ.correctAnswer ? 'correct' : 
                   selectedAnswer === true ? 'incorrect' : '') : ''
              }`}
              onClick={() => !showExplanation && setSelectedAnswer(true)}
              disabled={showExplanation}
              whileHover={{ scale: showExplanation ? 1 : 1.02 }}
              whileTap={{ scale: showExplanation ? 1 : 0.98 }}
            >
              True
              {showExplanation && true === currentQ.correctAnswer && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </motion.button>
            <motion.button
              className={`true-false-button ${selectedAnswer === false ? 'selected' : ''} ${
                showExplanation ? 
                  (false === currentQ.correctAnswer ? 'correct' : 
                   selectedAnswer === false ? 'incorrect' : '') : ''
              }`}
              onClick={() => !showExplanation && setSelectedAnswer(false)}
              disabled={showExplanation}
              whileHover={{ scale: showExplanation ? 1 : 1.02 }}
              whileTap={{ scale: showExplanation ? 1 : 0.98 }}
            >
              False
              {showExplanation && false === currentQ.correctAnswer && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </motion.button>
          </div>
        );

      case 'fill-blank':
        return (
          <div className="fill-blank-container">
            <input
              type="text"
              className="fill-blank-input"
              value={fillBlankAnswer}
              onChange={(e) => setFillBlankAnswer(e.target.value)}
              placeholder="Enter your answer..."
              disabled={showExplanation}
              aria-describedby="question-text"
            />
            {showExplanation && (
              <div className="explanation">
                <strong>Correct Answer:</strong> {currentQ.correctAnswer}
              </div>
            )}
          </div>
        );

      case 'coding':
        return (
          <div className="coding-container">
            <div className="code-editor-container">
              <div className="code-editor-header">
                <Code className="w-4 h-4" />
                {currentQ.language?.toUpperCase()} Code Editor
              </div>
              <textarea
                ref={codingEditorRef}
                className="code-editor"
                value={codingAnswer}
                onChange={(e) => setCodingAnswer(e.target.value)}
                placeholder="Write your code here..."
                disabled={showExplanation}
              />
            </div>
            {currentQ.testCases && (
              <div className="test-cases">
                <h4>Test Cases:</h4>
                {currentQ.testCases.map((testCase, index) => (
                  <div key={index} className="test-case">
                    <strong>Test {index + 1}:</strong> {testCase.description}<br />
                    <strong>Input:</strong> {testCase.input}<br />
                    <strong>Expected Output:</strong> {testCase.expectedOutput}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'matching':
        return (
          <div className="matching-container">
            <div className="matching-pairs">
              {currentQ.options?.map((option, index) => (
                <div key={index} className="matching-pair">
                  <span className="matching-term">{option}</span>
                  <input
                    type="text"
                    value={matchingAnswers[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...matchingAnswers];
                      newAnswers[index] = e.target.value;
                      setMatchingAnswers(newAnswers);
                    }}
                    placeholder="Enter matching term..."
                    className="matching-input"
                    disabled={showExplanation}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div className="error">Unsupported question type</div>;
    }
  };

  const canSubmit = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return false;

    switch (currentQ.type) {
      case 'multiple-choice':
      case 'true-false':
        return selectedAnswer !== null;
      case 'fill-blank':
        return fillBlankAnswer.trim() !== '';
      case 'coding':
        return codingAnswer.trim() !== '';
      case 'matching':
        return matchingAnswers.some(a => a.trim() !== '');
      default:
        return false;
    }
  };

  if (showResults) {
    return (
      <motion.div 
        className="advanced-quiz-container"
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
              <p className="results-subtitle">Great job on completing the advanced quiz</p>
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

            <div className="results-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers([]);
                  setTimeLeft(timeLimit * 60);
                  setIsQuizActive(true);
                  setQuizStats(prev => ({
                    ...prev,
                    correctAnswers: 0,
                    earnedPoints: 0,
                    accuracy: 0,
                    streak: 0,
                    maxStreak: 0,
                    hintsUsed: 0,
                    livesRemaining: 3
                  }));
                }}
              >
                Retake Quiz
              </button>
              <button 
                className="btn-secondary"
                onClick={onClose}
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!isQuizActive) {
    return (
      <motion.div 
        className="advanced-quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="quiz-start">
          <motion.div 
            className="start-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="start-header">
              <Brain className="w-16 h-16 text-blue-500 mb-4" />
              <h2 className="start-title">Advanced Quiz</h2>
              <p className="start-subtitle">Test your knowledge with advanced questions</p>
            </div>
            
            <div className="quiz-info">
              <div className="info-item">
                <BookOpen className="w-5 h-5" />
                <span>{questions.length} Questions</span>
              </div>
              <div className="info-item">
                <Clock className="w-5 h-5" />
                <span>{timeLimit} Minutes</span>
              </div>
              <div className="info-item">
                <Target className="w-5 h-5" />
                <span>{quizStats.totalPoints} Total Points</span>
              </div>
            </div>

            <div className="start-actions">
              <button 
                className="btn-primary"
                onClick={() => setIsQuizActive(true)}
              >
                Start Quiz
              </button>
              <button 
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <motion.div 
      className="advanced-quiz-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="quiz-header">
        <div className="quiz-header-left">
          <button 
            className="back-button"
            onClick={onClose}
          >
            <ChevronLeft className="w-5 h-5" />
            Exit Quiz
          </button>
          
          <div className="quiz-info">
            <h2 className="quiz-title">Advanced Quiz</h2>
            <div className="quiz-meta">
              <span className="question-counter">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="timer">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
              <div className="difficulty-badge">
                {currentQ.difficulty}
              </div>
            </div>
          </div>
        </div>

        <div className="quiz-header-right">
          <div className="lives-container">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${i < quizStats.livesRemaining ? 'text-red-500' : 'text-gray-300'}`}
                fill={i < quizStats.livesRemaining ? 'currentColor' : 'none'}
              />
            ))}
          </div>

          <div className="streak-container">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span>{currentStreak}</span>
          </div>

          <button 
            className="pause-button"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="quiz-content">
        <div className="power-ups-container">
          {Object.entries(powerUps).map(([type, count]) => (
            <button
              key={type}
              className={`power-up-btn ${count > 0 ? 'available' : 'disabled'}`}
              onClick={() => handlePowerUp(type as keyof typeof powerUps)}
              disabled={count <= 0}
              title={`${type.replace(/([A-Z])/g, ' $1').toLowerCase()} (${count} left)`}
            >
              {type === 'skipQuestion' && <Zap className="w-4 h-4" />}
              {type === 'timeFreeze' && <Pause className="w-4 h-4" />}
              {type === 'fiftyFifty' && <Target className="w-4 h-4" />}
              {type === 'hint' && <Lightbulb className="w-4 h-4" />}
              <span className="power-up-count">{count}</span>
            </button>
          ))}
        </div>

        <motion.div 
          className="question-card"
          key={currentQuestionIndex}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="question-header">
            <span className="question-number">Question {currentQuestionIndex + 1}</span>
            <span className="question-type">{currentQ.type.replace('-', ' ').toUpperCase()}</span>
          </div>
          
          <div className="question-text" id="question-text">
            {currentQ.question}
          </div>
          
          {renderQuestionContent()}
          
          {currentQ.explanation && showExplanation && (
            <div className="explanation">
              <h4>Explanation:</h4>
              <p>{currentQ.explanation}</p>
            </div>
          )}
          
          <div className="question-actions">
            <button 
              className="btn-submit"
              onClick={handleSubmitAnswer}
              disabled={!canSubmit() || showExplanation}
            >
              {showExplanation ? 'Next Question' : 'Submit Answer'}
            </button>
            
            {powerUps.hint > 0 && (
              <button 
                className="btn-hint"
                onClick={() => handlePowerUp('hint')}
                disabled={showExplanation}
              >
                <Lightbulb className="w-4 h-4" />
                Hint ({powerUps.hint})
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Advanced questions for advanced mode
const advancedQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'What is the output of the following code?\n\n```javascript\nconst arr = [1, 2, 3];\nconst [a, ...rest] = arr;\nconsole.log(rest);\n```',
    options: ['[1, 2, 3]', '[2, 3]', '[1]', 'undefined'],
    correctAnswer: 1,
    explanation: 'The rest operator (...) collects the remaining elements into an array. Since a = 1, rest becomes [2, 3].',
    points: 10,
    timeLimit: 30,
    difficulty: 'medium',
    tags: ['javascript', 'destructuring', 'rest-operator']
  },
  {
    id: 'q2',
    type: 'coding',
    question: 'Implement a function that reverses a string without using the built-in reverse() method.',
    codeSnippet: 'function reverseString(str) {\n  // Your code here\n}',
    language: 'javascript',
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', description: 'Basic string reversal' },
      { input: '"world"', expectedOutput: '"dlrow"', description: 'Another basic case' },
      { input: '""', expectedOutput: '""', description: 'Empty string' }
    ],
    points: 15,
    timeLimit: 120,
    difficulty: 'medium',
    tags: ['javascript', 'algorithms', 'strings']
  },
  {
    id: 'q3',
    type: 'true-false',
    question: 'In JavaScript, all objects are passed by reference.',
    correctAnswer: true,
    explanation: 'In JavaScript, objects (including arrays and functions) are passed by reference, while primitives are passed by value.',
    points: 5,
    timeLimit: 20,
    difficulty: 'easy',
    tags: ['javascript', 'objects', 'references']
  },
  {
    id: 'q4',
    type: 'fill-blank',
    question: 'The _____ keyword is used to declare a variable that cannot be reassigned.',
    correctAnswer: 'const',
    explanation: 'const is used to declare constants that cannot be reassigned after initialization.',
    points: 5,
    timeLimit: 15,
    difficulty: 'easy',
    tags: ['javascript', 'variables', 'const']
  },
  {
    id: 'q5',
    type: 'matching',
    question: 'Match each JavaScript method with its purpose:',
    options: ['map()', 'filter()', 'reduce()', 'forEach()'],
    correctAnswer: ['Transform each element', 'Select elements', 'Accumulate values', 'Execute for each element'],
    explanation: 'These are fundamental array methods in JavaScript with distinct purposes.',
    points: 12,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['javascript', 'arrays', 'methods']
  }
];

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

const Quiz: React.FC<QuizProps> = ({ onComplete, onClose, isAdvanced = true }) => {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCategoryForConfig, setSelectedCategoryForConfig] = useState<QuizCategory | null>(null);
  
  // Quiz Configuration
  const [quizConfig, setQuizConfig] = useState<QuizConfig>(defaultQuizConfig);
  
  // Advanced quiz states
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    totalPoints: 0,
    earnedPoints: 0,
    accuracy: 0,
    averageTime: 0,
    timeRemaining: 0,
    streak: 0,
    maxStreak: 0,
    difficulty: 'medium',
    hintsUsed: 0,
    livesRemaining: 3
  });
  const [isPaused, setIsPaused] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [livesRemaining, setLivesRemaining] = useState(3);
  const [powerUps, setPowerUps] = useState({
    skipQuestion: 1,
    timeFreeze: 1,
    fiftyFifty: 2,
    hint: 3
  });
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [matchingAnswers, setMatchingAnswers] = useState<string[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);

  // Refs
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && timeLeft > 0 && !isPaused) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isQuizActive) {
      handleQuizComplete();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isQuizActive, isPaused]);

  const startQuiz = (category: QuizCategory) => {
    setSelectedCategoryForConfig(category);
    setShowConfigModal(true);
  };

  const startQuizWithConfig = (config: QuizConfig) => {
    if (!selectedCategoryForConfig) return;
    
    setQuizConfig(config);
    setSelectedCategory(selectedCategoryForConfig);
    setTimeLeft(config.timeLimit * 60);
    setIsQuizActive(true);
    setCurrentQuestion(0);
    setScore(0);
    setShowConfigModal(false);
    
    if (isAdvanced) {
      setQuizStats(prev => ({
        ...prev,
        totalQuestions: advancedQuestions.length,
        totalPoints: advancedQuestions.reduce((sum, q) => sum + q.points, 0),
        timeRemaining: config.timeLimit * 60
      }));
      setUserAnswers([]);
      setCurrentStreak(0);
      setHintsUsed(0);
              setLivesRemaining(3);
      setPowerUps({
          skipQuestion: 1,
          timeFreeze: 1,
          fiftyFifty: 2,
          hint: 3
      });
      setAnsweredQuestions([]);
    }
  };

  const handleAnswer = (selectedOption: number) => {
    handleAdvancedAnswer(selectedOption);
  };

  const handleAdvancedAnswer = (answer: string | number | string[] | boolean) => {
    console.log('handleAdvancedAnswer called with:', answer);
    if (!selectedCategory) return;

    const currentQ = advancedQuestions[currentQuestion];
    const isCorrect = checkAnswer(currentQ, answer);
    const points = isCorrect ? currentQ.points : 0;

    const userAnswer: UserAnswer = {
      questionId: currentQ.id,
      answer,
      timeSpent: (selectedCategory.timeLimit * 60) - timeLeft,
      isCorrect,
      points
    };

    setUserAnswers(prev => [...prev, userAnswer]);
    setAnsweredQuestions(prev => [...prev, currentQ.id]);

    // Update stats
    setQuizStats(prev => {
      const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
      const newEarnedPoints = prev.earnedPoints + points;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, newStreak);
      
      return {
        ...prev,
        correctAnswers: newCorrectAnswers,
        earnedPoints: newEarnedPoints,
        accuracy: (newCorrectAnswers / (prev.totalQuestions)) * 100,
        streak: newStreak,
        maxStreak: newMaxStreak
      };
    });

    // Handle streak and lives
    if (isCorrect) {
      setCurrentStreak(prev => prev + 1);
    } else {
      setCurrentStreak(0);
      if (livesRemaining > 0) {
        setLivesRemaining(prev => prev - 1);
      }
    }

    // Show explanation
      setShowExplanation(true);
      setTimeout(() => setShowExplanation(false), 3000);

        // Move to next question or complete quiz
    if (currentQuestion + 1 < advancedQuestions.length) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFillBlankAnswer('');
      setMatchingAnswers([]);
    } else {
      handleQuizComplete();
    }
  };

  const checkAnswer = (question: Question, answer: string | number | string[] | boolean): boolean => {
    switch (question.type) {
      case 'multiple-choice':
        return answer === question.correctAnswer;
      case 'true-false':
        return answer === question.correctAnswer;
      case 'fill-blank':
        return answer.toString().toLowerCase() === question.correctAnswer?.toString().toLowerCase();
      case 'matching':
        return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
      case 'coding':
        return true; // Placeholder
      default:
        return false;
    }
  };

  const handleQuizComplete = () => {
    setIsQuizActive(false);
    setShowResults(true);
    onComplete?.(quizStats.earnedPoints, quizStats.totalQuestions);
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

  const handlePowerUp = (type: keyof typeof powerUps) => {
    if (powerUps[type] <= 0) return;

    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

    switch (type) {
      case 'skipQuestion':
        if (currentQuestion + 1 < advancedQuestions.length) {
          setCurrentQuestion(prev => prev + 1);
        }
        break;
      case 'timeFreeze':
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 10000); // 10 seconds
        break;
      case 'fiftyFifty':
        // In real app, this would eliminate two wrong options
        break;
      case 'hint':
        setHintsUsed(prev => prev + 1);
        break;
    }
  };





  const renderFloatingElements = () => {
    return (
      <div className="floating-elements">
        <div className="floating-element">
          <Code className="w-8 h-8 text-blue-400" />
        </div>
        <div className="floating-element">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <div className="floating-element">
          <Target className="w-7 h-7 text-green-400" />
        </div>
        <div className="floating-element">
          <BookOpen className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="floating-element">
          <Zap className="w-8 h-8 text-yellow-400" />
        </div>
        <div className="floating-element">
          <Star className="w-5 h-5 text-pink-400" />
        </div>
        <div className="floating-element">
          <Trophy className="w-7 h-7 text-orange-400" />
        </div>
        <div className="floating-element">
          <Crown className="w-6 h-6 text-indigo-400" />
        </div>
      </div>
    );
  };

  const renderParticles = () => {
    return (
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    );
  };

  const renderGlowOrbs = () => {
    return (
      <div className="glow-orbs">
        <div className="glow-orb" />
        <div className="glow-orb" />
        <div className="glow-orb" />
      </div>
    );
  };



  const renderQuestion = () => {
    if (selectedCategory) {
      const currentQ = advancedQuestions[currentQuestion];
      
      switch (currentQ.type) {
        case 'multiple-choice':
          return (
            <div className="options-grid">
              {currentQ.options?.map((option, index) => (
                <motion.button
                  key={index}
                  className={`option-button ${selectedAnswer === index ? 'selected' : ''}`}
                  onClick={() => setSelectedAnswer(index)}
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
          );
        
        case 'true-false':
          return (
            <div className="true-false-grid">
              <motion.button
                className={`true-false-button ${selectedAnswer === true ? 'selected' : ''}`}
                onClick={() => setSelectedAnswer(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                True
              </motion.button>
              <motion.button
                className={`true-false-button ${selectedAnswer === false ? 'selected' : ''}`}
                onClick={() => setSelectedAnswer(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                False
              </motion.button>
            </div>
          );
        
        case 'fill-blank':
          return (
            <div className="fill-blank-container">
              <input
                type="text"
                className="fill-blank-input"
                value={fillBlankAnswer}
                onChange={(e) => setFillBlankAnswer(e.target.value)}
                placeholder="Enter your answer..."
              />
            </div>
          );
        
        case 'matching':
          return (
            <div className="matching-container">
              <div className="matching-pairs">
                {currentQ.options?.map((option, index) => (
                  <div key={index} className="matching-pair">
                    <span>{option}</span>
                    <input
                      type="text"
                      value={matchingAnswers[index] || ''}
                      onChange={(e) => {
                        const newAnswers = [...matchingAnswers];
                        newAnswers[index] = e.target.value;
                        setMatchingAnswers(newAnswers);
                      }}
                      placeholder="Enter matching term..."
                      className="matching-input"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'coding':
          return (
            <div className="coding-container">
              <div className="code-executor">
                <div className="code-executor-header">
                  <div className="code-executor-title">
                    <Code className="w-4 h-4" />
                    Code Editor
                  </div>
                </div>
                <div className="code-editor-container">
                  <textarea
                    className="code-editor"
                    defaultValue={currentQ.codeSnippet}
                    placeholder="Write your code here..."
                  />
                </div>
              </div>
            </div>
          );
        
        default:
          return null;
      }
    }
    return null;
  };

  const renderAdvancedActions = () => {
    const currentQ = advancedQuestions[currentQuestion];
    const canSubmit = selectedAnswer !== null || 
                     (currentQ.type === 'fill-blank' && fillBlankAnswer.trim()) ||
                     (currentQ.type === 'matching' && matchingAnswers.some(a => a.trim()));
    
    console.log('Submit Debug:', {
      selectedAnswer,
      fillBlankAnswer,
      matchingAnswers,
      canSubmit,
      questionType: currentQ.type
    });

    return (
      <div className="question-actions">
        <button 
          className="btn-submit"
          onClick={() => {
            console.log('Submit button clicked!');
            if (currentQ.type === 'fill-blank') {
              handleAdvancedAnswer(fillBlankAnswer);
            } else if (currentQ.type === 'matching') {
              handleAdvancedAnswer(matchingAnswers);
            } else {
              handleAdvancedAnswer(selectedAnswer!);
            }
          }}
          disabled={!canSubmit}
        >
          Submit Answer
        </button>
        <button 
          className="btn-hint"
          onClick={() => handlePowerUp('hint')}
          disabled={powerUps.hint <= 0}
        >
          <Lightbulb className="w-4 h-4" />
          Hint ({powerUps.hint})
        </button>
          <button 
            className="btn-skip"
            onClick={() => handlePowerUp('skipQuestion')}
            disabled={powerUps.skipQuestion <= 0}
          >
            <Zap className="w-4 h-4" />
            Skip ({powerUps.skipQuestion})
          </button>
      </div>
    );
  };

  if (showResults) {
    return (
      <motion.div 
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {renderFloatingElements()}
        {renderParticles()}
        {renderGlowOrbs()}
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
                <span className="stat-value">
                  {quizStats.earnedPoints}/{quizStats.totalQuestions}
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
                <span className="stat-value">{formatTime((selectedCategory?.timeLimit || 0) * 60 - timeLeft)}</span>
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
                  <span className="stat-value">{livesRemaining}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Hints Used</span>
                  <span className="stat-value">{hintsUsed}</span>
                </div>
              </div>
            )}

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

  if (isQuizActive && selectedCategory && isAdvanced) {
    return (
      <DynamicQuizContainer
        questions={advancedQuestions}
        timeLimit={quizConfig.timeLimit}
        onComplete={(score, totalQuestions, answers) => {
          setScore(score);
          setUserAnswers(answers);
          setShowResults(true);
          setIsQuizActive(false);
          if (onComplete) {
            onComplete(score, totalQuestions);
          }
        }}
        onClose={() => {
          setSelectedCategory(null);
          setIsQuizActive(false);
          setShowResults(false);
          if (onClose) {
            onClose();
          }
        }}
      />
    );
  }

  if (isQuizActive && selectedCategory) {
    return (
      <motion.div 
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {renderFloatingElements()}
        {renderParticles()}
        {renderGlowOrbs()}
        <div className="quiz-header">
          <div className="quiz-header-left">
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
                  Question {currentQuestion + 1} of {advancedQuestions.length}
                </span>
                <div className="timer">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
                <div className="difficulty-badge">
                  {advancedQuestions[currentQuestion]?.difficulty}
                </div>
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

            <button 
              className="config-button"
              onClick={() => setShowConfigModal(true)}
              title="Quiz Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="quiz-content">
          <div className="power-ups-container">
            {Object.entries(powerUps).map(([type, count]) => (
              <button
                key={type}
                className={`power-up-btn ${count > 0 ? 'available' : 'disabled'}`}
                onClick={() => handlePowerUp(type as keyof typeof powerUps)}
                disabled={count <= 0}
                title={`${type.replace(/([A-Z])/g, ' $1').toLowerCase()} (${count} left)`}
              >
                {type === 'skipQuestion' && <Zap className="w-4 h-4" />}
                {type === 'timeFreeze' && <Pause className="w-4 h-4" />}
                {type === 'fiftyFifty' && <Target className="w-4 h-4" />}
                {type === 'hint' && <Lightbulb className="w-4 h-4" />}
                <span className="power-up-count">{count}</span>
              </button>
            ))}
          </div>

          <motion.div 
            className="question-card"
            key={currentQuestion}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="question-text">
              {advancedQuestions[currentQuestion]?.question}
            </h3>
            
            {renderQuestion()}
            {renderAdvancedActions()}
          </motion.div>
        </div>

        <QuizConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onStart={startQuizWithConfig}
          category={selectedCategoryForConfig!}
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="quiz-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {renderFloatingElements()}
      {renderParticles()}
      {renderGlowOrbs()}
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
                Advanced Quiz Mode
              </h1>
              <p className="quiz-hero-subtitle">
                Challenge yourself with advanced questions, power-ups, and real-time feedback
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
            {isAdvanced && (
              <div className="stat-item-large">
                <Zap className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="stat-title">Power-ups & Lives</h4>
                  <p className="stat-description">Use special abilities and manage your lives</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <QuizConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onStart={startQuizWithConfig}
        category={selectedCategoryForConfig!}
      />
    </motion.div>
  );
};

export default Quiz;

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
}

// Default Quiz Configuration
const defaultQuizConfig: QuizConfig = {
  timeLimit: 20,
  questionCount: 10,
  difficulty: 'Medium'
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
    difficulty: 'medium'
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
              {isAdvanced ? 'Exit Quiz' : 'Back to Categories'}
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

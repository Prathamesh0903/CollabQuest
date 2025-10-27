import React, { useState } from 'react';
import { 
  ChevronLeft, Clock, Target, Trophy, BookOpen, Code, Brain, Star,
  CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, BarChart3,
  Users, TrendingUp, Lightbulb, Shield, Crown, Heart, Timer, Settings,
  Volume2, VolumeX, Eye, EyeOff, Lock, Unlock, Award, Target as TargetIcon
} from 'lucide-react';
import { QuizProps, QuizCategory, QuizConfig, Question, UserAnswer, QuizStats, PowerUps, defaultQuizConfig } from './types';
import QuizConfigModal from '../QuizConfigModal';
import QuizCategoryCard from './QuizCategoryCard';
import DynamicQuizContainer from './DynamicQuizContainer';
import QuizResults from './QuizResults';
import quizService from '../../services/quizService';
import '../Quiz.css';

// Quiz categories data
const quizCategories: QuizCategory[] = [
  {
    id: 'javascript-fundamentals-quiz',
    title: 'JavaScript Fundamentals',
    description: 'Master the basics of JavaScript programming',
    icon: <Code className="w-6 h-6" />,
    color: '#f7df1e',
    questionCount: 10, // Default value, user can override in config
    difficulty: 'Easy',
    timeLimit: 20
  },
  {
    id: 'python-essentials-quiz',
    title: 'Python Essentials',
    description: 'Learn Python programming fundamentals',
    icon: <Code className="w-6 h-6" />,
    color: '#3776ab',
    questionCount: 10, // Default value, user can override in config
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
    icon: <Settings className="w-6 h-6" />,
    color: '#f59e0b',
    questionCount: 12,
    difficulty: 'Hard',
    timeLimit: 40
  }
];

// Advanced questions for advanced mode
const advancedQuestions: Question[] = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: 'What is the output of the following code?\n\n```javascript\nconst arr = [1, 2, 3];\nconst [a, ...rest] = arr;\nconsole.log(rest);\n```',
    options: [
      { text: '[1, 2, 3]', isCorrect: false },
      { text: '[2, 3]', isCorrect: true },
      { text: '[1]', isCorrect: false },
      { text: 'undefined', isCorrect: false }
    ],
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
    options: [
      { text: 'map()', isCorrect: false },
      { text: 'filter()', isCorrect: false },
      { text: 'reduce()', isCorrect: false },
      { text: 'forEach()', isCorrect: false }
    ],
    correctAnswer: ['Transform each element', 'Select elements', 'Accumulate values', 'Execute for each element'],
    explanation: 'These are fundamental array methods in JavaScript with distinct purposes.',
    points: 12,
    timeLimit: 45,
    difficulty: 'medium',
    tags: ['javascript', 'arrays', 'methods']
  }
];

const Quiz: React.FC<QuizProps> = ({ onComplete, onClose, isAdvanced = true }) => {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCategoryForConfig, setSelectedCategoryForConfig] = useState<QuizCategory | null>(null);
  const [showResults, setShowResults] = useState(false);
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
  
  // Store quiz completion data
  const [completedQuizData, setCompletedQuizData] = useState<{
    userAnswers: UserAnswer[];
    questions: Question[];
    finalStats: QuizStats;
  } | null>(null);
  
  // Quiz Configuration
  const [quizConfig, setQuizConfig] = useState<QuizConfig>(defaultQuizConfig);

  const startQuiz = (category: QuizCategory) => {
    setSelectedCategoryForConfig(category);
    setShowConfigModal(true);
  };

  const startQuizWithConfig = async (config: QuizConfig) => {
    if (!selectedCategoryForConfig) return;
    
    console.log('🎯 Quiz.tsx: Starting quiz with category:', selectedCategoryForConfig.title);
    console.log('🆔 Quiz.tsx: Category ID:', selectedCategoryForConfig.id);
    
    setQuizConfig(config);
    setSelectedCategory(selectedCategoryForConfig);
    setShowConfigModal(false);
    
    if (isAdvanced) {
      // Load quiz data from service
      try {
        console.log('📡 Quiz.tsx: Calling quizService.getQuizById with:', selectedCategoryForConfig.id);
        const response = await quizService.getQuizById(selectedCategoryForConfig.id);
        console.log('📊 Quiz.tsx: Service response:', response);
        
        if (response.success && response.quiz) {
          console.log('✅ Quiz.tsx: Quiz loaded successfully:', response.quiz.title);
          console.log('📝 Quiz.tsx: First question:', response.quiz.questions[0]?.question);
          
          // Note: We'll calculate totalPoints after questions are filtered in DynamicQuizContainer
          // because we need to know which specific questions are selected
          setQuizStats(prev => ({
            ...prev,
            totalQuestions: Math.min(config.questionCount, response.quiz!.questions.length),
            totalPoints: 0, // Will be calculated when questions are filtered
            timeRemaining: config.timeLimit * 60
          }));
        }
      } catch (error) {
        console.error('💥 Quiz.tsx: Error loading quiz:', error);
        // Fallback to advancedQuestions if service fails
        console.log('🔄 Quiz.tsx: Using fallback advancedQuestions (JavaScript)');
        setQuizStats(prev => ({
          ...prev,
          totalQuestions: Math.min(config.questionCount, advancedQuestions.length),
          totalPoints: advancedQuestions.reduce((sum, q) => sum + q.points, 0),
          timeRemaining: config.timeLimit * 60
        }));
      }
    }
  };

  const handleQuizComplete = (score: number, totalQuestions: number, answers?: UserAnswer[], questions?: Question[], finalStats?: QuizStats) => {
    // Store the completed quiz data for results display
    if (answers && questions && finalStats) {
      setCompletedQuizData({
        userAnswers: answers,
        questions: questions,
        finalStats: finalStats
      });
      setQuizStats(finalStats);
    }
    setShowResults(true);
    onComplete?.(score, totalQuestions);
  };


  if (isAdvanced && selectedCategory) {
    console.log('🎯 Quiz.tsx: Passing config to DynamicQuizContainer:', {
      quizId: selectedCategory.id,
      timeLimit: quizConfig.timeLimit,
      questionCount: quizConfig.questionCount,
      difficulty: quizConfig.difficulty
    });
    
    return (
      <DynamicQuizContainer
        quizId={selectedCategory.id}
        timeLimit={quizConfig.timeLimit}
        questionCount={quizConfig.questionCount}
        difficulty={quizConfig.difficulty}
        onComplete={handleQuizComplete}
        onClose={() => {
          setSelectedCategory(null);
          setShowResults(false);
          if (onClose) {
            onClose();
          }
        }}
      />
    );
  }

  if (showResults) {
    return (
      <QuizResults
        quizStats={completedQuizData?.finalStats || quizStats}
        timeLimit={quizConfig.timeLimit}
        timeLeft={0}
        isAdvanced={isAdvanced}
        quizId={selectedCategory?.id}
        userAnswers={completedQuizData?.userAnswers || []}
        questions={completedQuizData?.questions || []}
        onRetake={() => {
          setShowResults(false);
          setSelectedCategory(null);
          setCompletedQuizData(null);
        }}
        onBackToDashboard={() => {
          setShowResults(false);
          setSelectedCategory(null);
          setCompletedQuizData(null);
          if (onClose) {
            onClose();
          }
        }}
      />
    );
  }

  return (
    <div className="quiz-container">
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
            <div>
              <h1 className="quiz-hero-title">
                Quizz Mode
              </h1>
              <p className="quiz-hero-subtitle">
                Challenge yourself with advanced questions, power-ups, and real-time feedback
              </p>
            </div>
          </div>
        </div>

        <div className="categories-grid">
          {quizCategories.map((category, index) => (
            <QuizCategoryCard
              key={category.id}
              category={category}
              index={index}
              onClick={startQuiz}
            />
          ))}
        </div>

        <div className="quiz-stats">
          <div className="stats-card">
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
          </div>
        </div>
      </div>
      
      <QuizConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onStart={startQuizWithConfig}
        category={selectedCategoryForConfig!}
      />
    </div>
  );
};

export default Quiz;

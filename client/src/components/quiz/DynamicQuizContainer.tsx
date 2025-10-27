import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Clock, Brain, Trophy, Code, CheckCircle, XCircle,
  Play, Pause, RotateCcw, BarChart3, Users, TrendingUp, Lightbulb,
  Shield, Crown, Heart, Timer, Settings, Volume2, VolumeX, Eye, EyeOff,
  Lock, Unlock, Award, Target as TargetIcon
} from 'lucide-react';
import { Question, UserAnswer, QuizStats, PowerUps, ServerQuiz } from './types';
import quizService from '../../services/quizService';
import QuizHeader from './QuizHeader';
import PowerUpsComponent from './PowerUps';
import QuizResults from './QuizResults';
import {
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillBlankQuestion,
  CodingQuestion,
  MatchingQuestion
} from './questions';
import './DynamicQuizContainer.css';

// Debug: Check if service is imported correctly
console.log('🔧 DynamicQuizContainer: quizService imported:', !!quizService);
console.log('🔧 DynamicQuizContainer: quizService methods:', Object.getOwnPropertyNames(quizService));

interface DynamicQuizContainerProps {
  questions?: Question[];
  quizId?: string;
  timeLimit: number;
  questionCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onComplete: (score: number, totalQuestions: number, answers?: UserAnswer[], questions?: Question[], finalStats?: QuizStats) => void;
  onClose: () => void;
}

const DynamicQuizContainer: React.FC<DynamicQuizContainerProps> = ({
  questions: propQuestions,
  quizId,
  timeLimit,
  questionCount,
  difficulty = 'Medium',
  onComplete,
  onClose
}) => {
  const [questions, setQuestions] = useState<Question[]>(propQuestions || []);
  const [loading, setLoading] = useState(!propQuestions);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // User answers and stats
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    totalPoints: 0,
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
  const [powerUps, setPowerUps] = useState<PowerUps>({
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

  // Update quiz stats when questions change
  useEffect(() => {
    if (questions.length > 0) {
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      setQuizStats(prev => ({
        ...prev,
        totalQuestions: questions.length,
        totalPoints: totalPoints
      }));
    }
  }, [questions]);

  // Filter questions based on difficulty and question count
  const filterQuestionsByConfig = (allQuestions: Question[]): Question[] => {
    let filteredQuestions: Question[] = [];
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        filteredQuestions = allQuestions.filter(q => 
          q.difficulty === 'easy' && 
          ['multiple-choice', 'true-false', 'predict-output'].includes(q.type)
        );
        break;
        
      case 'medium':
        const mediumQuestions = allQuestions.filter(q => 
          q.difficulty === 'medium' && 
          ['multiple-choice', 'true-false', 'predict-output', 'coding'].includes(q.type)
        );
        
        console.log('🔍 Medium filtering: Found', mediumQuestions.length, 'medium questions');
        
        // Ensure at least 2 coding questions per 5 questions
        const codingQuestions = mediumQuestions.filter(q => q.type === 'coding');
        const nonCodingQuestions = mediumQuestions.filter(q => q.type !== 'coding');
        
        console.log('🔍 Medium filtering: Coding questions:', codingQuestions.length, 'Non-coding:', nonCodingQuestions.length);
        
        const requiredCodingQuestions = Math.max(2, Math.ceil((questionCount || 10) * 0.4));
        const selectedCodingQuestions = codingQuestions.slice(0, Math.min(requiredCodingQuestions, codingQuestions.length));
        
        console.log('🔍 Medium filtering: Required coding:', requiredCodingQuestions, 'Selected coding:', selectedCodingQuestions.length);
        
        const remainingSlots = (questionCount || 10) - selectedCodingQuestions.length;
        const selectedNonCodingQuestions = nonCodingQuestions.slice(0, remainingSlots);
        
        console.log('🔍 Medium filtering: Remaining slots:', remainingSlots, 'Selected non-coding:', selectedNonCodingQuestions.length);
        
        filteredQuestions = [...selectedCodingQuestions, ...selectedNonCodingQuestions];
        console.log('🔍 Medium filtering: Final count:', filteredQuestions.length);
        break;
        
      case 'hard':
        const hardQuestions = allQuestions.filter(q => 
          q.difficulty === 'hard' && 
          ['multiple-choice', 'true-false', 'predict-output', 'coding'].includes(q.type)
        );
        
        const hardCodingQuestions = hardQuestions.filter(q => q.type === 'coding');
        const hardNonCodingQuestions = hardQuestions.filter(q => q.type !== 'coding');
        
        const requiredHardCodingQuestions = Math.max(2, Math.ceil((questionCount || 10) * 0.4));
        const selectedHardCodingQuestions = hardCodingQuestions.slice(0, Math.min(requiredHardCodingQuestions, hardCodingQuestions.length));
        
        const remainingHardSlots = (questionCount || 10) - selectedHardCodingQuestions.length;
        const selectedHardNonCodingQuestions = hardNonCodingQuestions.slice(0, remainingHardSlots);
        
        filteredQuestions = [...selectedHardCodingQuestions, ...selectedHardNonCodingQuestions];
        break;
        
      default:
        filteredQuestions = allQuestions;
    }
    
    // Shuffle and limit to questionCount
    console.log('🔍 Final filtering: questionCount =', questionCount, 'filteredQuestions.length =', filteredQuestions.length);
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const finalCount = questionCount || 10; // Use 10 as default, not allQuestions.length
    console.log('🔍 Final filtering: Final count will be', finalCount);
    return shuffled.slice(0, finalCount);
  };

  // Fetch quiz data if quizId is provided
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || propQuestions) {
        console.log('🔄 DynamicQuizContainer: Skipping fetch - quizId:', quizId, 'propQuestions:', !!propQuestions);
        return;
      }
      
      console.log('🔄 DynamicQuizContainer: Starting to fetch quiz with ID:', quizId);
      console.log('🔄 DynamicQuizContainer: Service object:', quizService);
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await quizService.getQuizById(quizId);
        console.log('📡 DynamicQuizContainer: Service response:', response);
        
        if (response.success && response.quiz) {
          console.log('✅ DynamicQuizContainer: Loaded questions:', response.quiz.questions.length);
          console.log('📝 DynamicQuizContainer: First question:', response.quiz.questions[0]?.question);
          
          // CRITICAL CHECK: Verify we're getting the right questions
          if (quizId === 'python-essentials-quiz' && response.quiz.questions[0]?.question.includes('JavaScript')) {
            console.log('🚨 CRITICAL ERROR: Python quiz returned JavaScript questions!');
            console.log('🚨 Expected Python, got:', response.quiz.questions[0]?.question);
          }
          
          // Filter questions based on configuration
          const filteredQuestions = filterQuestionsByConfig(response.quiz.questions);
          console.log('🎯 DynamicQuizContainer: Filtered questions:', filteredQuestions.length, 'from', response.quiz.questions.length);
          console.log('🎯 DynamicQuizContainer: Config - difficulty:', difficulty, 'questionCount:', questionCount);
          console.log('🎯 DynamicQuizContainer: Available medium questions:', response.quiz.questions.filter(q => q.difficulty === 'medium').length);
          console.log('🎯 DynamicQuizContainer: Available medium coding questions:', response.quiz.questions.filter(q => q.difficulty === 'medium' && q.type === 'coding').length);
          console.log('🎯 DynamicQuizContainer: Final filtered questions:', filteredQuestions.map(q => ({ id: q.id, type: q.type, difficulty: q.difficulty })));
          
          setQuestions(filteredQuestions);
        } else {
          console.error('❌ DynamicQuizContainer: Failed to load quiz:', response.error);
          throw new Error('Failed to load quiz');
        }
      } catch (err) {
        console.error('💥 DynamicQuizContainer: Error fetching quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, propQuestions]);

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

  const handlePowerUp = (type: keyof PowerUps) => {
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

    const finalStats = {
      ...quizStats,
      correctAnswers,
      earnedPoints,
      accuracy,
      averageTime,
      timeRemaining: timeLeft
    };

    setQuizStats(finalStats);

    // Pass all the necessary data to the completion handler
    onComplete(earnedPoints, questions.length, userAnswers, questions, finalStats);
  };

  const renderQuestionContent = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;

    switch (currentQ.type) {
      case 'multiple-choice':
        // Convert options to string array format
        const mcqOptions = (currentQ.options || []).map(option => 
          typeof option === 'string' ? option : option.text
        );
        return (
          <MultipleChoiceQuestion
            question={currentQ.question}
            options={mcqOptions}
            correctAnswer={currentQ.correctAnswer as number}
            selectedAnswer={selectedAnswer}
            showExplanation={showExplanation}
            onAnswerSelect={setSelectedAnswer}
          />
        );

      case 'true-false':
        return (
          <TrueFalseQuestion
            question={currentQ.question}
            correctAnswer={currentQ.correctAnswer as boolean}
            selectedAnswer={selectedAnswer}
            showExplanation={showExplanation}
            onAnswerSelect={setSelectedAnswer}
          />
        );

      case 'fill-blank':
        return (
          <FillBlankQuestion
            question={currentQ.question}
            correctAnswer={currentQ.correctAnswer as string}
            answer={fillBlankAnswer}
            showExplanation={showExplanation}
            onAnswerChange={setFillBlankAnswer}
          />
        );

      case 'coding':
        return (
          <CodingQuestion
            question={currentQ.question}
            codeSnippet={currentQ.codeSnippet}
            language={currentQ.language}
            testCases={currentQ.testCases}
            answer={codingAnswer}
            showExplanation={showExplanation}
            onAnswerChange={setCodingAnswer}
          />
        );

      case 'predict-output':
        return (
          <div className="predict-output-container">
            {/* Code Snippet Display */}
            {currentQ.codeSnippet && (
              <div className="code-snippet-display">
                <div className="code-header">
                  <span>Code:</span>
                </div>
                <pre className="code-content">
                  <code>{currentQ.codeSnippet}</code>
                </pre>
              </div>
            )}
            
            {/* Answer Options */}
            <div className="answer-grid">
              {currentQ.options?.map((option, index) => {
                const isObjectOption = typeof option === 'object' && 'text' in option && 'isCorrect' in option;
                const optionText = isObjectOption ? option.text : option as string;
                const isCorrect = isObjectOption ? option.isCorrect : false;
                
                return (
                  <button
                    key={index}
                    className={`answer-card ${selectedAnswer === index ? 'selected' : ''} ${
                      showExplanation ? 
                        (isCorrect ? 'correct' : 
                         selectedAnswer === index ? 'incorrect' : '') : ''
                    }`}
                    onClick={() => !showExplanation && setSelectedAnswer(index)}
                    disabled={showExplanation}
                  >
                    <div className="answer-content">
                      <div className="answer-letter">{String.fromCharCode(65 + index)}</div>
                      <div className="answer-text">{optionText}</div>
                    </div>
                    {showExplanation && isCorrect && (
                      <CheckCircle className="w-6 h-6 answer-icon correct" />
                    )}
                    {showExplanation && selectedAnswer === index && !isCorrect && (
                      <XCircle className="w-6 h-6 answer-icon incorrect" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'matching':
        // Convert options to string array format
        const matchingOptions = (currentQ.options || []).map(option => 
          typeof option === 'string' ? option : option.text
        );
        return (
          <MatchingQuestion
            question={currentQ.question}
            options={matchingOptions}
            correctAnswer={currentQ.correctAnswer as string[]}
            answers={matchingAnswers}
            showExplanation={showExplanation}
            onAnswerChange={setMatchingAnswers}
          />
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

  // Loading state
  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>Loading Quiz...</h2>
          <p>Please wait while we prepare your quiz questions</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="quiz-error">
        <div className="error-card">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2>Error Loading Quiz</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={onClose}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <QuizResults
        quizStats={quizStats}
        timeLimit={timeLimit}
        timeLeft={timeLeft}
        isAdvanced={true}
        quizId={quizId}
        userAnswers={userAnswers}
        questions={questions}
        onRetake={() => {
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
        onBackToDashboard={onClose}
      />
    );
  }

  if (!isQuizActive) {
    return (
      <div className="quiz-start">
        <div className="start-card">
          <div className="start-header">
            <Brain className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="start-title">Advanced Quiz</h2>
            <p className="start-subtitle">Test your knowledge with advanced questions</p>
          </div>
          
          <div className="quiz-info">
            <div className="info-item">
              <Code className="w-5 h-5" />
              <span>{questions.length} Questions</span>
            </div>
            <div className="info-item">
              <Clock className="w-5 h-5" />
              <span>{timeLimit} Minutes</span>
            </div>
            <div className="info-item">
              <TargetIcon className="w-5 h-5" />
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
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="advanced-quiz-container">
      <QuizHeader
        selectedCategory={null}
        currentQuestion={currentQuestionIndex}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        isPaused={isPaused}
        quizStats={quizStats}
        currentStreak={currentStreak}
        livesRemaining={quizStats.livesRemaining}
        onBack={onClose}
        onPause={() => setIsPaused(!isPaused)}
      />

      <div className="quiz-content">
        <PowerUpsComponent
          powerUps={powerUps}
          onPowerUp={handlePowerUp}
        />

        <div className="question-card">
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
        </div>
      </div>
    </div>
  );
};

export default DynamicQuizContainer;

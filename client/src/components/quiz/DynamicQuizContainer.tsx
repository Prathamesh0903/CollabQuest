import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Clock, Brain, Trophy, Code, CheckCircle, XCircle,
  Play, Pause, RotateCcw, BarChart3, Users, TrendingUp, Lightbulb,
  Shield, Crown, Heart, Timer, Settings, Volume2, VolumeX, Eye, EyeOff,
  Lock, Unlock, Award, Target as TargetIcon
} from 'lucide-react';
import { Question, UserAnswer, QuizStats, PowerUps } from './types';
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

interface DynamicQuizContainerProps {
  questions: Question[];
  timeLimit: number;
  onComplete: (score: number, totalQuestions: number, answers: UserAnswer[]) => void;
  onClose: () => void;
}

const DynamicQuizContainer: React.FC<DynamicQuizContainerProps> = ({
  questions,
  timeLimit,
  onComplete,
  onClose
}) => {
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
          <MultipleChoiceQuestion
            question={currentQ.question}
            options={currentQ.options || []}
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

      case 'matching':
        return (
          <MatchingQuestion
            question={currentQ.question}
            options={currentQ.options || []}
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

  if (showResults) {
    return (
      <QuizResults
        quizStats={quizStats}
        timeLimit={timeLimit}
        timeLeft={timeLeft}
        isAdvanced={true}
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
      <motion.div 
        className="quiz-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
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

export default DynamicQuizContainer;

import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import './Quiz.css';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizSettings {
  topic: string;
  numQuestions: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizState {
  currentQuestion: number;
  score: number;
  timeLeft: number;
  answers: string[];
  isComplete: boolean;
  showResults: boolean;
  showAnalysis: boolean;
}

// Quiz Navbar Component
const QuizNavbar: React.FC<{ onComplete: (score: number, totalQuestions: number) => void; currentState: string; settings?: QuizSettings; quizData?: QuizState; questions?: QuizQuestion[] }> = ({ 
  onComplete, 
  currentState, 
  settings, 
  quizData, 
  questions 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="quiz-navbar">
      <div className="navbar-left">
        <button className="back-btn" onClick={() => onComplete(quizData?.score ?? 0, questions?.length ?? 0)}>← Back to Dashboard</button>
        <div className="navbar-logo">
          🎯 Quiz <span style={{fontSize: '1.1rem', color: '#eebbc3', marginLeft: '0.5rem'}}>Challenge</span>
        </div>
      </div>
      
      {currentState === 'quiz' && settings && quizData && questions && (
        <div className="navbar-quiz-info">
          <div className="quiz-topic">{settings.topic}</div>
          <div className="quiz-progress">
            Q{quizData.currentQuestion + 1} of {questions.length}
          </div>
          <div className="quiz-timer">
            ⏱️ {formatTime(quizData.timeLeft)}
          </div>
        </div>
      )}
      
      {currentState === 'setup' && (
        <div className="navbar-setup-info">
          <span>Configure Your Quiz</span>
        </div>
      )}
      
      {currentState === 'loading' && (
        <div className="navbar-loading-info">
          <span>Preparing Quiz...</span>
        </div>
      )}
      
      {currentState === 'results' && (
        <div className="navbar-results-info">
          <span>Quiz Complete!</span>
        </div>
      )}
    </header>
  );
};

const Quiz: React.FC<{ onComplete: (score: number, totalQuestions: number) => void }> = ({ onComplete }) => {
  const [quizState, setQuizState] = useState<'start' | 'setup' | 'loading' | 'quiz' | 'results'>('start');
  const [settings, setSettings] = useState<QuizSettings>({
    topic: '',
    numQuestions: 10,
    timeLimit: 300,
    difficulty: 'medium'
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizData, setQuizData] = useState<QuizState>({
    currentQuestion: 0,
    score: 0,
    timeLeft: 300,
    answers: [],
    isComplete: false,
    showResults: false,
    showAnalysis: false
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Sample coding questions - in a real app, these would come from an API
  const sampleQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: "What is the output of `console.log(typeof [])` in JavaScript?",
      options: ["array", "object", "undefined", "Array"],
      correct_answer: "object",
      explanation: "In JavaScript, arrays are objects. The typeof operator returns 'object' for arrays.",
      category: "JavaScript",
      difficulty: "easy"
    },
    {
      id: 2,
      question: "Which method is used to add an element to the end of an array in JavaScript?",
      options: ["push()", "pop()", "shift()", "unshift()"],
      correct_answer: "push()",
      explanation: "The push() method adds one or more elements to the end of an array and returns the new length.",
      category: "JavaScript",
      difficulty: "easy"
    },
    {
      id: 3,
      question: "What is the purpose of the 'use strict' directive in JavaScript?",
      options: [
        "To enable strict type checking",
        "To catch common coding mistakes and prevent certain actions",
        "To improve performance",
        "To enable ES6 features"
      ],
      correct_answer: "To catch common coding mistakes and prevent certain actions",
      explanation: "'use strict' helps catch common coding mistakes and prevents certain actions that might be confusing or ill-advised.",
      category: "JavaScript",
      difficulty: "medium"
    },
    {
      id: 4,
      question: "What is the output of `console.log(2 + '2')` in JavaScript?",
      options: ["4", "22", "NaN", "Error"],
      correct_answer: "22",
      explanation: "JavaScript performs type coercion. When adding a number and string, the number is converted to a string.",
      category: "JavaScript",
      difficulty: "easy"
    },
    {
      id: 5,
      question: "Which of the following is NOT a valid way to declare a variable in JavaScript?",
      options: ["let x = 5;", "const y = 10;", "var z = 15;", "variable w = 20;"],
      correct_answer: "variable w = 20;",
      explanation: "'variable' is not a valid keyword in JavaScript. Use 'let', 'const', or 'var' instead.",
      category: "JavaScript",
      difficulty: "easy"
    },
    {
      id: 6,
      question: "What is the purpose of the 'async' keyword in JavaScript?",
      options: [
        "To make a function synchronous",
        "To declare an asynchronous function that returns a Promise",
        "To improve performance",
        "To enable parallel execution"
      ],
      correct_answer: "To declare an asynchronous function that returns a Promise",
      explanation: "The async keyword declares an asynchronous function that returns a Promise and allows the use of await inside it.",
      category: "JavaScript",
      difficulty: "medium"
    },
    {
      id: 7,
      question: "What is the output of `console.log([1, 2, 3].map(x => x * 2))`?",
      options: ["[2, 4, 6]", "[1, 2, 3]", "[undefined, undefined, undefined]", "Error"],
      correct_answer: "[2, 4, 6]",
      explanation: "The map() method creates a new array with the results of calling a function for every array element.",
      category: "JavaScript",
      difficulty: "medium"
    },
    {
      id: 8,
      question: "What is the difference between `==` and `===` in JavaScript?",
      options: [
        "There is no difference",
        "== checks value and type, === checks only value",
        "=== checks value and type, == checks only value",
        "== is faster than ==="
      ],
      correct_answer: "=== checks value and type, == checks only value",
      explanation: "=== (strict equality) checks both value and type, while == (loose equality) performs type coercion.",
      category: "JavaScript",
      difficulty: "medium"
    },
    {
      id: 9,
      question: "What is a closure in JavaScript?",
      options: [
        "A function that has access to variables in its outer scope",
        "A way to close browser tabs",
        "A method to end loops",
        "A type of variable declaration"
      ],
      correct_answer: "A function that has access to variables in its outer scope",
      explanation: "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned.",
      category: "JavaScript",
      difficulty: "hard"
    },
    {
      id: 10,
      question: "What is the purpose of the 'this' keyword in JavaScript?",
      options: [
        "To refer to the current function",
        "To refer to the current object context",
        "To create a new instance",
        "To end a statement"
      ],
      correct_answer: "To refer to the current object context",
      explanation: "The 'this' keyword refers to the object that is currently executing the code.",
      category: "JavaScript",
      difficulty: "medium"
    }
  ];

  const topics = [
    "JavaScript Fundamentals",
    "React & Frontend",
    "Python Basics",
    "Data Structures",
    "Algorithms",
    "Web Development",
    "Database Concepts",
    "System Design"
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', timeMultiplier: 1.5, color: '#4CAF50' },
    { value: 'medium', label: 'Medium', timeMultiplier: 1.0, color: '#FF9800' },
    { value: 'hard', label: 'Hard', timeMultiplier: 0.7, color: '#F44336' }
  ];

  const confirmStartQuiz = () => {
    console.log('confirmStartQuiz called with settings:', settings);
    setShowReadyModal(false);
    setQuizState('loading');
    
    // Simulate API call
    setTimeout(() => {
      // First try to get questions of the selected difficulty
      let filteredQuestions = sampleQuestions
        .filter(q => q.difficulty === settings.difficulty);
      
      // If we don't have enough questions of the selected difficulty, 
      // fill with questions of other difficulties
      if (filteredQuestions.length < settings.numQuestions) {
        const remainingQuestions = sampleQuestions
          .filter(q => q.difficulty !== settings.difficulty)
          .sort(() => Math.random() - 0.5); // Shuffle for variety
        
        const neededQuestions = settings.numQuestions - filteredQuestions.length;
        const additionalQuestions = remainingQuestions.slice(0, neededQuestions);
        
        filteredQuestions = [...filteredQuestions, ...additionalQuestions];
      }
      
      // Shuffle and slice to the requested number
      filteredQuestions = filteredQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, settings.numQuestions);
      
      // Ensure we have at least one question
      if (filteredQuestions.length === 0) {
        console.error('No questions available for the selected settings');
        // Fallback to all questions
        filteredQuestions = sampleQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(settings.numQuestions, sampleQuestions.length));
      }
      
      // Final safety check
      if (filteredQuestions.length === 0) {
        console.error('Still no questions available, using default questions');
        filteredQuestions = sampleQuestions.slice(0, 5); // Use first 5 questions as fallback
      }
      
      console.log('Starting quiz with:', {
        topic: settings.topic,
        difficulty: settings.difficulty,
        numQuestions: settings.numQuestions,
        actualQuestions: filteredQuestions.length,
        questions: filteredQuestions.map(q => ({ id: q.id, difficulty: q.difficulty }))
      });
      
      setQuestions(filteredQuestions);
      const multiplier = difficulties.find(d => d.value === settings.difficulty)?.timeMultiplier ?? 1;
      setQuizData(prev => ({
        ...prev,
        timeLeft: Math.floor(settings.timeLimit * multiplier),
        answers: new Array(filteredQuestions.length).fill('')
      }));
      setQuizState('quiz');
    }, 1500);
  }

  const startQuiz = () => {
    // Validate that topic is selected
    if (!settings.topic) {
      alert('Please select a topic before starting the quiz.');
      return;
    }
    
    // Validate that we have enough questions available
    const availableQuestions = sampleQuestions.filter(q => q.difficulty === settings.difficulty);
    if (availableQuestions.length === 0) {
      alert(`No questions available for ${settings.difficulty} difficulty. Please select a different difficulty.`);
      return;
    }
    
    setShowReadyModal(true);
  };

  useEffect(() => {
    if (quizState === 'quiz' && quizData.timeLeft > 0 && !quizData.isComplete) {
      const timer = setInterval(() => {
        setQuizData(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timer);
            return { ...prev, isComplete: true, showResults: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizState, quizData.timeLeft, quizData.isComplete]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const currentQuestion = questions[quizData.currentQuestion];
    if (!currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const isLastQuestion = quizData.currentQuestion === (questions.length - 1);
    
    setQuizData(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestion] = selectedAnswer;
      
      const newScore = isCorrect ? prev.score + 1 : prev.score;
      
      // Auto-submit when all questions are answered
      if (isLastQuestion) {
        return {
          ...prev,
          score: newScore,
          answers: newAnswers,
          currentQuestion: prev.currentQuestion,
          isComplete: true,
          showResults: true
        };
      }
      
      return {
        ...prev,
        score: newScore,
        answers: newAnswers,
        currentQuestion: prev.currentQuestion + 1
      };
    });
    
    setSelectedAnswer('');
    setShowExplanation(false);
    
    // Auto-submit and show results when last question is answered
    if (isLastQuestion) {
      setTimeout(() => {
        setQuizState('results');
      }, 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return questions.length > 0 ? ((quizData.currentQuestion + 1) / questions.length) * 100 : 0;
  };

  const getScorePercentage = () => {
    return questions.length > 0 ? (quizData.score / questions.length) * 100 : 0;
  };

  const getPerformanceMessage = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return { message: "🎉 Outstanding! You're a coding genius!", color: "#4CAF50" };
    if (percentage >= 80) return { message: "🌟 Excellent! Great job!", color: "#8BC34A" };
    if (percentage >= 70) return { message: "👍 Good work! Keep learning!", color: "#FFC107" };
    if (percentage >= 60) return { message: "📚 Not bad! Room for improvement.", color: "#FF9800" };
    return { message: "💪 Keep practicing! You'll get better!", color: "#F44336" };
  };

  // New gamification functions
  const getAchievements = () => {
    const percentage = getScorePercentage();
    const achievements = [];
    
    if (percentage === 100) achievements.push({ icon: "🏆", title: "Perfect Score", description: "Flawless performance!" });
    if (percentage >= 90) achievements.push({ icon: "⭐", title: "Master Coder", description: "Exceptional knowledge!" });
    if (percentage >= 80) achievements.push({ icon: "🎯", title: "Sharp Shooter", description: "Great accuracy!" });
    if (quizData.timeLeft > settings.timeLimit * 0.5) achievements.push({ icon: "⚡", title: "Speed Demon", description: "Quick and accurate!" });
    if (settings.difficulty === 'hard' && percentage >= 70) achievements.push({ icon: "💪", title: "Hard Mode Hero", description: "Conquered the challenge!" });
    if (settings.numQuestions >= 15) achievements.push({ icon: "📚", title: "Marathon Runner", description: "Completed a long quiz!" });
    
    return achievements;
  };

  const getBadges = () => {
    const percentage = getScorePercentage();
    const badges = [];
    
    if (percentage === 100) badges.push({ icon: "👑", name: "Crown", color: "#FFD700" });
    if (percentage >= 90) badges.push({ icon: "💎", name: "Diamond", color: "#B9F2FF" });
    if (percentage >= 80) badges.push({ icon: "🥇", name: "Gold", color: "#FFD700" });
    if (percentage >= 70) badges.push({ icon: "🥈", name: "Silver", color: "#C0C0C0" });
    if (percentage >= 60) badges.push({ icon: "🥉", name: "Bronze", color: "#CD7F32" });
    
    return badges;
  };

  const getQuestionAnalysis = () => {
    return questions.map((question, index) => {
      const userAnswer = quizData.answers[index];
      const isCorrect = userAnswer === question.correct_answer;
      const timeSpent = Math.floor((settings.timeLimit - quizData.timeLeft) / questions.length);
      
      return {
        questionNumber: index + 1,
        question: question.question,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation,
        difficulty: question.difficulty,
        timeSpent
      };
    });
  };

  const getStreakAnalysis = () => {
    let currentStreak = 0;
    let maxStreak = 0;
    let totalStreak = 0;
    
    quizData.answers.forEach(answer => {
      const questionIndex = quizData.answers.indexOf(answer);
      const isCorrect = answer === questions[questionIndex]?.correct_answer;
      
      if (isCorrect) {
        currentStreak++;
        totalStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return { currentStreak, maxStreak, totalStreak };
  };

  useEffect(() => {
    const isPerfect = questions.length > 0 && quizData.score === questions.length && quizState === 'results';
    setShowConfetti(isPerfect);
  }, [questions.length, quizData.score, quizState]);

  // Handle auto-submit when quiz is complete
  useEffect(() => {
    if (quizData.isComplete && quizData.showResults && quizState === 'quiz') {
      setQuizState('results');
    }
  }, [quizData.isComplete, quizData.showResults, quizState]);

  const renderStartContent = () => (
    <div className="quiz-setup-enhanced">
      <div className="start-quiz-section">
        <div className="start-quiz-card">
          <div className="quiz-card-header">
            <h2>🚀 Ready to Start a Quiz?</h2>
            <p>Click here to configure your quiz and test your knowledge!</p>
          </div>
          <div className="quiz-actions">
            <button
              className="start-quiz-btn"
              onClick={() => setQuizState('setup')}
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSetupContent = () => (
    <div className="quiz-setup-enhanced">
      {/* Start Quiz Card */}
      <div className="start-quiz-section">
        <div className="start-quiz-card">
          <div className="quiz-card-header">
            <h2>🚀 Configure Your Quiz</h2>
            <p>Set up your perfect coding challenge and test your skills!</p>
          </div>
          
          <div className="quiz-settings-grid">
            <div className="setting-item">
              <label>Choose Topic:</label>
              <select 
                value={settings.topic} 
                onChange={(e) => setSettings(prev => ({ ...prev, topic: e.target.value }))}
              >
                <option value="">Select a topic...</option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label>Number of Questions:</label>
              <div className="number-input">
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, numQuestions: Math.max(5, prev.numQuestions - 5) }))}
                  disabled={settings.numQuestions <= 5}
                >-</button>
                <span>{settings.numQuestions}</span>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, numQuestions: Math.min(20, prev.numQuestions + 5) }))}
                  disabled={settings.numQuestions >= 20}
                >+</button>
              </div>
            </div>

            <div className="setting-item">
              <label>Difficulty Level:</label>
              <div className="difficulty-buttons">
                {difficulties.map(diff => (
                  <button
                    key={diff.value}
                    className={`difficulty-btn ${settings.difficulty === diff.value ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: settings.difficulty === diff.value ? diff.color : 'transparent',
                      color: settings.difficulty === diff.value ? 'white' : '#e0e0e0',
                      borderColor: settings.difficulty === diff.value ? diff.color : '#444'
                    }}
                    onClick={() => setSettings(prev => ({ ...prev, difficulty: diff.value as any }))}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <label>Time Limit (seconds):</label>
              <div className="number-input">
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, timeLimit: Math.max(60, prev.timeLimit - 30) }))}
                  disabled={settings.timeLimit <= 60}
                >-</button>
                <span>{settings.timeLimit}</span>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, timeLimit: Math.min(600, prev.timeLimit + 30) }))}
                  disabled={settings.timeLimit >= 600}
                >+</button>
              </div>
            </div>
          </div>

          <div className="quiz-actions">
            <button 
              className="info-btn"
              onClick={() => setShowInfoModal(true)}
            >
              ℹ️ Quiz Information
            </button>
            <button 
              className="start-quiz-btn"
              onClick={startQuiz}
              disabled={!settings.topic}
            >
              🚀 Start Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadingContent = () => (
    <div className="loading-quiz">
      <div className="loading-spinner"></div>
      <h2>🎯 Preparing Your Quiz...</h2>
      <p>Loading {settings.numQuestions} questions on {settings.topic}</p>
      <div className="loading-progress">
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );

  const renderQuizContent = () => {
    const currentQuestion = questions[quizData.currentQuestion];

    if (!currentQuestion) {
      return (
        <div className="quiz-error">
          <h1>Quiz Error</h1>
          <p>Sorry, there was a problem loading your question. Please try again.</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            🔄 Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="quiz-content">
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {quizData.currentQuestion + 1} / {questions.length}
          </div>
        </div>

        <div className="question-container">
          <div className="question-header">
            <span className="question-number">Q{quizData.currentQuestion + 1}</span>
            <span className="question-difficulty">{currentQuestion.difficulty}</span>
          </div>
          
          <div className="question-text">
            {currentQuestion.question}
          </div>

          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(option)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>

          {selectedAnswer && (
            <div className="answer-feedback">
              <div className={`feedback ${selectedAnswer === currentQuestion.correct_answer ? 'correct' : 'incorrect'}`}>
                {selectedAnswer === currentQuestion.correct_answer ? '✅ Correct!' : '❌ Incorrect!'}
              </div>
              {showExplanation && currentQuestion.explanation && (
                <div className="explanation">
                  <h4>💡 Explanation:</h4>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}
              <button 
                className="next-btn"
                onClick={handleNextQuestion}
              >
                {quizData.currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          )}

          {selectedAnswer && !showExplanation && (
            <button 
              className="explanation-btn"
              onClick={() => setShowExplanation(true)}
            >
              💡 Show Explanation
            </button>
          )}
        </div>

        <div className="quiz-footer">
          <div className="score-display">
            Score: {quizData.score} / {questions.length}
          </div>
        </div>
      </div>
    );
  };

  const renderResultsContent = () => {
    const performance = getPerformanceMessage();

    return (
      <div className="quiz-results">
        {showConfetti && <Confetti numberOfPieces={400} recycle={false} />}
        <div className="results-header">
          <h1>🎉 Quiz Complete!</h1>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-number">{quizData.score}</span>
              <span className="score-total">/{questions.length}</span>
            </div>
            <div className="score-percentage">{getScorePercentage().toFixed(1)}%</div>
          </div>
          <p className="performance-message" style={{ color: performance.color }}>
            {performance.message}
          </p>
        </div>

        <div className="results-stats">
          <div className="stat-card">
            <h3>⏱️ Time Used</h3>
            <p>{formatTime(settings.timeLimit - quizData.timeLeft)}</p>
          </div>
          <div className="stat-card">
            <h3>🎯 Accuracy</h3>
            <p>{getScorePercentage().toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h3>🏆 Difficulty</h3>
            <p>{settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}</p>
          </div>
        </div>

        <div className="results-actions">
          <button 
            className="analysis-btn" 
            onClick={() => setShowAnalysisModal(true)}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            📊 Show Result Analysis
          </button>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            🔄 Try Again
          </button>
          <button className="back-btn" onClick={() => onComplete(quizData.score, questions.length)}>
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  // Debug logging
  console.log('Quiz state:', quizState, {
    questionsCount: questions.length,
    currentQuestion: quizData.currentQuestion,
    settings: settings,
    showReadyModal: showReadyModal
  });

  return (
    <div className="quiz-container">
      <QuizNavbar 
        onComplete={onComplete} 
        currentState={quizState}
        settings={settings}
        quizData={quizData}
        questions={questions}
      />
      
      <main className="quiz-main-content scrollable-quiz">
        {quizState === 'start' && renderStartContent()}
        {quizState === 'setup' && renderSetupContent()}
        {quizState === 'loading' && renderLoadingContent()}
        {quizState === 'quiz' && renderQuizContent()}
        {quizState === 'results' && renderResultsContent()}
      </main>

      {/* Information Modal */}
      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Quiz Information</h3>
              <button className="modal-close" onClick={() => setShowInfoModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-icon">❓</span>
                  <div>
                    <h4>Question Format</h4>
                    <p>All questions are multiple choice with 4 options each</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">⏰</span>
                  <div>
                    <h4>Timer System</h4>
                    <p>Time limits are adjusted based on difficulty level</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">✅</span>
                  <div>
                    <h4>Immediate Feedback</h4>
                    <p>Get instant feedback after each question</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">💡</span>
                  <div>
                    <h4>Explanations</h4>
                    <p>View detailed explanations to learn from mistakes</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏆</span>
                  <div>
                    <h4>Scoring</h4>
                    <p>Earn points for correct answers and track your progress</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">📊</span>
                  <div>
                    <h4>Results</h4>
                    <p>View comprehensive results with performance analysis</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn" onClick={() => setShowInfoModal(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ready to Start Modal */}
      {showReadyModal && (
        <div className="modal-overlay" onClick={() => setShowReadyModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h3>🚀 Ready to Start?</h3>
                <button className="modal-close" onClick={() => setShowReadyModal(false)}>×</button>
            </div>
            <div className="modal-body">
                <p>You are about to start a quiz with the following settings:</p>
                <ul>
                    <li><b>Topic:</b> {settings.topic}</li>
                    <li><b>Number of Questions:</b> {settings.numQuestions}</li>
                    <li><b>Difficulty:</b> {settings.difficulty}</li>
                    <li><b>Time Limit:</b> {settings.timeLimit} seconds</li>
                </ul>
            </div>
            <div className="modal-footer">
                <button className="modal-btn" onClick={confirmStartQuiz}>
                Let's Go!
                </button>
            </div>
            </div>
        </div>
      )}

      {/* Result Analysis Modal */}
      {showAnalysisModal && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal-content analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Detailed Result Analysis</h3>
              <button className="modal-close" onClick={() => setShowAnalysisModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Achievements Section */}
              <div className="analysis-section">
                <h4>🏆 Achievements Earned</h4>
                <div className="achievements-grid">
                  {getAchievements().map((achievement, index) => (
                    <div key={index} className="achievement-card">
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-info">
                        <h5>{achievement.title}</h5>
                        <p>{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Section */}
              <div className="analysis-section">
                <h4>🎖️ Badges Unlocked</h4>
                <div className="badges-grid">
                  {getBadges().map((badge, index) => (
                    <div key={index} className="badge-card" style={{ backgroundColor: badge.color }}>
                      <div className="badge-icon">{badge.icon}</div>
                      <span className="badge-name">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="analysis-section">
                <h4>📈 Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <h5>🔥 Max Streak</h5>
                    <p>{getStreakAnalysis().maxStreak} consecutive correct</p>
                  </div>
                  <div className="metric-card">
                    <h5>⚡ Average Time</h5>
                    <p>{Math.floor((settings.timeLimit - quizData.timeLeft) / questions.length)}s per question</p>
                  </div>
                  <div className="metric-card">
                    <h5>🎯 Success Rate</h5>
                    <p>{getScorePercentage().toFixed(1)}%</p>
                  </div>
                  <div className="metric-card">
                    <h5>⏱️ Time Efficiency</h5>
                    <p>{Math.round((quizData.timeLeft / settings.timeLimit) * 100)}% time remaining</p>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Analysis */}
              <div className="analysis-section">
                <h4>❓ Question Analysis</h4>
                <div className="questions-analysis">
                  {getQuestionAnalysis().map((q, index) => (
                    <div key={index} className={`question-analysis ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="question-header">
                        <span className="question-number">Q{q.questionNumber}</span>
                        <span className={`status ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                          {q.isCorrect ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="question-details">
                        <p className="question-text">{q.question}</p>
                        <div className="answer-comparison">
                          <span className="user-answer">Your Answer: {q.userAnswer}</span>
                          {!q.isCorrect && <span className="correct-answer">Correct: {q.correctAnswer}</span>}
                        </div>
                        {q.explanation && (
                          <div className="explanation">
                            <strong>💡 Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn" onClick={() => setShowAnalysisModal(false)}>
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
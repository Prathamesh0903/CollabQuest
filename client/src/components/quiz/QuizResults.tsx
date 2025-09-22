import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Target, Clock, Brain, TrendingUp, 
  BookOpen, ExternalLink, Award, Zap, CheckCircle,
  AlertCircle, Lightbulb, BarChart3, Users, Timer
} from 'lucide-react';
import { QuizStats, UserAnswer, Question } from './types';
import './QuizResults.css';

interface QuizResultsProps {
  quizStats: QuizStats;
  timeLimit: number;
  timeLeft: number;
  isAdvanced?: boolean;
  userAnswers?: UserAnswer[];
  questions?: Question[];
  quizId?: string;
  onRetake: () => void;
  onBackToDashboard: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  quizStats,
  timeLimit,
  timeLeft,
  isAdvanced = false,
  userAnswers = [],
  questions = [],
  quizId,
  onRetake,
  onBackToDashboard
}) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'analysis' | 'resources'>('overview');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = () => {
    if (quizStats.accuracy >= 90) return { level: 'Excellent', color: '#10b981', icon: Trophy };
    if (quizStats.accuracy >= 80) return { level: 'Great', color: '#3b82f6', icon: Star };
    if (quizStats.accuracy >= 70) return { level: 'Good', color: '#f59e0b', icon: Target };
    if (quizStats.accuracy >= 60) return { level: 'Fair', color: '#f97316', icon: AlertCircle };
    return { level: 'Needs Improvement', color: '#ef4444', icon: Lightbulb };
  };

  const getPersonalizedFeedback = () => {
    const performance = getPerformanceLevel();
    const timeUsed = timeLimit * 60 - timeLeft;
    const timePerQuestion = timeUsed / quizStats.totalQuestions;

    let feedback = {
      title: '',
      message: '',
      suggestions: [] as string[]
    };

    if (performance.level === 'Excellent') {
      feedback = {
        title: 'Outstanding Performance! 🎉',
        message: 'You\'ve demonstrated exceptional understanding of the concepts. Your accuracy and speed are impressive!',
        suggestions: [
          'Consider taking on more challenging quizzes',
          'Share your knowledge with others',
          'Explore advanced topics in this subject'
        ]
      };
    } else if (performance.level === 'Great') {
      feedback = {
        title: 'Great Job! 👏',
        message: 'You have a solid understanding of the material. With a bit more practice, you\'ll reach excellence!',
        suggestions: [
          'Review the questions you missed',
          'Practice similar problems',
          'Try the quiz again to improve'
        ]
      };
    } else if (performance.level === 'Good') {
      feedback = {
        title: 'Good Effort! 💪',
        message: 'You\'re on the right track. Focus on the areas where you struggled to improve your score.',
        suggestions: [
          'Study the concepts you missed',
          'Take your time with each question',
          'Use hints when available'
        ]
      };
    } else {
      feedback = {
        title: 'Keep Learning! 📚',
        message: 'Don\'t worry, everyone learns at their own pace. Focus on understanding the fundamentals.',
        suggestions: [
          'Review basic concepts thoroughly',
          'Take notes while studying',
          'Practice regularly'
        ]
      };
    }

    // Add time-based feedback
    if (timePerQuestion < 30) {
      feedback.suggestions.push('Consider taking more time to think through each question');
    } else if (timePerQuestion > 120) {
      feedback.suggestions.push('Try to work more efficiently while maintaining accuracy');
    }

    return feedback;
  };

  const getWeakAreas = () => {
    if (!userAnswers.length || !questions.length) return [];
    
    const incorrectAnswers = userAnswers.filter(answer => !answer.isCorrect);
    const weakTags = new Map<string, number>();
    
    incorrectAnswers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.tags) {
        question.tags.forEach(tag => {
          weakTags.set(tag, (weakTags.get(tag) || 0) + 1);
        });
      }
    });
    
    return Array.from(weakTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));
  };

  const getLearningResources = () => {
    const weakAreas = getWeakAreas();
    // Subject-specific defaults
    let resources:
      Array<{ title: string; description: string; url: string; type: string; icon: any }>
      = [];

    const subject = (quizId || '').toLowerCase();

    if (subject.includes('python')) {
      resources = [
        {
          title: 'Python Documentation',
          description: 'The official Python docs for language and standard library',
          url: 'https://docs.python.org/3/',
          type: 'Documentation',
          icon: BookOpen
        },
        {
          title: 'Real Python',
          description: 'In-depth Python tutorials and guides',
          url: 'https://realpython.com/',
          type: 'Tutorial',
          icon: Lightbulb
        },
        {
          title: 'FreeCodeCamp Python',
          description: 'Interactive Python lessons and exercises',
          url: 'https://www.freecodecamp.org/news/tag/python/',
          type: 'Interactive',
          icon: Zap
        },
        {
          title: 'Python Guide',
          description: 'Comprehensive guide to Python best practices',
          url: 'https://docs.python-guide.org/',
          type: 'Reference',
          icon: ExternalLink
        }
      ];
    } else if (subject.includes('data-structures')) {
      resources = [
        {
          title: 'GeeksforGeeks Data Structures',
          description: 'Data structure concepts and problems',
          url: 'https://www.geeksforgeeks.org/data-structures/',
          type: 'Tutorial',
          icon: BookOpen
        },
        {
          title: 'Visualizer: DS & Algos',
          description: 'Interactive visualizations for data structures',
          url: 'https://visualgo.net/en',
          type: 'Interactive',
          icon: Zap
        },
        {
          title: 'Big-O Cheat Sheet',
          description: 'Complexity of common data structures and algorithms',
          url: 'https://www.bigocheatsheet.com/',
          type: 'Reference',
          icon: ExternalLink
        }
      ];
    } else if (subject.includes('algorithms')) {
      resources = [
        {
          title: 'CP-Algorithms',
          description: 'Algorithm theory and implementations',
          url: 'https://cp-algorithms.com/',
          type: 'Reference',
          icon: BookOpen
        },
        {
          title: 'LeetCode Explore',
          description: 'Guided algorithmic learning paths',
          url: 'https://leetcode.com/explore/',
          type: 'Interactive',
          icon: Zap
        },
        {
          title: 'AlgoExpert Resources',
          description: 'Curated algorithm explanations and patterns',
          url: 'https://www.algoexpert.io/data-structures/overview',
          type: 'Guide',
          icon: ExternalLink
        }
      ];
    } else if (subject.includes('web-development')) {
      resources = [
        {
          title: 'MDN Web Docs',
          description: 'HTML, CSS, and JS documentation and guides',
          url: 'https://developer.mozilla.org/en-US/docs/Learn',
          type: 'Documentation',
          icon: BookOpen
        },
        {
          title: 'Web.dev Learn',
          description: 'Best practices and modern web techniques',
          url: 'https://web.dev/learn/',
          type: 'Guide',
          icon: Lightbulb
        },
        {
          title: 'FreeCodeCamp Responsive Web Design',
          description: 'Hands-on interactive curriculum',
          url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
          type: 'Interactive',
          icon: Zap
        }
      ];
    } else if (subject.includes('system-design')) {
      resources = [
        {
          title: 'System Design Primer',
          description: 'Comprehensive system design concepts and case studies',
          url: 'https://github.com/donnemartin/system-design-primer',
          type: 'Guide',
          icon: BookOpen
        },
        {
          title: 'Grokking System Design',
          description: 'Structured system design problems and solutions',
          url: 'https://www.educative.io/courses/grokking-the-system-design-interview',
          type: 'Course',
          icon: ExternalLink
        }
      ];
    } else {
      // Default to JavaScript
      resources = [
        {
          title: 'JavaScript Fundamentals',
          description: 'Master the basics of JavaScript programming',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          type: 'Documentation',
          icon: BookOpen
        },
        {
          title: 'JavaScript.info',
          description: 'Modern JavaScript tutorial from basics to advanced topics',
          url: 'https://javascript.info/',
          type: 'Tutorial',
          icon: Lightbulb
        },
        {
          title: 'FreeCodeCamp JavaScript',
          description: 'Interactive coding challenges and projects',
          url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
          type: 'Interactive',
          icon: Zap
        },
        {
          title: 'MDN Web Docs',
          description: 'Comprehensive JavaScript reference and guides',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          type: 'Reference',
          icon: ExternalLink
        }
      ];
    }

    // Add specific resources based on weak areas
    if (weakAreas.length > 0) {
      const topWeakArea = weakAreas[0].tag.toLowerCase();
      if (topWeakArea.includes('function')) {
        resources.unshift({
          title: subject.includes('python') ? 'Python Functions' : 'JavaScript Functions Guide',
          description: subject.includes('python') ? 'Defining functions, args, kwargs, and scopes' : 'Deep dive into functions, closures, and scope',
          url: subject.includes('python') ? 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' : 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions',
          type: 'Guide',
          icon: BookOpen
        });
      } else if (topWeakArea.includes('array') || topWeakArea.includes('object') || topWeakArea.includes('list') || topWeakArea.includes('dict')) {
        resources.unshift({
          title: subject.includes('python') ? 'Python Data Structures' : 'JavaScript Data Structures',
          description: subject.includes('python') ? 'Lists, dicts, sets, and tuples' : 'Learn arrays, objects, and data manipulation',
          url: subject.includes('python') ? 'https://docs.python.org/3/tutorial/datastructures.html' : 'https://javascript.info/object',
          type: 'Tutorial',
          icon: BookOpen
        });
      }
    }

    return resources;
  };

  const performance = getPerformanceLevel();
  const feedback = getPersonalizedFeedback();
  const weakAreas = getWeakAreas();
  const learningResources = getLearningResources();
  const PerformanceIcon = performance.icon;

  return (
    <motion.div 
      className="quiz-results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="results-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="results-header">
          <motion.div 
            className="trophy-container"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <PerformanceIcon className="trophy-icon" style={{ color: performance.color }} />
          </motion.div>
          
          <motion.h1 
            className="results-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {feedback.title}
          </motion.h1>
          
          <motion.p 
            className="results-subtitle"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {feedback.message}
          </motion.p>
        </div>

        {/* Performance Overview */}
        <motion.div 
          className="performance-overview"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="main-stats">
            <div className="stat-card primary">
              <div className="stat-icon">
                <Target style={{ color: performance.color }} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{Math.round(quizStats.accuracy)}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Award />
              </div>
              <div className="stat-content">
                <div className="stat-value">{quizStats.earnedPoints}/{quizStats.totalPoints}</div>
                <div className="stat-label">Score</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Clock />
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatTime(timeLimit * 60 - timeLeft)}</div>
                <div className="stat-label">Time Used</div>
              </div>
            </div>
          </div>

          {isAdvanced && (
            <div className="advanced-stats">
              <div className="stat-item">
                <TrendingUp className="w-5 h-5" />
                <span>Max Streak: {quizStats.maxStreak}</span>
              </div>
              <div className="stat-item">
                <Brain className="w-5 h-5" />
                <span>Hints Used: {quizStats.hintsUsed}</span>
              </div>
              <div className="stat-item">
                <Zap className="w-5 h-5" />
                <span>Lives Left: {quizStats.livesRemaining}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="tab-navigation"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button 
            className={`tab-button ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button 
            className={`tab-button ${currentTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setCurrentTab('analysis')}
          >
            <Brain className="w-4 h-4" />
            Analysis
          </button>
          <button 
            className={`tab-button ${currentTab === 'resources' ? 'active' : ''}`}
            onClick={() => setCurrentTab('resources')}
          >
            <BookOpen className="w-4 h-4" />
            Resources
          </button>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentTab}
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentTab === 'overview' && (
              <div className="overview-content">
                <div className="feedback-section">
                  <h3>Personalized Feedback</h3>
                  <div className="suggestions">
                    {feedback.suggestions.map((suggestion, index) => (
                      <motion.div 
                        key={index}
                        className="suggestion-item"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{suggestion}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'analysis' && (
              <div className="analysis-content">
                {weakAreas.length > 0 ? (
                  <div className="weak-areas">
                    <h3>Areas for Improvement</h3>
                    <div className="weak-areas-list">
                      {weakAreas.map((area, index) => (
                        <motion.div 
                          key={area.tag}
                          className="weak-area-item"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <div className="weak-area-tag">{area.tag}</div>
                          <div className="weak-area-count">{area.count} missed</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="perfect-score">
                    <h3>Perfect Performance! 🎉</h3>
                    <p>You answered all questions correctly! No specific areas need improvement.</p>
                  </div>
                )}
                
                <div className="performance-insights">
                  <h3>Performance Insights</h3>
                  <div className="insights-grid">
                    <div className="insight-item">
                      <div className="insight-icon">
                        <Timer />
                      </div>
                      <div className="insight-content">
                        <div className="insight-title">Average Time per Question</div>
                        <div className="insight-value">
                          {Math.round((timeLimit * 60 - timeLeft) / quizStats.totalQuestions)}s
                        </div>
                      </div>
                    </div>
                    
                    <div className="insight-item">
                      <div className="insight-icon">
                        <TrendingUp />
                      </div>
                      <div className="insight-content">
                        <div className="insight-title">Performance Level</div>
                        <div className="insight-value" style={{ color: performance.color }}>
                          {performance.level}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'resources' && (
              <div className="resources-content">
                <h3>Recommended Learning Resources</h3>
                <div className="resources-grid">
                  {learningResources.map((resource, index) => {
                    const ResourceIcon = resource.icon;
                    return (
                      <motion.a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="resource-header">
                          <ResourceIcon className="resource-icon" />
                          <span className="resource-type">{resource.type}</span>
                        </div>
                        <h4 className="resource-title">{resource.title}</h4>
                        <p className="resource-description">{resource.description}</p>
                        <div className="resource-link">
                          <span>Visit Resource</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div 
          className="results-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button 
            className="btn-primary"
            onClick={onRetake}
          >
            <Zap className="w-4 h-4" />
            Retake Quiz
          </button>
          <button 
            className="btn-secondary"
            onClick={onBackToDashboard}
          >
            <BookOpen className="w-4 h-4" />
            Back to Quiz
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default QuizResults;

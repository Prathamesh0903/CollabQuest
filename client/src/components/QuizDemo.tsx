import React, { useState } from 'react';
import { Code, Brain, Target, BookOpen, Zap, Clock, ChevronLeft } from 'lucide-react';
import QuizConfigModal from './QuizConfigModal';
import './QuizDemo.css';

interface QuizCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
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

const demoCategories: QuizCategory[] = [
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

const QuizDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [lastConfig, setLastConfig] = useState<QuizConfig | null>(null);

  const handleCategoryClick = (category: QuizCategory) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleStartQuiz = (config: QuizConfig) => {
    setLastConfig(config);
    setShowModal(false);
    console.log('Quiz started with config:', config);
    
    // Show a simple alert with the configuration
    alert(`Quiz started!\n\nCategory: ${selectedCategory?.title}\nTime Limit: ${config.timeLimit} minutes\nQuestions: ${config.questionCount}\nDifficulty: ${config.difficulty}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="quiz-demo-container">
      <div className="demo-header">
        <h1>Professional Quiz Configuration Modal Demo</h1>
        <p>Click on any quiz category to see the professional configuration popup</p>
      </div>

      <div className="categories-grid">
        {demoCategories.map((category, index) => (
          <div
            key={category.id}
            className="category-card"
            onClick={() => handleCategoryClick(category)}
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
          </div>
        ))}
      </div>

      {lastConfig && (
        <div className="last-config">
          <h3>Last Configuration Used:</h3>
          <pre>{JSON.stringify(lastConfig, null, 2)}</pre>
        </div>
      )}

      {selectedCategory && (
        <QuizConfigModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onStart={handleStartQuiz}
          category={selectedCategory}
        />
      )}
    </div>
  );
};

export default QuizDemo;

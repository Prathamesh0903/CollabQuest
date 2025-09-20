import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen, Clock } from 'lucide-react';
import { QuizCategory } from './types';
import './QuizCategoryCard.css';

interface QuizCategoryCardProps {
  category: QuizCategory;
  index: number;
  onClick: (category: QuizCategory) => void;
}

const QuizCategoryCard: React.FC<QuizCategoryCardProps> = ({ category, index, onClick }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <motion.div
      className="category-card"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(category)}
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
  );
};

export default QuizCategoryCard;

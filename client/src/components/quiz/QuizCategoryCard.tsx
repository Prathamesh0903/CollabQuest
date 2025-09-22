import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { QuizCategory } from './types';
import './QuizCategoryCard.css';
import quizService from '../../services/quizService';

interface QuizCategoryCardProps {
  category: QuizCategory;
  index: number;
  onClick: (category: QuizCategory) => void;
}

const QuizCategoryCard: React.FC<QuizCategoryCardProps> = ({ category, index, onClick }) => {
  const isAvailable = quizService.isQuizAvailable(category.id);

  return (
    <motion.div
      className={`category-card${isAvailable ? '' : ' category-card--disabled'}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={isAvailable ? { y: -5, scale: 1.02 } : undefined}
      whileTap={isAvailable ? { scale: 0.98 } : undefined}
      onClick={() => isAvailable && onClick(category)}
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
        {!isAvailable && (
          <p className="category-unavailable">Coming soon</p>
        )}
      </div>
      
      <div className="category-arrow">
        <ChevronLeft className="w-5 h-5 rotate-180" />
      </div>
    </motion.div>
  );
};

export default QuizCategoryCard;

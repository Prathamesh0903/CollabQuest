import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { QuizCategory } from './types';
import './QuizCategoryCard.css';

interface QuizCategoryCardProps {
  category: QuizCategory;
  index: number;
  onClick: (category: QuizCategory) => void;
}

const QuizCategoryCard: React.FC<QuizCategoryCardProps> = ({ category, index, onClick }) => {

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
        
      </div>
      
      <div className="category-arrow">
        <ChevronLeft className="w-5 h-5 rotate-180" />
      </div>
    </motion.div>
  );
};

export default QuizCategoryCard;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import './MatchingQuestion.css';

interface MatchingQuestionProps {
  question: string;
  options: string[] | Array<{
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer: string[];
  answers: string[];
  showExplanation: boolean;
  onAnswerChange: (answers: string[]) => void;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  options,
  correctAnswer,
  answers,
  showExplanation,
  onAnswerChange
}) => {
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  const [matches, setMatches] = useState<{[key: number]: number}>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);

  useEffect(() => {
    // Convert options to string array if needed
    const optionStrings = options.map(option => 
      typeof option === 'string' ? option : option.text
    );
    
    // Split options into left and right items
    const midPoint = Math.ceil(optionStrings.length / 2);
    setLeftItems(optionStrings.slice(0, midPoint));
    setRightItems(optionStrings.slice(midPoint));
  }, [options]);

  useEffect(() => {
    // Initialize matches from answers
    if (answers.length > 0) {
      const newMatches: {[key: number]: number} = {};
      answers.forEach((answer, index) => {
        if (answer && answer.trim() !== '') {
          const rightIndex = rightItems.findIndex(item => item === answer);
          if (rightIndex !== -1) {
            newMatches[index] = rightIndex;
          }
        }
      });
      setMatches(newMatches);
    }
  }, [answers, rightItems]);

  const handleLeftItemClick = (leftIndex: number) => {
    if (showExplanation) return;

    if (selectedLeft === leftIndex) {
      setSelectedLeft(null);
    } else if (selectedRight !== null) {
      // Create match
      const newMatches = { ...matches, [leftIndex]: selectedRight };
      setMatches(newMatches);
      
      // Update answers
      const newAnswers = [...answers];
      newAnswers[leftIndex] = rightItems[selectedRight];
      onAnswerChange(newAnswers);
      
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedLeft(leftIndex);
    }
  };

  const handleRightItemClick = (rightIndex: number) => {
    if (showExplanation) return;

    if (selectedRight === rightIndex) {
      setSelectedRight(null);
    } else if (selectedLeft !== null) {
      // Create match
      const newMatches = { ...matches, [selectedLeft]: rightIndex };
      setMatches(newMatches);
      
      // Update answers
      const newAnswers = [...answers];
      newAnswers[selectedLeft] = rightItems[rightIndex];
      onAnswerChange(newAnswers);
      
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedRight(rightIndex);
    }
  };

  const removeMatch = (leftIndex: number) => {
    if (showExplanation) return;

    const newMatches = { ...matches };
    delete newMatches[leftIndex];
    setMatches(newMatches);
    
    const newAnswers = [...answers];
    newAnswers[leftIndex] = '';
    onAnswerChange(newAnswers);
  };

  const isCorrectMatch = (leftIndex: number, rightIndex: number) => {
    if (!showExplanation) return false;
    
    const leftItem = leftItems[leftIndex];
    const rightItem = rightItems[rightIndex];
    const correctRightItem = correctAnswer[leftIndex];
    
    return rightItem === correctRightItem;
  };

  const isIncorrectMatch = (leftIndex: number, rightIndex: number) => {
    if (!showExplanation) return false;
    
    const rightItem = rightItems[rightIndex];
    const correctRightItem = correctAnswer[leftIndex];
    
    return rightItem !== correctRightItem && matches[leftIndex] === rightIndex;
  };

  return (
    <div className="matching-container">
      <div className="matching-grid">
        {/* Left Column */}
        <div className="matching-column">
          <h4 className="column-title">Items</h4>
          {leftItems.map((item, index) => (
            <motion.div
              key={index}
              className={`matching-item left-item ${
                selectedLeft === index ? 'selected' : ''
              } ${
                showExplanation && matches[index] !== undefined
                  ? isCorrectMatch(index, matches[index])
                    ? 'correct'
                    : 'incorrect'
                  : ''
              }`}
              onClick={() => handleLeftItemClick(index)}
              whileHover={{ scale: showExplanation ? 1 : 1.02 }}
              whileTap={{ scale: showExplanation ? 1 : 0.98 }}
            >
              <span className="item-text">{item}</span>
              {matches[index] !== undefined && (
                <div className="match-indicator">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
              {showExplanation && matches[index] !== undefined && (
                <div className="explanation-icon">
                  {isCorrectMatch(index, matches[index]) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Right Column */}
        <div className="matching-column">
          <h4 className="column-title">Matches</h4>
          {rightItems.map((item, index) => (
            <motion.div
              key={index}
              className={`matching-item right-item ${
                selectedRight === index ? 'selected' : ''
              }`}
              onClick={() => handleRightItemClick(index)}
              whileHover={{ scale: showExplanation ? 1 : 1.02 }}
              whileTap={{ scale: showExplanation ? 1 : 0.98 }}
            >
              <span className="item-text">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="matching-instructions">
        <p>
          {showExplanation 
            ? 'Review your matches below. Green indicates correct matches, red indicates incorrect ones.'
            : 'Click on an item from the left column, then click on its match from the right column.'
          }
        </p>
      </div>
    </div>
  );
};

export default MatchingQuestion;
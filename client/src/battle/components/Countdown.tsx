import React, { useState, useEffect } from 'react';

interface CountdownProps {
  initialCount: number;
  onComplete?: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ 
  initialCount, 
  onComplete 
}) => {
  const [count, setCount] = useState(initialCount);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);
    }
  }, [count, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="countdown-overlay">
      <div className="countdown-container">
        <div className={`countdown-number ${count === 0 ? 'go' : ''}`}>
          {count === 0 ? 'GO!' : count}
        </div>
        {count > 0 && (
          <div className="countdown-label">
            Battle starts in...
          </div>
        )}
      </div>
    </div>
  );
};



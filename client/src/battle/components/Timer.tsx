import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  isActive?: boolean;
}

export const Timer: React.FC<TimerProps> = ({ 
  duration, 
  onTimeUp, 
  isActive = false 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const getColorClass = (): string => {
    const percentage = (timeLeft / duration) * 100;
    if (percentage > 50) return 'text-green-500';
    if (percentage > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="timer-container">
      <div className={`timer-display ${getColorClass()}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
    </div>
  );
};



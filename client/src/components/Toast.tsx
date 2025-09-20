import React, { useState, useEffect } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return '#2ed573';
      case 'error': return '#ff4757';
      case 'warning': return '#ffa502';
      case 'info': return '#3742fa';
      default: return '#3742fa';
    }
  };

  return (
    <div 
      className={`toast ${type}`}
      style={{
        borderLeftColor: getColor(),
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="toast-header">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-title">{title}</span>
        <button 
          className="toast-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300);
          }}
        >
          ×
        </button>
      </div>
      <div className="toast-message">{message}</div>
    </div>
  );
};

export default Toast;
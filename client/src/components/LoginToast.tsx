import React, { useEffect, useState } from 'react';
import './LoginToast.css';

export interface LoginToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

const LoginToast: React.FC<LoginToastProps> = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Show toast
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto hide toast
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`login-toast ${type} ${isVisible ? 'show' : ''} ${isLeaving ? 'leaving' : ''}`}>
      <div className="login-toast-content">
        <span className="login-toast-icon">{getIcon()}</span>
        <span className="login-toast-message">{message}</span>
        <button className="login-toast-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default LoginToast;

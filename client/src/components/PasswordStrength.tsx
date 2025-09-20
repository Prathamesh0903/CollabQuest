import React from 'react';
import './PasswordStrength.css';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    if (score <= 2) return { strength: 'weak', color: '#ef4444', percentage: 25 };
    if (score <= 3) return { strength: 'fair', color: '#f59e0b', percentage: 50 };
    if (score <= 4) return { strength: 'good', color: '#3b82f6', percentage: 75 };
    return { strength: 'strong', color: '#10b981', percentage: 100 };
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'Weak';
      case 'fair':
        return 'Fair';
      case 'good':
        return 'Good';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  };

  if (!password) return null;

  const { strength, color, percentage } = getPasswordStrength(password);

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div 
          className="strength-fill" 
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color 
          }}
        />
      </div>
      <span className="strength-text" style={{ color }}>
        {getStrengthText(strength)}
      </span>
    </div>
  );
};

export default PasswordStrength;

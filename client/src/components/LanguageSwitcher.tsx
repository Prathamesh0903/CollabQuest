import React from 'react';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  currentLanguage: 'javascript' | 'python';
  onLanguageChange: (language: 'javascript' | 'python') => void;
  disabled?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  disabled = false
}) => {
  const languages = [
    {
      id: 'javascript' as const,
      name: 'JavaScript',
      icon: '⚡',
      description: 'Node.js Runtime'
    },
    {
      id: 'python' as const,
      name: 'Python',
      icon: '🐍',
      description: 'Python 3.10'
    }
  ];

  return (
    <div className="language-switcher">
      <div className="language-switcher-label">Language:</div>
      <div className="language-options">
        {languages.map((lang) => (
          <button
            key={lang.id}
            className={`language-option ${currentLanguage === lang.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onLanguageChange(lang.id)}
            disabled={disabled}
            title={`${lang.name} - ${lang.description}`}
          >
            <span className="language-icon">{lang.icon}</span>
            <span className="language-name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher; 
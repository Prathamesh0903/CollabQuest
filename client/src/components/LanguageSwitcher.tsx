import React from 'react';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps<T extends string = string> {
  currentLanguage: T;
  onLanguageChange: (language: T) => void;
  disabled?: boolean;
}

const LanguageSwitcher = <T extends string = string>({
  currentLanguage,
  onLanguageChange,
  disabled = false
}: LanguageSwitcherProps<T>) => {
  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '📄' },
    { value: 'typescript', label: 'TypeScript', icon: '📘' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' },
    { value: 'csharp', label: 'C#', icon: '🔷' },
    { value: 'go', label: 'Go', icon: '🐹' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
    { value: 'php', label: 'PHP', icon: '🐘' },
    { value: 'ruby', label: 'Ruby', icon: '💎' }
  ];

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as T;
    onLanguageChange(newLanguage);
  };

  const currentLang = languages.find(lang => lang.value === currentLanguage) || languages[0];

  return (
    <div className="language-switcher">
      <div className="language-icon">{currentLang.icon}</div>
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        disabled={disabled}
        className="language-select"
      >
        {languages.map((language) => (
          <option key={language.value} value={language.value}>
            {language.icon} {language.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 
import React, { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import './LanguageSwitcherDemo.css';

const LanguageSwitcherDemo: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'javascript' | 'python'>('javascript');
  const [isConnected, setIsConnected] = useState(true);

  const handleLanguageChange = (language: 'javascript' | 'python') => {
    setCurrentLanguage(language);
    console.log(`Language changed to: ${language}`);
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
  };

  return (
    <div className="language-switcher-demo">
      <h2>Language Switcher Demo</h2>
      
      <div className="demo-controls">
        <button 
          onClick={toggleConnection}
          className={`connection-toggle ${isConnected ? 'connected' : 'disconnected'}`}
        >
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </button>
      </div>

      <div className="demo-section">
        <h3>Language Switcher Component</h3>
        <LanguageSwitcher
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          disabled={!isConnected}
        />
      </div>

      <div className="demo-info">
        <h3>Current State</h3>
        <p><strong>Language:</strong> {currentLanguage}</p>
        <p><strong>Connection:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
        <p><strong>Status:</strong> {isConnected ? 'Ready to switch' : 'Disabled (disconnected)'}</p>
      </div>

      <div className="demo-features">
        <h3>Features</h3>
        <ul>
          <li>✅ Switch between JavaScript and Python</li>
          <li>✅ Visual feedback for active language</li>
          <li>✅ Disabled state when disconnected</li>
          <li>✅ Responsive design</li>
          <li>✅ Hover effects and animations</li>
          <li>✅ Tooltips with language descriptions</li>
        </ul>
      </div>
    </div>
  );
};

export default LanguageSwitcherDemo; 
import React from 'react';
import { Zap, Pause, Target, Lightbulb } from 'lucide-react';
import { PowerUps as PowerUpsType } from './types';
import './PowerUps.css';

interface PowerUpsProps {
  powerUps: PowerUpsType;
  onPowerUp: (type: keyof PowerUpsType) => void;
}

const PowerUps: React.FC<PowerUpsProps> = ({ powerUps, onPowerUp }) => {
  const getPowerUpIcon = (type: keyof PowerUpsType) => {
    switch (type) {
      case 'skipQuestion':
        return <Zap className="w-4 h-4" />;
      case 'timeFreeze':
        return <Pause className="w-4 h-4" />;
      case 'fiftyFifty':
        return <Target className="w-4 h-4" />;
      case 'hint':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPowerUpTitle = (type: keyof PowerUpsType) => {
    const titles = {
      skipQuestion: 'Skip Question',
      timeFreeze: 'Time Freeze',
      fiftyFifty: '50/50',
      hint: 'Hint'
    };
    return titles[type];
  };

  return (
    <div className="power-ups-container">
      {Object.entries(powerUps).map(([type, count]) => (
        <button
          key={type}
          className={`power-up-btn ${count > 0 ? 'available' : 'disabled'}`}
          onClick={() => onPowerUp(type as keyof PowerUpsType)}
          disabled={count <= 0}
          title={`${getPowerUpTitle(type as keyof PowerUpsType)} (${count} left)`}
        >
          {getPowerUpIcon(type as keyof PowerUpsType)}
          <span className="power-up-count">{count}</span>
        </button>
      ))}
    </div>
  );
};

export default PowerUps;

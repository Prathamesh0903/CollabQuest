import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Sword } from 'lucide-react';
import './BattleLobby.css';
import BattleFormModal, { BattleFormData } from './BattleFormModal';
import RoomInfoModal from './RoomInfoModal';
import { useNavigate } from 'react-router-dom';

const mockActiveBattles = () => Math.floor(Math.random() * 100) + 20;

const battleModes = [
  {
    key: 'solo',
    title: 'Solo Duel',
    desc: '1v1 head-to-head coding battle.',
    icon: <Sword size={36} color="#f59e42" />,
    color: 'var(--solo-color, #f59e42)'
  },
  {
    key: 'team',
    title: 'Team Clash',
    desc: '2v2 to 5v5 team battles.',
    icon: <Users size={36} color="#4e9af1" />,
    color: 'var(--team-color, #4e9af1)'
  },
  {
    key: 'tournament',
    title: 'Tournament',
    desc: 'Bracket system for ultimate glory.',
    icon: <Trophy size={36} color="#eab308" />,
    color: 'var(--tournament-color, #eab308)'
  }
];

const BattleLobby: React.FC = () => {
  const [activeBattles, setActiveBattles] = useState(mockActiveBattles());
  const [showModal, setShowModal] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ roomCode: string; password: string; sharableLink: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBattles(mockActiveBattles());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate API call
  const handleBattleSubmit = async (data: BattleFormData) => {
    // Simulate backend response
    setTimeout(() => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const password = Math.random().toString(36).substring(2, 8);
      const sharableLink = `${window.location.origin}/battle-room/${roomCode}`;
      setRoomInfo({ roomCode, password, sharableLink });
      setShowRoomInfo(true);
    }, 1000);
  };

  const handleCloseRoomInfo = () => {
    setShowRoomInfo(false);
    setRoomInfo(null);
  };

  const handleStartBattle = () => {
    if (roomInfo?.roomCode) {
      navigate(`/battle-room/${roomInfo.roomCode}`);
    }
    setShowRoomInfo(false);
  };

  return (
    <div className="battle-lobby-container">
      <BattleFormModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleBattleSubmit} />
      <RoomInfoModal
        open={showRoomInfo && !!roomInfo}
        onClose={handleCloseRoomInfo}
        roomCode={roomInfo?.roomCode || ''}
        password={roomInfo?.password || ''}
        sharableLink={roomInfo?.sharableLink || ''}
        isHost={true}
        onStartBattle={handleStartBattle}
      />
      <motion.section
        className="battle-hero-section"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="battle-hero-title">
          Enter the <span className="battle-glow">Battle Arena</span>
        </h1>
        <p className="battle-hero-desc">
          Compete, collaborate, and conquer coding challenges in real time!
        </p>
        <motion.button
          className="join-battle-btn"
          whileHover={{ scale: 1.08, boxShadow: '0 0 16px 4px #f59e42' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
        >
          Join Battle
        </motion.button>
        <div className="active-battles-counter">
          <span className="counter-label">Active Battles:</span>
          <motion.span
            className="counter-value"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {activeBattles}
          </motion.span>
        </div>
      </motion.section>
      <div className="battle-modes-cards">
        {battleModes.map((mode, idx) => (
          <motion.div
            key={mode.key}
            className="battle-mode-card"
            style={{ borderColor: mode.color }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + idx * 0.15 }}
            whileHover={{ scale: 1.06, boxShadow: `0 0 16px 2px ${mode.color}` }}
          >
            <div className="battle-mode-icon">{mode.icon}</div>
            <div className="battle-mode-title">{mode.title}</div>
            <div className="battle-mode-desc">{mode.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BattleLobby; 
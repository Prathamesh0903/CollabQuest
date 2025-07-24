import React, { useState } from 'react';
import Navbar from './Dashboard/Navbar';
import MainContent from './Dashboard/MainContent';
import RoomModal from './Dashboard/RoomModal';
import './Dashboard/Navbar.css';
import './Dashboard.css';

interface DashboardProps {
  onRoomSuccess?: (roomId: string, language: 'javascript' | 'python') => void;
  onStartQuiz?: () => void; 
  onStartDemo?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onRoomSuccess, onStartQuiz, onStartDemo }) => {
  const [modalType, setModalType] = useState<null | 'create' | 'join'>(null);

  const handleModalOpen = (type: 'create' | 'join') => setModalType(type);
  const handleCloseModal = () => setModalType(null);

  const handleRoomSubmit = (roomId: string, password: string, roomMode?: 'battle' | 'collab', language?: 'javascript' | 'python') => {
    if (onRoomSuccess && language) {
      onRoomSuccess(roomId, language);
    }
    handleCloseModal();
  };

  return (
    <div className="dashboard-container dashboard-no-sidebar">
      <Navbar />
      <div className="dashboard-main-area dashboard-main-area-nosidebar leetcode-main-content">
        <MainContent 
          onStartCoding={() => handleModalOpen('join')} 
          onStartQuiz={onStartQuiz} 
          onStartDemo={onStartDemo} 
        />
      </div>
      {modalType && (
        <RoomModal
          type={modalType}
          onClose={handleCloseModal}
          onSubmit={handleRoomSubmit}
        />
      )}
    </div>
  );
};

export default Dashboard;
 
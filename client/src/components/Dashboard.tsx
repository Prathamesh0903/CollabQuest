import React from 'react';
import Navbar from './Dashboard/Navbar';
import MainContent from './Dashboard/MainContent';
import './Dashboard/Navbar.css';
import './Dashboard.css';

interface DashboardProps {
  onRoomSuccess?: (roomId: string, language: 'javascript' | 'python') => void;
  onStartQuiz?: () => void; 
  onStartDemo?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onRoomSuccess, onStartQuiz, onStartDemo }) => {

  return (
    <div className="dashboard-container dashboard-no-sidebar">
      <Navbar />
      <div className="dashboard-main-area dashboard-main-area-nosidebar leetcode-main-content">
        <MainContent 
          onStartQuiz={onStartQuiz} 
          onStartDemo={onStartDemo} 
          onRoomSuccess={onRoomSuccess}
        />
      </div>
    </div>
  );
};

export default Dashboard;
 
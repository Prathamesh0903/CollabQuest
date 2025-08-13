import React from 'react';
import Navbar from './Dashboard/Navbar';
import MainContent from './Dashboard/MainContent';
import './Dashboard/Navbar.css';
import './Dashboard.css';

interface DashboardProps {
  onSessionSuccess?: (sessionId: string, language: 'javascript' | 'python') => void;
  onStartDemo?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSessionSuccess, onStartDemo }) => {

  return (
    <div className="dashboard-container dashboard-no-sidebar">
      <Navbar />
      <div className="dashboard-main-area dashboard-main-area-nosidebar leetcode-main-content">
        <MainContent 
          onStartDemo={onStartDemo} 
          onSessionSuccess={onSessionSuccess}
        />
      </div>
    </div>
  );
};

export default Dashboard;
 
import React from 'react';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { useNavigate } from 'react-router-dom';

interface MainContentProps {
  onStartQuiz?: () => void;
  onStartDemo?: () => void;
  onRoomSuccess?: (roomId: string, language: 'javascript' | 'python') => void;
}

const featureCards = [
  {
    key: 'collab-editor',
    icon: '🤝',
    title: 'Collaborative Editor',
    desc: 'Code together in real-time with live cursors, chat, and instant sync.',
    button: 'Start Coding',
    animationClass: 'card-animate-collab',
  },
  {
    key: 'battle-mode',
    icon: '⚔️',
    title: 'Battle Mode',
    desc: 'Compete in timed coding battles. Climb the leaderboard!',
    button: 'Start Battle',
    animationClass: 'card-animate-battle',
  },
  {
    key: 'quizzes',
    icon: '❓',
    title: 'Quizzes',
    desc: 'Test your skills with coding quizzes and get instant feedback.',
    button: 'Take a Quiz',
    animationClass: 'card-animate-quiz',
  },
  {
    key: 'Hackathons',
    icon: '👥',
    title: 'Hackathons',
    desc: 'Join teams for collaborative or competitive coding.',
    button: 'Join a Team',
    animationClass: 'card-animate-team',
    isUpcoming: true,
  },
  {
    key: 'Weekly Contest',
    icon: '🚀',
    title: 'Weekly Contest',
    desc: 'Try the interactive demo and get started in minutes.',
    button: 'Start Demo',
    animationClass: 'card-animate-demo',
    isUpcoming: true,
  },
  {
    key: 'results',
    icon: '🎉',
    title: 'Achievements',
    desc: 'See your results, badges, and progress.',
    button: 'View Results',
    animationClass: 'card-animate-results',
  }
];

const MainContent: React.FC<MainContentProps> = ({ onStartQuiz, onStartDemo, onRoomSuccess }) => {
  const navigate = useNavigate();

  

  const handleStartBattle = () => {
    navigate('/battle-lobby');
  };

  return (
    <main className="dashboard-main-content">
      <section className="hero-section">
        <div>
          <h1>
            <Typewriter
              words={["Build Together, Code Better"]}
              loop={1}
              cursor
              cursorStyle='|'
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
            />
          </h1>
          <p className="hero-lead">
            Experience real-time collaborative coding with AI-powered assistance.
            Join forces with developers worldwide and elevate your coding journey.
          </p>
        </div>
      </section>

      <section className="features-grid">
        {featureCards.map((card, idx) => (
          <motion.div
            key={card.key}
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <div className="feature-icon">{card.icon}</div>
            <h3 className="feature-title">{card.title}</h3>
            {card.isUpcoming && <span className="upcoming-badge">Upcoming</span>}
            <p className="feature-desc">{card.desc}</p>
            <button 
              className="action-button"
              onClick={() => {
                if (card.button === 'Start Coding') onRoomSuccess?.('new-session', 'javascript');
                else if (card.button === 'Take a Quiz') onStartQuiz?.();
                else if (card.button === 'Start Demo') onStartDemo?.();
                else if (card.button === 'Start Battle') handleStartBattle();
              }}
            >
              {card.button}
            </button>
          </motion.div>
        ))}
      </section>

      <footer className="dashboard-footer">
        © {new Date().getFullYear()} Collab Quest &mdash; Level up together. All rights reserved.
      </footer>
    </main>
  );
};

export default MainContent;
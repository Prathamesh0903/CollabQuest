import React from 'react';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import SpaceParticles from '../SpaceParticles';
import EnhancedContent from './EnhancedContent';

interface MainContentProps {
  onStartDemo?: () => void;
  onSessionSuccess?: (sessionId: string, language: 'javascript' | 'python') => void;
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
    key: 'quizzes',
    icon: '🚀',
    title: 'Advanced Quizzes',
    desc: 'Challenge yourself with advanced questions, power-ups, and real-time feedback.',
    button: 'Take a Quiz',
    animationClass: 'card-animate-advanced-quiz',
  },
  {
    key: 'results',
    icon: '🎉',
    title: 'DSA Sheet',
    desc: 'Practice DSA questions and get interview ready',
    button: 'Start Prep',
    animationClass: 'card-animate-results',
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
    key: 'battle-mode',
    icon: '⚔️',
    title: 'Battle Mode',
    desc: 'Compete in timed coding battles. Climb the leaderboard!',
    button: 'Start Battle',
    animationClass: 'card-animate-battle',
    isUpcoming: true,
  },
  {
    key: 'Weekly Contest',
    icon: '🚀',
    title: 'Weekly Contest',
    desc: 'Join the weekly contest and climb the leaderboard.',
    button: 'Explore Contest',
    animationClass: 'card-animate-demo',
  }
 
];

const MainContent: React.FC<MainContentProps> = ({ onStartDemo, onSessionSuccess }) => {
  const navigate = useNavigate();

  // Generate a unique session ID
  const generateSessionId = (): string => {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  };

  const handleStartBattle = () => {
    console.log('Start Battle button clicked - navigating to /battle');
    window.location.href = '/battle';
  };

  return (
    <main className="dashboard-main-content">
      <SpaceParticles />
      
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
                console.log('Button clicked:', card.button);
                if (card.button === 'Start Coding') {
                  const sessionId = generateSessionId();
                  onSessionSuccess?.(sessionId, 'javascript');
                }
                else if (card.button === 'Take a Quiz') {
                  window.location.href = '/advanced-quiz';
                }
                else if (card.button === 'Start Demo') onStartDemo?.();
              else if (card.button === 'Explore Contest') {
                navigate('/contests');
              }
                else if (card.button === 'Start Battle') {
                  console.log('Start Battle condition met');
                  handleStartBattle();
                }
                else if (card.button === 'Start Prep') {
                  navigate('/dsa-sheet');
                }
              }}
            >
              {card.button}
            </button>
          </motion.div>
        ))}
      </section>

      <EnhancedContent />

      <Footer />
    </main>
  );
};

export default MainContent;
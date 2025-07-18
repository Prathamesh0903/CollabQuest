import React, { useRef, useState, useEffect } from 'react';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { useNavigate } from 'react-router-dom';

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
  },
  {
    key: 'Weekly Contest',
    icon: '🚀',
    title: 'Weekly Contest',
    desc: 'Try the interactive demo and get started in minutes.',
    button: 'Start Demo',
    animationClass: 'card-animate-demo',
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

const MainContent: React.FC<{ onStartCoding: () => void; onStartQuiz?: () => void; onStartDemo?: () => void }> = ({ onStartCoding, onStartQuiz, onStartDemo }) => {
  const navigate = useNavigate();
  const cardsSectionRef = useRef<HTMLDivElement>(null);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShowCards(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (cardsSectionRef.current) {
      observer.observe(cardsSectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleStartBattle = () => {
    navigate('/battle-lobby');
  };

  return (
    <main className="dashboard-main-content leetcode-main-content scrollable-dashboard">
      <section className="dashboard-hero-section leetcode-hero-section">
        <div className="leetcode-hero-left">
          <h1>
            <Typewriter
              words={["Welcome to Collab Quest"]}
              loop={1}
              cursor
              cursorStyle='|'
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
            />
          </h1>
          <p className="hero-lead">Level up your coding skills. Collaborate, compete, and grow—together.</p>
        </div>
      </section>
      <section className="dashboard-onboarding-section leetcode-onboarding-section">
        <h2>How to Get Started</h2>
        <ol className="onboarding-steps">
          <li>Sign up or log in to your account</li>
          <li>Create or join a room for coding or battle</li>
          <li>Invite friends or teammates to join you</li>
          <li>Start coding, competing, and earning achievements!</li>
        </ol>
        <div className="onboarding-tip">💡 <b>Pro Tip:</b> Try both Battle and Collaborative modes for different experiences!</div>
      </section>
      <section className="dashboard-cards-section leetcode-cards-section">
        <h2 className="section-title">Explore Features</h2>
        <div
          className={`leetcode-cards-grid${showCards ? ' cards-visible' : ' cards-hidden'}`}
          ref={cardsSectionRef}
        >
          {featureCards.map((card, idx) => (
            <motion.div
              key={card.key}
              className={`service-card leetcode-card ${card.animationClass}`}
              initial={{ opacity: 0, y: 40 }}
              animate={showCards ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: showCards ? idx * 0.15 : 0 }}
            >
              <div className="card-icon">{card.icon}</div>
              <div className="card-title">{card.title}</div>
              <div className="card-desc">{card.desc}</div>
              <div className="leetcode-card-btn-row">
                {card.button === 'Start Coding' ? (
                  <button className="card-btn leetcode-card-btn" onClick={onStartCoding}>{card.button}</button>
                ) : card.button === 'Take a Quiz' ? (
                  <button className="card-btn leetcode-card-btn" onClick={onStartQuiz}>{card.button}</button>
                ) : card.button === 'Start Demo' ? (
                  <button className="card-btn leetcode-card-btn" onClick={onStartDemo}>{card.button}</button>
                ) : card.button === 'Start Battle' ? (
                  <button className="card-btn leetcode-card-btn" onClick={handleStartBattle}>{card.button}</button>
                ) : (
                  <button className="card-btn leetcode-card-btn">{card.button}</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <footer className="dashboard-footer">
        © {new Date().getFullYear()} Collab Quest &mdash; Level up together. All rights reserved.
      </footer>
    </main>
  );
};

export default MainContent;

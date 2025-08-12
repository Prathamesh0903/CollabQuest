import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '👥',
      title: 'Real-time Collaboration',
      description: 'Code together with teammates in real-time with live cursor tracking and instant synchronization.'
    },
    {
      icon: '🏆',
      title: 'Gamified Learning',
      description: 'Earn points, climb leaderboards, and compete with friends through interactive coding challenges.'
    },
    {
      icon: '🧠',
      title: 'Interactive Quizzes',
      description: 'Test your knowledge with dynamic quizzes covering various programming concepts and languages.'
    },
    {
      icon: '🏠',
      title: 'Virtual Rooms',
      description: 'Create and join virtual coding rooms for focused collaboration and team building.'
    },
    {
      icon: '💬',
      title: 'Live Communication',
      description: 'Chat with teammates, share ideas, and discuss solutions in real-time.'
    },
    {
      icon: '⚡',
      title: 'Code Execution',
      description: 'Run and test your code instantly with our integrated code execution environment.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Active Users' },
    { number: '500+', label: 'Coding Sessions' },
    { number: '50+', label: 'Programming Languages' },
    { number: '24/7', label: 'Platform Availability' }
  ];

  const techStack = [
    { name: 'React.js', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Socket.io', category: 'Real-time' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Firebase', category: 'Authentication' },
    { name: 'TypeScript', category: 'Language' }
  ];

  return (
    <div className={`about-container ${isVisible ? 'visible' : ''}`}>
      {/* Navigation Header */}
      <header className="about-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </header>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="highlight">Collab Quest</span>
          </h1>
          <p className="hero-subtitle">
            Build Together, Code Better
          </p>
          <p className="hero-description">
            Experience real-time collaborative coding with AI-powered assistance. Join forces with developers worldwide and elevate your coding journey.
          </p>
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
                 <div className="hero-visual">
           <div className="floating-elements">
             <div className="floating-element">💻</div>
             <div className="floating-element">🚀</div>
             <div className="floating-element">🎯</div>
             <div className="floating-element">⚡</div>
             <div className="floating-element">🔧</div>
             <div className="floating-element">🎨</div>
             <div className="floating-element">📱</div>
             <div className="floating-element">🌐</div>
           </div>
           <div className="particles">
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
             <div className="particle"></div>
           </div>
         </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Collab Quest?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${activeSection === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveSection(index)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <h2 className="section-title">Our Mission</h2>
          <p className="mission-text">
            At Collab Quest, we believe that the best learning happens through collaboration. 
            Our platform bridges the gap between individual coding practice and real-world 
            team development by providing an immersive, gamified environment where developers 
            can learn, compete, and grow together.
          </p>
          <div className="mission-values">
            <div className="value-item">
              <h4>Innovation</h4>
              <p>Pushing the boundaries of collaborative learning</p>
            </div>
            <div className="value-item">
              <h4>Community</h4>
              <p>Building strong connections between developers</p>
            </div>
            <div className="value-item">
              <h4>Excellence</h4>
              <p>Delivering the best collaborative coding experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <h2 className="section-title">Built with Modern Technology</h2>
        <div className="tech-grid">
          {techStack.map((tech, index) => (
            <div key={index} className="tech-card">
              <div className="tech-category">{tech.category}</div>
              <div className="tech-name">{tech.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Coding Journey?</h2>
          <p>Join thousands of developers who are already collaborating, learning, and competing on Collab Quest.</p>
          <button className="cta-button" onClick={() => navigate('/')}>Get Started Now</button>
        </div>
      </section>
    </div>
  );
};

export default About;

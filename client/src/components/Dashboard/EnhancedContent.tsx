import React from 'react';
import { motion } from 'framer-motion';
import './EnhancedContent.css';

const EnhancedContent: React.FC = () => {

  const features = [
    {
      icon: '⚡',
      title: 'Real-time Collaboration',
      description: 'Code together with live cursors, instant sync, and seamless teamwork.',
      benefits: ['Live cursors', 'Instant sync', 'Team chat', 'Version control']
    },
    {
      icon: '🏆',
      title: 'Competitive Coding',
      description: 'Compete in battles, climb leaderboards, and prove your skills.',
      benefits: ['Timed challenges', 'Leaderboards', 'Skill tracking', 'Achievements']
    },
    {
      icon: '📚',
      title: 'Learning Resources',
      description: 'Access comprehensive DSA sheets, tutorials, and practice problems.',
      benefits: ['DSA sheets', 'Video tutorials', 'Practice problems', 'Progress tracking']
    }
  ];

  const testimonials = [
    {
      name: 'Pratik Patil',
      role: 'Student',
      company: 'DYPCET Kolhapur',
      content: 'Collaborative coding on Collab Quest is a game changer. Real-time pair programming feels seamless and boosts productivity.',
      avatar: '👨‍💼'
    },
    {
      name: 'Vipul Raj',
      role: 'Student',
      company: 'DYPCET Kolhapur',
      content: 'The quizzes are engaging and insightful. They helped me track progress and systematically improve week over week.',
      avatar: '👨‍💻'
    },
    {
      name: 'Saurabh Karande',
      role: 'Student',
      company: 'DYPCET Kolhapur',
      content: 'DSA Sheets are curated and practical. Great structure for interview prep with clear problem progression.',
      avatar: '👨‍🎓'
    }
  ];

  return (
    <div className="enhanced-content">
      

      {/* Features Deep Dive */}
      <section className="features-deep-dive">
        <motion.div 
          className="features-container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Why Choose Collab Quest?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-deep-card"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large">{feature.icon}</div>
                <h3 className="feature-title-large">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <ul className="feature-benefits">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="benefit-item">
                      <span className="benefit-check">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <motion.div 
          className="testimonials-container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">What Developers Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="testimonial-content">
                  <p className="testimonial-text">"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    <p className="author-role">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <motion.div 
          className="cta-container"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="cta-title">Ready to Transform Your Coding Experience?</h2>
          <p className="cta-description">
            Join thousands of developers who are already collaborating, competing, and growing together on Collab Quest.
          </p>
          <div className="cta-buttons">
            <motion.button 
              className="cta-button primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
                window.location.href = `/collab?session=${sessionId}`;
              }}
            >
              Start Coding Now
            </motion.button>
            <motion.button 
              className="cta-button secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Trigger demo mode
                const event = new CustomEvent('startDemo');
                window.dispatchEvent(event);
              }}
            >
              Watch Demo
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default EnhancedContent;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './DSASheet.css';
import { API_BASE } from '../../utils/api';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  isCompleted: boolean;
  url: string;
  description?: string;
}

interface Topic {
  id: string;
  name: string;
  problems: Problem[];
  isExpanded: boolean;
  description?: string;
}

const DSASheet: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Load problems with user progress from API and group by category
  useEffect(() => {
    const load = async () => {
      try {
        // Load problems with user progress
        const res = await fetch(`${API_BASE}/dsa/progress?limit=500`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json.problems) ? json.problems : [];
        
        const byCategory: Record<string, Topic> = {};
        for (const p of items) {
          const catName = p?.category?.name || 'Misc';
          const topicId = (p?.category?._id as string) || catName.toLowerCase().replace(/\s+/g, '-');
          if (!byCategory[topicId]) {
            byCategory[topicId] = {
              id: topicId,
              name: catName,
              isExpanded: true,
              problems: []
            } as Topic;
          }
          byCategory[topicId].problems.push({
            id: p._id,
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags || [],
            isCompleted: p.isCompleted || false,
            url: `/dsa-sheet/problem/${p._id}`
          } as Problem);
        }
        setTopics(Object.values(byCategory));
      } catch (e) {
        console.error('Error loading DSA problems with progress:', e);
        // Fallback to loading problems without progress
        try {
          const res = await fetch(`${API_BASE}/dsa/problems?limit=500`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const items = Array.isArray(json.items) ? json.items : [];
          const byCategory: Record<string, Topic> = {};
          for (const p of items) {
            const catName = p?.category?.name || 'Misc';
            const topicId = (p?.category?._id as string) || catName.toLowerCase().replace(/\s+/g, '-');
            if (!byCategory[topicId]) {
              byCategory[topicId] = {
                id: topicId,
                name: catName,
                isExpanded: true,
                problems: []
              } as Topic;
            }
            byCategory[topicId].problems.push({
              id: p._id,
              title: p.title,
              difficulty: p.difficulty,
              tags: p.tags || [],
              isCompleted: false,
              url: `/dsa-sheet/problem/${p._id}`
            } as Problem);
          }
          setTopics(Object.values(byCategory));
        } catch (fallbackError) {
          console.error('Error loading DSA problems (fallback):', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Only load if user is authenticated
    if (currentUser) {
      load();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const toggleTopic = (topicId: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, isExpanded: !topic.isExpanded } 
        : topic
    ));
  };

  const toggleProblemStatus = async (topicId: string, problemId: string) => {
    // Check if user is authenticated
    if (!currentUser) {
      alert('Please log in to track your progress');
      return;
    }

    // Find the current problem to get its current status
    const currentProblem = topics
      .find(topic => topic.id === topicId)
      ?.problems.find(problem => problem.id === problemId);
    
    if (!currentProblem) return;

    const newCompletionStatus = !currentProblem.isCompleted;

    // Optimistically update UI
    setTopics(topics.map(topic => {
      if (topic.id !== topicId) return topic;
      
      return {
        ...topic,
        problems: topic.problems.map(problem => 
          problem.id === problemId 
            ? { ...problem, isCompleted: newCompletionStatus } 
            : problem
        )
      };
    }));

    // Save to backend
    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${API_BASE}/dsa/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId,
          isCompleted: newCompletionStatus
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Progress save error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
      
      // Revert UI changes on error
      setTopics(topics.map(topic => {
        if (topic.id !== topicId) return topic;
        
        return {
          ...topic,
          problems: topic.problems.map(problem => 
            problem.id === problemId 
              ? { ...problem, isCompleted: currentProblem.isCompleted } 
              : problem
          )
        };
      }));
      
      alert('Failed to save progress. Please try again.');
    }
  };

  const filteredTopics = topics.map(topic => ({
    ...topic,
    problems: topic.problems.filter(problem => 
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (difficultyFilter === 'All' || problem.difficulty === difficultyFilter)
    )
  })).filter(topic => topic.problems.length > 0);

  const totalProblems = topics.reduce(
    (sum, topic) => sum + topic.problems.length, 0
  );
  const completedProblems = topics.reduce(
    (sum, topic) => sum + topic.problems.filter(p => p.isCompleted).length, 0
  );
  const progress = totalProblems > 0 
    ? Math.round((completedProblems / totalProblems) * 100) 
    : 0;

  if (loading) {
    return <div className="loading">Loading DSA Practice Sheet...</div>;
  }

  // Show login prompt for unauthenticated users
  if (!currentUser) {
    return (
      <div className="dsa-sheet">
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: '#212121',
          borderRadius: '10px',
          margin: '2rem auto',
          maxWidth: '600px'
        }}>
          <h2 style={{ color: '#ececec', marginBottom: '1rem' }}>
            🔐 Login Required
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Please log in to track your DSA practice progress and save your completion status.
          </p>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: '#007acc',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#005a9e'}
            onMouseOut={(e) => e.currentTarget.style.background = '#007acc'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dsa-sheet">
      <header className="dsa-header">
        <h1>DSA Practice Sheet</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Master Data Structures and Algorithms with our comprehensive practice problems
        </p>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {completedProblems} / {totalProblems} problems solved ({progress}%)
          </span>
        </div>
      </header>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search problems by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="search-icon">🔍</i>
        </div>
        
        <select
          className="difficulty-filter"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className="topics-list">
        {filteredTopics.map((topic) => (
          <div key={topic.id} className="topic">
            <div 
              className="topic-header"
              onClick={() => toggleTopic(topic.id)}
            >
              <div>
                <h3>
                  {topic.name}
                  <span className="dsa-badge" style={{ marginLeft: 8 }}>{topic.problems.length}</span>
                </h3>
                {topic.description && (
                  <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    fontSize: '0.9rem', 
                    color: 'rgba(255, 255, 255, 0.6)' 
                  }}>
                    {topic.description}
                  </p>
                )}
              </div>
              <span className="toggle-icon">
                {topic.isExpanded ? '−' : '+'}
              </span>
            </div>
            
            {topic.isExpanded && (
              <div className="problems-list">
                {topic.problems.map((problem) => (
                  <div 
                    key={problem.id} 
                    className={`problem-card ${problem.isCompleted ? 'completed' : ''}`}
                  >
                    <div className="problem-main">
                      <input
                        type="checkbox"
                        checked={problem.isCompleted}
                        onChange={() => toggleProblemStatus(topic.id, problem.id)}
                        className="problem-checkbox"
                      />
                      <div 
                        className="problem-title"
                        onClick={() => navigate(problem.url)}
                      >
                        {problem.title}
                        {problem.description && (
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            marginTop: '0.25rem',
                            fontWeight: 'normal'
                          }}>
                            {problem.description}
                          </div>
                        )}
                      </div>
                      <div className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                      </div>
                    </div>
                    <div className="problem-tags">
                      {problem.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DSASheet;

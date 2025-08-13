import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './DSASheet.css';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  isCompleted: boolean;
  url: string;
}

interface Topic {
  id: string;
  name: string;
  problems: Problem[];
  isExpanded: boolean;
}

const DSASheet: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with API call
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // TODO: Replace with actual API call
        const mockTopics: Topic[] = [
          {
            id: 'arrays',
            name: 'Arrays',
            isExpanded: true,
            problems: [
              {
                id: 'two-sum',
                title: 'Two Sum',
                difficulty: 'Easy',
                tags: ['Array', 'Hash Table'],
                isCompleted: false,
                url: '/problem/two-sum'
              },
              {
                id: 'best-time-to-buy-and-sell-stock',
                title: 'Best Time to Buy and Sell Stock',
                difficulty: 'Easy',
                tags: ['Array', 'Dynamic Programming'],
                isCompleted: false,
                url: '/problem/best-time-to-buy-and-sell-stock'
              }
            ]
          },
          {
            id: 'strings',
            name: 'Strings',
            isExpanded: false,
            problems: [
              {
                id: 'valid-anagram',
                title: 'Valid Anagram',
                difficulty: 'Easy',
                tags: ['String', 'Hash Table', 'Sorting'],
                isCompleted: false,
                url: '/problem/valid-anagram'
              }
            ]
          }
        ];
        
        setTopics(mockTopics);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching DSA sheet:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleTopic = (topicId: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, isExpanded: !topic.isExpanded } 
        : topic
    ));
  };

  const toggleProblemStatus = (topicId: string, problemId: string) => {
    setTopics(topics.map(topic => {
      if (topic.id !== topicId) return topic;
      
      return {
        ...topic,
        problems: topic.problems.map(problem => 
          problem.id === problemId 
            ? { ...problem, isCompleted: !problem.isCompleted } 
            : problem
        )
      };
    }));
    
    // TODO: Call API to update problem status
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
    return <div className="loading">Loading DSA Sheet...</div>;
  }

  return (
    <div className="dsa-sheet">
      <header className="dsa-header">
        <h1>DSA Practice Sheet</h1>
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
            placeholder="Search problems..."
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
              <h3>{topic.name}</h3>
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

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

  // Enhanced mock data - replace with API call
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // TODO: Replace with actual API call
        const mockTopics: Topic[] = [
          {
            id: 'arrays',
            name: 'Arrays',
            description: 'Master array manipulation and algorithms',
            isExpanded: true,
            problems: [
              {
                id: 'two-sum',
                title: 'Two Sum',
                difficulty: 'Easy',
                tags: ['Array', 'Hash Table'],
                isCompleted: false,
                url: '/problem/two-sum',
                description: 'Find two numbers that add up to a target'
              },
              {
                id: 'best-time-to-buy-and-sell-stock',
                title: 'Best Time to Buy and Sell Stock',
                difficulty: 'Easy',
                tags: ['Array', 'Dynamic Programming'],
                isCompleted: false,
                url: '/problem/best-time-to-buy-and-sell-stock',
                description: 'Find the maximum profit from buying and selling'
              },
              {
                id: 'contains-duplicate',
                title: 'Contains Duplicate',
                difficulty: 'Easy',
                tags: ['Array', 'Hash Table'],
                isCompleted: false,
                url: '/problem/contains-duplicate',
                description: 'Check if array contains any duplicates'
              },
              {
                id: 'product-of-array-except-self',
                title: 'Product of Array Except Self',
                difficulty: 'Medium',
                tags: ['Array', 'Prefix Sum'],
                isCompleted: false,
                url: '/problem/product-of-array-except-self',
                description: 'Calculate product of array except current element'
              },
              {
                id: 'maximum-subarray',
                title: 'Maximum Subarray',
                difficulty: 'Medium',
                tags: ['Array', 'Dynamic Programming'],
                isCompleted: false,
                url: '/problem/maximum-subarray',
                description: 'Find the contiguous subarray with maximum sum'
              }
            ]
          },
          {
            id: 'strings',
            name: 'Strings',
            description: 'String manipulation and pattern matching',
            isExpanded: false,
            problems: [
              {
                id: 'valid-anagram',
                title: 'Valid Anagram',
                difficulty: 'Easy',
                tags: ['String', 'Hash Table', 'Sorting'],
                isCompleted: false,
                url: '/problem/valid-anagram',
                description: 'Check if two strings are anagrams'
              },
              {
                id: 'longest-substring-without-repeating-characters',
                title: 'Longest Substring Without Repeating Characters',
                difficulty: 'Medium',
                tags: ['String', 'Sliding Window', 'Hash Table'],
                isCompleted: false,
                url: '/problem/longest-substring-without-repeating-characters',
                description: 'Find longest substring with unique characters'
              },
              {
                id: 'palindrome-number',
                title: 'Palindrome Number',
                difficulty: 'Easy',
                tags: ['String', 'Math'],
                isCompleted: false,
                url: '/problem/palindrome-number',
                description: 'Check if a number is a palindrome'
              }
            ]
          },
          {
            id: 'linked-lists',
            name: 'Linked Lists',
            description: 'Linked list operations and algorithms',
            isExpanded: false,
            problems: [
              {
                id: 'reverse-linked-list',
                title: 'Reverse Linked List',
                difficulty: 'Easy',
                tags: ['Linked List', 'Recursion'],
                isCompleted: false,
                url: '/problem/reverse-linked-list',
                description: 'Reverse a singly linked list'
              },
              {
                id: 'detect-cycle',
                title: 'Linked List Cycle',
                difficulty: 'Easy',
                tags: ['Linked List', 'Two Pointers'],
                isCompleted: false,
                url: '/problem/linked-list-cycle',
                description: 'Detect if linked list has a cycle'
              },
              {
                id: 'merge-two-sorted-lists',
                title: 'Merge Two Sorted Lists',
                difficulty: 'Easy',
                tags: ['Linked List', 'Recursion'],
                isCompleted: false,
                url: '/problem/merge-two-sorted-lists',
                description: 'Merge two sorted linked lists'
              }
            ]
          },
          {
            id: 'trees',
            name: 'Trees',
            description: 'Binary trees and tree traversal',
            isExpanded: false,
            problems: [
              {
                id: 'maximum-depth-of-binary-tree',
                title: 'Maximum Depth of Binary Tree',
                difficulty: 'Easy',
                tags: ['Tree', 'DFS', 'Recursion'],
                isCompleted: false,
                url: '/problem/maximum-depth-of-binary-tree',
                description: 'Find the maximum depth of a binary tree'
              },
              {
                id: 'validate-binary-search-tree',
                title: 'Validate Binary Search Tree',
                difficulty: 'Medium',
                tags: ['Tree', 'DFS', 'Recursion'],
                isCompleted: false,
                url: '/problem/validate-binary-search-tree',
                description: 'Check if binary tree is a valid BST'
              },
              {
                id: 'invert-binary-tree',
                title: 'Invert Binary Tree',
                difficulty: 'Easy',
                tags: ['Tree', 'DFS', 'Recursion'],
                isCompleted: false,
                url: '/problem/invert-binary-tree',
                description: 'Invert a binary tree'
              }
            ]
          },
          {
            id: 'dynamic-programming',
            name: 'Dynamic Programming',
            description: 'Optimization problems and memoization',
            isExpanded: false,
            problems: [
              {
                id: 'climbing-stairs',
                title: 'Climbing Stairs',
                difficulty: 'Easy',
                tags: ['Dynamic Programming', 'Math'],
                isCompleted: false,
                url: '/problem/climbing-stairs',
                description: 'Find ways to climb n stairs'
              },
              {
                id: 'house-robber',
                title: 'House Robber',
                difficulty: 'Medium',
                tags: ['Dynamic Programming'],
                isCompleted: false,
                url: '/problem/house-robber',
                description: 'Rob houses for maximum profit'
              },
              {
                id: 'coin-change',
                title: 'Coin Change',
                difficulty: 'Medium',
                tags: ['Dynamic Programming'],
                isCompleted: false,
                url: '/problem/coin-change',
                description: 'Find minimum coins needed for amount'
              }
            ]
          },
          {
            id: 'graphs',
            name: 'Graphs',
            description: 'Graph algorithms and traversal',
            isExpanded: false,
            problems: [
              {
                id: 'number-of-islands',
                title: 'Number of Islands',
                difficulty: 'Medium',
                tags: ['Graph', 'DFS', 'BFS'],
                isCompleted: false,
                url: '/problem/number-of-islands',
                description: 'Count number of islands in grid'
              },
              {
                id: 'course-schedule',
                title: 'Course Schedule',
                difficulty: 'Medium',
                tags: ['Graph', 'Topological Sort', 'DFS'],
                isCompleted: false,
                url: '/problem/course-schedule',
                description: 'Check if course schedule is possible'
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
    return <div className="loading">Loading DSA Practice Sheet...</div>;
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
                <h3>{topic.name}</h3>
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

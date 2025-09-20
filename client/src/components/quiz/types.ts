import React from 'react';

export interface QuizProps {
  onComplete?: (score: number, totalQuestions: number) => void;
  onClose?: () => void;
  isAdvanced?: boolean;
}

export interface QuizCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // in minutes
}

export interface QuizConfig {
  timeLimit: number;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'coding' | 'matching' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number | string[] | boolean;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  codeSnippet?: string;
  language?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

export interface UserAnswer {
  questionId: string;
  answer: string | number | string[] | boolean;
  timeSpent: number;
  isCorrect: boolean;
  points: number;
}

export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  accuracy: number;
  averageTime: number;
  timeRemaining: number;
  streak: number;
  maxStreak: number;
  difficulty: string;
  hintsUsed: number;
  livesRemaining: number;
}

export interface PowerUps {
  skipQuestion: number;
  timeFreeze: number;
  fiftyFifty: number;
  hint: number;
}

// Default Quiz Configuration
export const defaultQuizConfig: QuizConfig = {
  timeLimit: 20,
  questionCount: 10,
  difficulty: 'Medium'
};

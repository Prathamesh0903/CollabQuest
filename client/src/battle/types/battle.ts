export type BattleSession = {
  sessionId: string;
  name: string;
  host: string;
  maxParticipants: number;
  state: 'waiting' | 'lobby' | 'countdown' | 'active' | 'ended';
  settings: {
    countdown: number;
    duration: number;
    problem?: {
      id?: string;
      title?: string;
      description?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      functionSignature?: string;
      examples?: { input: string; output: string }[];
      testCases?: { input: string; expected: string; hidden?: boolean }[];
    };
  };
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
};

export type BattleParticipant = {
  sessionId: string;
  userId: string;
  username: string;
  avatar?: string;
  isHost?: boolean;
  isReady?: boolean;
  isConnected?: boolean;
  joinedAt?: string;
  leftAt?: string | null;
  finalSubmission?: {
    code?: string;
    submittedAt?: string;
    executionResult?: {
      success?: boolean;
      output?: string;
      error?: string;
      executionTime?: number;
      testsPassed?: number;
      totalTests?: number;
      score?: number;
    };
  };
};

// Alias used by Redux slice imports
export type Participant = BattleParticipant;

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  score: number;
  submissionTime?: string;
  testsPassed?: number;
};

export type BattleState = {
  currentBattle: BattleSession | null;
  participants: BattleParticipant[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  leaderboard: LeaderboardEntry[];
  countdown?: number;
  submissionResult?: {
    executionResult: unknown;
    score: { total: number; breakdown: Record<string, number> };
  } | null;
};

export type BattleAction =
  | { type: 'SET_BATTLE'; payload: BattleSession | null }
  | { type: 'UPDATE_PARTICIPANTS'; payload: BattleParticipant[] }
  | { type: 'ADD_PARTICIPANT'; payload: BattleParticipant }
  | { type: 'UPDATE_READY_STATUS'; payload: { userId: string; isReady: boolean } }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_LEADERBOARD'; payload: LeaderboardEntry[] }
  | { type: 'START_COUNTDOWN'; payload: number }
  | { type: 'COUNTDOWN_TICK'; payload: number }
  | { type: 'START_BATTLE'; payload: { duration: number } }
  | { type: 'SET_SUBMISSION_RESULT'; payload: { executionResult: unknown; score: { total: number; breakdown: Record<string, number> } } };



// Plain reducer fallback without Redux Toolkit to avoid dependency issues
import { BattleSession, Participant, LeaderboardEntry } from '../types/battle';

export interface BattleState {
  currentSession: BattleSession | null;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  battleStatus: 'waiting' | 'lobby' | 'countdown' | 'active' | 'ended';
}

const initialState: BattleState = {
  currentSession: null,
  participants: [],
  leaderboard: [],
  connectionStatus: 'disconnected',
  battleStatus: 'waiting'
};

type Actions =
  | { type: 'battle/setBattleSession'; payload: BattleSession }
  | { type: 'battle/updateParticipants'; payload: Participant[] }
  | { type: 'battle/updateLeaderboard'; payload: LeaderboardEntry[] }
  | { type: 'battle/setConnectionStatus'; payload: 'connected' | 'disconnected' | 'connecting' }
  | { type: 'battle/setBattleStatus'; payload: 'waiting' | 'lobby' | 'countdown' | 'active' | 'ended' };

export const setBattleSession = (payload: BattleSession): Actions => ({ type: 'battle/setBattleSession', payload });
export const updateParticipants = (payload: Participant[]): Actions => ({ type: 'battle/updateParticipants', payload });
export const updateLeaderboard = (payload: LeaderboardEntry[]): Actions => ({ type: 'battle/updateLeaderboard', payload });
export const setConnectionStatus = (payload: 'connected' | 'disconnected' | 'connecting'): Actions => ({ type: 'battle/setConnectionStatus', payload });
export const setBattleStatus = (payload: 'waiting' | 'lobby' | 'countdown' | 'active' | 'ended'): Actions => ({ type: 'battle/setBattleStatus', payload });

export default function battleReducer(state: BattleState = initialState, action: Actions): BattleState {
  switch (action.type) {
    case 'battle/setBattleSession':
      return { ...state, currentSession: action.payload };
    case 'battle/updateParticipants':
      return { ...state, participants: action.payload };
    case 'battle/updateLeaderboard':
      return { ...state, leaderboard: action.payload };
    case 'battle/setConnectionStatus':
      return { ...state, connectionStatus: action.payload };
    case 'battle/setBattleStatus':
      return { ...state, battleStatus: action.payload };
    default:
      return state;
  }
}



import React, { createContext, useContext, useReducer } from 'react';
import { BattleState, BattleAction } from '../types/battle';

const initialState: BattleState = {
  currentBattle: null,
  participants: [],
  isConnected: false,
  isLoading: false,
  error: null,
  leaderboard: [],
  countdown: undefined,
  submissionResult: null
};

const BattleContext = createContext<{
  state: BattleState;
  dispatch: React.Dispatch<BattleAction>;
} | null>(null);

function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'SET_BATTLE':
      return { ...state, currentBattle: action.payload, isLoading: false };
    
    case 'UPDATE_PARTICIPANTS':
      return { ...state, participants: action.payload };
    
    case 'ADD_PARTICIPANT':
      return { ...state, participants: [...state.participants, action.payload] };
    
    case 'UPDATE_READY_STATUS':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.userId === action.payload.userId ? { ...p, isReady: action.payload.isReady } : p
        )
      };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'UPDATE_LEADERBOARD':
      return { ...state, leaderboard: action.payload };
    
    case 'START_COUNTDOWN':
      return { ...state, countdown: action.payload };
    
    case 'COUNTDOWN_TICK':
      return { ...state, countdown: action.payload };
    
    case 'START_BATTLE':
      return { ...state, currentBattle: state.currentBattle ? { ...state.currentBattle, state: 'active' } : null };
    
    case 'SET_SUBMISSION_RESULT':
      return { ...state, submissionResult: action.payload };
    
    default:
      return state;
  }
}

export const BattleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(battleReducer, initialState);
  
  return (
    <BattleContext.Provider value={{ state, dispatch }}>
      {children}
    </BattleContext.Provider>
  );
};

export const useBattleContext = () => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattleContext must be used within BattleProvider');
  }
  return context;
};



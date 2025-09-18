export const BATTLE_STATES = {
  WAITING: 'waiting',
  LOBBY: 'lobby', 
  COUNTDOWN: 'countdown',
  ACTIVE: 'active',
  ENDED: 'ended'
} as const;

export const SOCKET_EVENTS = {
  LOBBY_JOIN: 'lobby:join',
  LOBBY_READY_TOGGLE: 'lobby:ready-toggle',
  LOBBY_START_BATTLE: 'lobby:start-battle',
  BATTLE_SUBMIT_CODE: 'battle:submit-code'
} as const;

export const PROBLEM_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium', 
  HARD: 'hard'
} as const;



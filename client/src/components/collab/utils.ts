export function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substr(2, 9);
}




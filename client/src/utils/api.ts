// Simple API base resolver for dev/prod
// - Honors REACT_APP_API_BASE if provided
// - In CRA dev on port 3000 without a proxy, default to http://localhost:5001/api
// - Otherwise fallback to /api for same-origin setups

const inferDevBase = (): string => {
  if (typeof window !== 'undefined') {
    const isDev = process.env.NODE_ENV === 'development';
    const isCRADev = window.location && window.location.port === '3000';
    if (isDev && isCRADev) {
      return 'http://localhost:5001/api';
    }
  }
  return '/api';
};

export const API_BASE: string = (process.env.REACT_APP_API_BASE as string) || 
  (process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : inferDevBase());



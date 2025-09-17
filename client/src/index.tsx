import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import reportWebVitals from './reportWebVitals';
import { auth } from './firebase';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Global fetch wrapper to attach Firebase ID token to API requests
// Minimal and non-invasive: adds Authorization header for /api and configured API origins
(function installAuthenticatedFetchWrapper() {
  const originalFetch = window.fetch.bind(window);

  const apiOrigins = [
    process.env.REACT_APP_API_URL || 'http://localhost:5001',
    process.env.REACT_APP_API_BASE || ''
  ].filter(Boolean);

  function shouldAttachAuth(urlString: string): boolean {
    try {
      if (urlString.startsWith('/api')) return true;
      const url = new URL(urlString);
      return apiOrigins.some(origin => origin && url.origin === origin);
    } catch {
      // Non-absolute URL; treat as relative
      return urlString.startsWith('/api');
    }
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    let headers = new Headers(init?.headers || (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined));

    if (shouldAttachAuth(urlString)) {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch (e) {
        // Silently ignore token fetch errors; proceed unauthenticated
      }
    }

    const finalInit: RequestInit = { ...init, headers };
    return originalFetch(input as any, finalInit);
  };
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import reportWebVitals from './reportWebVitals';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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

// Global fetch wrapper to attach Supabase JWT token to API requests
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
        // Check if Supabase is properly configured
        if (isSupabaseConfigured() && supabase && supabase.auth) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase auth error:', error.message);
          } else if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
          }
        } else {
          // Supabase not configured, proceed without authentication
          console.debug('Supabase not configured, proceeding without authentication for:', urlString);
        }
      } catch (e) {
        // Silently ignore token fetch errors; proceed unauthenticated
        console.warn('Failed to get Supabase session:', e);
      }
    }

    const finalInit: RequestInit = { ...init, headers };
    
    try {
      const response = await originalFetch(input as any, finalInit);
      
      // Log 403 errors for debugging
      if (response.status === 403) {
        console.warn(`403 Forbidden for ${urlString}:`, {
          url: urlString,
          hasAuth: headers.has('Authorization'),
          status: response.status
        });
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };
})();

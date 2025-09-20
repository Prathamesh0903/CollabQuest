import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import './AuthCallback.css';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling OAuth callback...');
        
        // Get the URL hash and search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log('Hash params:', Object.fromEntries(hashParams));
        console.log('Search params:', Object.fromEntries(searchParams));
        
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(`Authentication failed: ${error.message}`);
          setLoading(false);
          return;
        }

        console.log('Session data:', data);

        if (data.session) {
          console.log('Authentication successful, redirecting to home...');
          // Authentication successful, redirect to home
          navigate('/', { replace: true });
        } else {
          console.log('No session found, checking for auth state change...');
          
          // Listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session);
            if (event === 'SIGNED_IN' && session) {
              navigate('/', { replace: true });
            } else if (event === 'SIGNED_OUT') {
              navigate('/auth', { replace: true });
            }
          });
          
          // Cleanup subscription after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            if (!data.session) {
              setError('Authentication timeout. Please try again.');
              setLoading(false);
            }
          }, 10000);
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred during authentication');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-content">
          <LoadingSpinner size="large" color="#4285F4" />
          <h2>Completing authentication...</h2>
          <p>Please wait while we complete your sign-in process.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-content error">
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;

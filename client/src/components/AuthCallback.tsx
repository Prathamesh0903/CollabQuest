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
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          // Authentication successful, redirect to home
          navigate('/', { replace: true });
        } else {
          // No session found, redirect to login
          navigate('/login', { replace: true });
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

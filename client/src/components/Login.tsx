import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginToast, { LoginToastProps } from './LoginToast';
import PasswordStrength from './PasswordStrength';
import LoadingSpinner from './LoadingSpinner';
import SpaceParticles from './SpaceParticles';
import './Login.css';

const Login: React.FC = () => {
  const { signInWithGoogle, signInWithDiscord, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [toast, setToast] = useState<LoginToastProps | null>(null);

  const showToast = (message: string, type: LoginToastProps['type']) => {
    setToast({ message, type, onClose: () => setToast(null) });
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast('Redirecting to Google...', 'info');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in with Google';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithDiscord();
      showToast('Redirecting to Discord...', 'info');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in with Discord';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        await signUpWithEmail(email, password);
        showToast('Account created! Please check your email to verify your account.', 'success');
      } else {
        await signInWithEmail(email, password);
        showToast('Welcome back!', 'success');
      }
    } catch (error: any) {
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the verification link';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast('Please enter your email address first', 'warning');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      showToast('Password reset email sent! Check your inbox.', 'success');
      setShowForgotPassword(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset email';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <SpaceParticles />
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <div className="app-logo">⚡</div>
            <h1>CollabQuest</h1>
          </div>
          <p className="subtitle">Join the ultimate coding collaboration platform</p>
        </div>
        
        <div className="login-content">
          {/* Demo Credentials Section */}
          <div className="demo-credentials">
            <h3>Demo Credentials</h3>
            <div className="credentials-info">
              <p><strong>Email:</strong> user@gmail.com</p>
              <p><strong>Password:</strong> teamcollab</p>
              <button
                type="button"
                className="demo-btn"
                onClick={() => {
                  setEmail('user@gmail.com');
                  setPassword('teamcollab');
                  setIsSignup(false);
                }}
                disabled={loading}
              >
                Use Demo Credentials
              </button>
            </div>
          </div>
          
          <form onSubmit={handleEmailAuth} className="login-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="login-input"
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="login-input"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                disabled={loading}
              />
              {isSignup && <PasswordStrength password={password} />}
            </div>
            
            {!isSignup && (
              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="small" color="white" />
                  Please wait...
                </>
              ) : (
                isSignup ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
          
          <div className="divider">
            <span>or continue with</span>
          </div>
          
          <div className="oauth-buttons">
            <button 
              className="oauth-btn google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" color="#4285F4" />
              ) : (
                <svg className="oauth-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google
            </button>
            
            <button 
              className="oauth-btn discord-btn"
              onClick={handleDiscordSignIn}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" color="#5865F2" />
              ) : (
                <svg className="oauth-icon" viewBox="0 0 24 24" fill="#5865F2">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              )}
              Discord
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <p className="toggle-text">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              className="toggle-link"
              onClick={() => setIsSignup(s => !s)}
              disabled={loading}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
          <p className="terms-text">
            By continuing, you agree to our <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="login-input"
                disabled={loading}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForgotPassword(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <LoginToast
          message={toast.message}
          type={toast.type}
          onClose={toast.onClose}
        />
      )}
    </div>
  );
};

export default Login; 
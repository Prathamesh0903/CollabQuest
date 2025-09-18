import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { observeAuth, emailPasswordSignIn, signOutUser, getCurrentIdToken } from '../firebase';

interface AuthContextValue {
  user: { uid: string; email?: string | null; displayName?: string | null } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = observeAuth(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName });
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (e: any) {
        setError(e?.message || 'Auth error');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await emailPasswordSignIn(email, password);
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setToken(null);
    } catch (e: any) {
      setError(e?.message || 'Sign-out failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const t = await getCurrentIdToken();
      setToken(t);
    } catch (e: any) {
      setError(e?.message || 'Token refresh failed');
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ user, token, loading, error, signIn, signOut, refreshToken }), [user, token, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

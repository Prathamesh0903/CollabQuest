import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY as string,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.REACT_APP_FIREBASE_APP_ID as string,
};

// Validate required config in development
if (process.env.NODE_ENV !== 'production') {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error('Missing Firebase config keys:', missing.join(', '));
  }
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const observeAuth = (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback);
export const emailPasswordSignIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const signOutUser = () => signOut(auth);

export const getCurrentIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

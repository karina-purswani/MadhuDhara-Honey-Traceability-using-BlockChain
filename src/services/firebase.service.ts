/**
 * Honey Chain - Firebase Client Service
 * Configures Firebase Client SDK and initializes Firebase Authentication.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  ? (import.meta as any).env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Auth/Firestore:', error);
  }
} else {
  console.warn(
    'Firebase environment variables (VITE_FIREBASE_*) are not fully configured. Running in degraded auth mode.'
  );
}

export { app, auth, db };

/**
 * Maps Firebase Auth error codes into standardized translation keys.
 */
export function mapFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'auth.errInvalidCredential';
    case 'auth/user-not-found':
      return 'auth.errNotFound';
    case 'auth/email-already-in-use':
      return 'auth.errAccountExists';
    case 'auth/weak-password':
      return 'auth.errWeakPassword';
    case 'auth/invalid-email':
      return 'auth.errInvalidEmail';
    case 'auth/too-many-requests':
      return 'auth.errTooManyRequests';
    case 'auth/network-request-failed':
      return 'auth.errNetwork';
    case 'auth/user-disabled':
      return 'auth.errUserDisabled';
    case 'auth/operation-not-allowed':
      return 'auth.errOperationNotAllowed';
    default:
      return 'auth.errGeneral';
  }
}

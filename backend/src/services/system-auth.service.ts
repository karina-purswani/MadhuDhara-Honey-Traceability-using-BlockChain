/**
 * System Authentication Service for Backend Fallback Pipeline
 * Ensures the Node.js backend environment maintains an authenticated admin session
 * to satisfy Firestore security rules (isAdmin / isAuthenticated) when querying
 * live Firestore collections via the client SDK fallback.
 */

import { auth } from '../../../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';

let authPromise: Promise<boolean> | null = null;

export async function ensureSystemAdminAuth(): Promise<boolean> {
  if (!auth) {
    return false;
  }

  // Already authenticated
  if (auth.currentUser) {
    return true;
  }

  // Prevent multiple concurrent sign-in calls
  if (authPromise) {
    return await authPromise;
  }

  authPromise = (async () => {
    try {
      const email = process.env.SYSTEM_ADMIN_EMAIL || 'admin@example.com';
      const password = process.env.SYSTEM_ADMIN_PASSWORD || 'admin123';
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`[SystemAuth] Backend system admin session initialized as ${cred.user.email}`);
      return true;
    } catch (err: any) {
      console.warn(
        '[SystemAuth] Notice: Could not initialize backend system admin session:',
        err?.message || err
      );
      return false;
    } finally {
      authPromise = null;
    }
  })();

  return await authPromise;
}

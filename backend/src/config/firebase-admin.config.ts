/**
 * Firebase Admin SDK Singleton Initialization
 * Bypasses client Firestore rules; serves as the secure backend driver for Firestore.
 * Supports service-account JSON path, environment credentials, or default project credentials.
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { envConfig } from './env.config';

function initFirebaseAdmin(): App {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const { projectId, serviceAccountKeyPath, clientEmail, privateKey } = envConfig.firebase;

  try {
    // Strategy 1: Explicit Service Account JSON File Path
    if (serviceAccountKeyPath) {
      const resolvedPath = path.isAbsolute(serviceAccountKeyPath)
        ? serviceAccountKeyPath
        : path.resolve(process.cwd(), serviceAccountKeyPath);

      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);

        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
        console.log('[FirebaseAdmin] Initialized successfully using service account JSON file.');
        return app;
      } else if (serviceAccountKeyPath.trim().startsWith('{')) {
        // Raw JSON string in variable
        const serviceAccount = JSON.parse(serviceAccountKeyPath);
        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
        console.log('[FirebaseAdmin] Initialized successfully using JSON string in environment.');
        return app;
      }
    }

    // Strategy 2: Client Email & Private Key in Environment
    if (clientEmail && privateKey) {
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log('[FirebaseAdmin] Initialized successfully using environment credentials.');
      return app;
    }

    // Strategy 3: Default Application Credentials / Project ID Fallback
    const app = initializeApp({
      projectId,
    });
    console.log(
      `[FirebaseAdmin] Initialized in default mode with project ID: ${projectId}. (Backend foundation mode)`
    );
    return app;
  } catch (error: any) {
    console.warn(
      `[FirebaseAdmin] Warning during initialization: ${error?.message || error}. Proceeding with default instance.`
    );
    const fallbackApps = getApps();
    if (fallbackApps.length > 0 && fallbackApps[0]) {
      return fallbackApps[0];
    }
    return initializeApp({ projectId });
  }
}

export const hasAdminCredentials: boolean = Boolean(
  (envConfig.firebase.serviceAccountKeyPath &&
    (fs.existsSync(
      path.isAbsolute(envConfig.firebase.serviceAccountKeyPath)
        ? envConfig.firebase.serviceAccountKeyPath
        : path.resolve(process.cwd(), envConfig.firebase.serviceAccountKeyPath)
    ) ||
      envConfig.firebase.serviceAccountKeyPath.trim().startsWith('{'))) ||
  (envConfig.firebase.clientEmail && envConfig.firebase.privateKey)
);

export const firebaseAdminApp: App = initFirebaseAdmin();
export const adminAuth: Auth = getAuth(firebaseAdminApp);
export const adminFirestore: Firestore = getFirestore(firebaseAdminApp);
export type { App, Auth, Firestore };

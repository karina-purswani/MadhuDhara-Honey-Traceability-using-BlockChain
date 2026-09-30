/**
 * Backend Environment Configuration
 * Centralized, validated environment configuration.
 * Backend-only variables are strictly maintained here and not leaked to the frontend.
 */

import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Firebase Admin Configuration (Server-Side Only)
  firebase: {
    projectId:
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'honeychain-54b0a',
    serviceAccountKeyPath: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || '',
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '',
  },
};

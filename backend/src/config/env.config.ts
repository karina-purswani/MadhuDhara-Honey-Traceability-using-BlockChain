/**
 * Backend Environment Configuration
 * Centralized, validated environment configuration.
 * Backend-only variables are strictly maintained here and not leaked to the frontend.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env first for shared VITE_FIREBASE_* configs
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();

// Override with backend/.env for server-specific credentials
const backendEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true });
}

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

/**
 * Express Application Setup
 * Configures middleware, security, routes, 404, and central error handling.
 */

import express, { Application } from 'express';
import cors from 'cors';
import { envConfig } from './config/env.config';
import { requestLogger } from './middleware/logger.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // 1. CORS Configuration (Environment-based, strictly controlled origin)
  const allowedOrigins = envConfig.corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, test scripts, mobile apps)
        if (!origin) return callback(null, true);

        // Check if origin matches allowed origins or localhost variants
        const isAllowed =
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          origin === 'http://localhost:3000' ||
          origin === 'http://127.0.0.1:3000';

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  );

  // 2. Request Parsing Middleware
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 3. Request Logging (Development/Standard logging)
  app.use(requestLogger);

  // 4. Mount Master API Router
  app.use('/api', apiRouter);

  // 5. 404 Handler (for unmatched routes)
  app.use(notFoundHandler);

  // 6. Central Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

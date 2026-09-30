/**
 * Server Entrypoint
 * Starts the Express HTTP listener on the configured port.
 */

import { app } from './app';
import { envConfig } from './config/env.config';

const PORT = envConfig.port;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  MadhuDhara API Server (Phase 3A Foundation)       `);
  console.log(`====================================================`);
  console.log(`  Environment : ${envConfig.nodeEnv}`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Base URL    : http://localhost:${PORT}/api`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  CORS Origin : ${envConfig.corsOrigin}`);
  console.log(`====================================================`);

  // Initialize background system admin session for Firestore queries
  import('./services/system-auth.service')
    .then(({ ensureSystemAdminAuth }) => ensureSystemAdminAuth())
    .catch((err) => console.warn('[Server] System auth startup check notice:', err?.message || err));
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

export default server;

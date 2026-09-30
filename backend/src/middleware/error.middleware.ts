/**
 * Central Error Handling Middleware
 * Ensures predictable JSON error envelopes and prevents leaking stack traces or internal secrets.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { envConfig } from '../config/env.config';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Sanitize internal errors so stack traces / internal secrets are never leaked
  const userSafeMessage = statusCode >= 500 && envConfig.isProduction
    ? 'An unexpected internal server error occurred.'
    : message;

  ApiResponseUtil.error(res, userSafeMessage, statusCode);
}

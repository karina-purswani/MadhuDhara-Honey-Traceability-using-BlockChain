/**
 * Lightweight Development Request Logger Middleware
 * Formats: [METHOD] /path -> Status in Xms
 */

import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color =
      status >= 500
        ? '\x1b[31m' // red
        : status >= 400
        ? '\x1b[33m' // yellow
        : status >= 300
        ? '\x1b[36m' // cyan
        : '\x1b[32m'; // green
    const reset = '\x1b[0m';

    console.log(
      `[API] ${method} ${originalUrl} -> ${color}${status}${reset} (${duration}ms)`
    );
  });

  next();
}

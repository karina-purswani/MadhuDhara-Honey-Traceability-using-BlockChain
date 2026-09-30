/**
 * 404 Not Found Middleware for API routes
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponseUtil.error(
    res,
    `API endpoint not found: ${req.method} ${req.originalUrl}`,
    404
  );
}

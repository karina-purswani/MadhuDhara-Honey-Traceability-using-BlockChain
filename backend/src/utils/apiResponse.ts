/**
 * Standard API Response Structure
 * Predictable envelope for all REST API endpoints.
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class ApiResponseUtil {
  public static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>);
  }

  public static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 500,
    errorDetails?: string
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      error: errorDetails,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }

  public static created<T>(res: Response, data?: T, message = 'Created'): Response {
    return this.success(res, data, message, 201);
  }

  public static badRequest(res: Response, message = 'Bad request'): Response {
    return this.error(res, message, 400);
  }

  public static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  public static serverError(res: Response, err: any, message = 'Internal server error'): Response {
    return this.error(res, message, 500, err?.message || String(err));
  }
}

/**
 * Health Controller
 * Public health-check endpoint for service monitoring.
 */

import { Request, Response } from 'express';

export class HealthController {
  public static check(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'MadhuDhara API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }
}

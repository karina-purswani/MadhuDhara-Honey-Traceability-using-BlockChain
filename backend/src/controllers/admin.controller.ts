/**
 * Admin Controller
 * Handles administrative REST endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { ApiResponseUtil } from '../utils/apiResponse';

export class AdminController {
  /**
   * GET /api/admin/stats
   * Returns aggregate institutional statistics for the KVIC Admin dashboard.
   */
  public static async getStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await adminService.getSystemStats();
      ApiResponseUtil.success(res, stats, 'Admin system statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

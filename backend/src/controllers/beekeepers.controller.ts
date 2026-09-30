/**
 * Beekeepers Controller
 * Handles beekeeper directory and apiary query REST endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { beekeepersService } from '../services/beekeepers.service';
import { ApiResponseUtil } from '../utils/apiResponse';

export class BeekeepersController {
  /**
   * GET /api/beekeepers
   * Returns lightweight beekeeper directory records.
   * Supports optional ?district= query filter.
   */
  public static async getDirectory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const district = typeof req.query.district === 'string' ? req.query.district : undefined;
      const beekeepers = await beekeepersService.getDirectory(district);
      ApiResponseUtil.success(
        res,
        beekeepers,
        'Beekeepers directory retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/beekeepers/:beekeeperId/apiaries
   * Returns apiaries belonging to a specific beekeeper on-demand.
   */
  public static async getApiaries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { beekeeperId } = req.params;
      if (!beekeeperId) {
        ApiResponseUtil.error(res, 'Missing required beekeeperId parameter', 400);
        return;
      }

      const apiaries = await beekeepersService.getApiariesByBeekeeper(beekeeperId);
      ApiResponseUtil.success(
        res,
        apiaries,
        'Beekeeper apiaries retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

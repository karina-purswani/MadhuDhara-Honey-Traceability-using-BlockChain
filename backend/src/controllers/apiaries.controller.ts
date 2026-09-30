/**
 * Apiaries Controller
 * Handles apiary queries and associated hive drill-down endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { apiariesService } from '../services/apiaries.service';
import { ApiResponseUtil } from '../utils/apiResponse';

export class ApiariesController {
  /**
   * GET /api/apiaries/:apiaryId/hives
   * Returns hives belonging to a specific apiary on-demand.
   */
  public static async getHives(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { apiaryId } = req.params;
      if (!apiaryId) {
        ApiResponseUtil.error(res, 'Missing required apiaryId parameter', 400);
        return;
      }

      const hives = await apiariesService.getHivesByApiary(apiaryId);
      ApiResponseUtil.success(res, hives, 'Apiary hives retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

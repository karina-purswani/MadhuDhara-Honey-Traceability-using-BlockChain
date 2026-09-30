/**
 * Hives Controller
 * Handles digital hive passport retrieval and on-demand telemetry endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { hivesService } from '../services/hives.service';
import { ApiResponseUtil } from '../utils/apiResponse';

export class HivesController {
  /**
   * GET /api/hives/:hiveId
   * Returns complete digital passport details for a selected hive (including beekeeper and apiary context).
   */
  public static async getHiveDetail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { hiveId } = req.params;
      if (!hiveId) {
        ApiResponseUtil.error(res, 'Missing required hiveId parameter', 400);
        return;
      }

      const detail = await hivesService.getHiveDetail(hiveId);
      if (!detail || !detail.hive) {
        ApiResponseUtil.error(res, `Hive with ID '${hiveId}' not found`, 404);
        return;
      }

      ApiResponseUtil.success(res, detail, 'Hive detail retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hives/:hiveId/iot/latest
   * Returns the latest simulated sensor reading for ONE selected hive.
   */
  public static async getLatestIoTReading(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { hiveId } = req.params;
      if (!hiveId) {
        ApiResponseUtil.error(res, 'Missing required hiveId parameter', 400);
        return;
      }

      const reading = await hivesService.getLatestIoTReading(hiveId);
      ApiResponseUtil.success(
        res,
        reading,
        'Latest hive sensor reading retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

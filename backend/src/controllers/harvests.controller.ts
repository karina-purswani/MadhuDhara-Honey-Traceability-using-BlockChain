/**
 * Harvests Controller
 * Handles HTTP requests for harvest records.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { harvestsService } from '../services/harvests.service';

export class HarvestsController {
  public static async getHarvests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const harvests = await harvestsService.getHarvests(req.user);
      ApiResponseUtil.success(res, harvests, 'Harvests retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve harvests');
    }
  }

  public static async getHarvestById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { harvestId } = req.params;
      const { harvest, unauthorized } = await harvestsService.getHarvestById(harvestId, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this harvest record.', 403);
        return;
      }

      if (!harvest) {
        ApiResponseUtil.notFound(res, 'Harvest record not found');
        return;
      }

      ApiResponseUtil.success(res, harvest, 'Harvest record retrieved');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve harvest');
    }
  }

  public static async createHarvest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { hiveId, apiaryId, quantityKg, floralSource, harvestDate, moisturePercentage, colorGrade, notes, batchId } = req.body;

      if (!hiveId || !apiaryId || quantityKg === undefined || !floralSource) {
        ApiResponseUtil.badRequest(res, 'Missing required fields: hiveId, apiaryId, quantityKg, floralSource');
        return;
      }

      const harvest = await harvestsService.createHarvest(
        {
          hiveId,
          apiaryId,
          quantityKg: Number(quantityKg),
          floralSource,
          harvestDate,
          moisturePercentage,
          colorGrade,
          notes,
          batchId,
        },
        req.user
      );

      ApiResponseUtil.created(res, harvest, 'Harvest record created successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to create harvest record');
    }
  }
}

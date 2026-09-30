/**
 * Batches Controller
 * Handles batch creation, batch lookup, and batch event queries.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { batchesService } from '../services/batches.service';

export class BatchesController {
  public static async getBatches(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const batches = await batchesService.getBatches(req.user);
      ApiResponseUtil.success(res, batches, 'Batches retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve batches');
    }
  }

  public static async getBatchByNumber(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { batchNumber } = req.params;
      const { batch, unauthorized } = await batchesService.getBatchByNumber(batchNumber, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this batch.', 403);
        return;
      }

      if (!batch) {
        ApiResponseUtil.notFound(res, 'Batch not found');
        return;
      }

      ApiResponseUtil.success(res, batch, 'Batch retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve batch');
    }
  }

  public static async getBatchEvents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { batchNumber } = req.params;
      const { events, unauthorized, notFound } = await batchesService.getBatchEvents(batchNumber, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this batch.', 403);
        return;
      }

      if (notFound) {
        ApiResponseUtil.notFound(res, 'Batch not found');
        return;
      }

      ApiResponseUtil.success(res, events, 'Batch events retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve batch events');
    }
  }

  public static async createBatch(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { productName, floralSource, quantityKg, hiveId, hiveBoxNumber, apiaryId, apiaryName } = req.body;

      if (!productName || !floralSource || quantityKg === undefined || !hiveId) {
        ApiResponseUtil.badRequest(res, 'Missing required fields: productName, floralSource, quantityKg, hiveId');
        return;
      }

      const batch = await batchesService.createBatch(
        {
          productName,
          floralSource,
          quantityKg: Number(quantityKg),
          hiveId,
          hiveBoxNumber,
          apiaryId,
          apiaryName,
        },
        req.user
      );

      ApiResponseUtil.created(res, batch, 'Honey batch created successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to create honey batch');
    }
  }
}

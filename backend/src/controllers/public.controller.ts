/**
 * Public Controller
 * Handles unauthenticated consumer requests for batch verification and traceability.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { publicService } from '../services/public.service';

export class PublicController {
  public static async getPublicBatch(req: Request, res: Response): Promise<void> {
    try {
      const { batchNumber } = req.params;

      if (!batchNumber || !batchNumber.trim()) {
        ApiResponseUtil.badRequest(res, 'Batch number is required');
        return;
      }

      const batch = await publicService.getPublicBatch(batchNumber.trim());

      if (!batch) {
        ApiResponseUtil.notFound(res, `Batch ${batchNumber} not found or unverified.`);
        return;
      }

      ApiResponseUtil.success(res, batch, 'Public batch record verified successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to verify public batch');
    }
  }
}

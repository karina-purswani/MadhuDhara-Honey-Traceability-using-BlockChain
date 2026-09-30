/**
 * Hives Module Routes
 * Endpoints for hive tracking, digital passport inspection, and on-demand sensor readings.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { HivesController } from '../controllers/hives.controller';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/hives/status
 * Status check for Hive endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'hives',
      phase: '3C',
      status: 'active',
      description: 'Hive tracking and digital passport routes active',
    },
    'Hives API route ready'
  );
});

/**
 * GET /api/hives/:hiveId/iot/latest
 * Returns latest simulated IoT reading for ONE selected hive.
 * Protected by requireAuth + requireRole('KVIC_ADMIN').
 */
router.get(
  '/:hiveId/iot/latest',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  HivesController.getLatestIoTReading
);

/**
 * GET /api/hives/:hiveId
 * Returns complete digital passport details for a selected hive.
 * Protected by requireAuth + requireRole('KVIC_ADMIN').
 */
router.get(
  '/:hiveId',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  HivesController.getHiveDetail
);

export const hiveRoutes = router;

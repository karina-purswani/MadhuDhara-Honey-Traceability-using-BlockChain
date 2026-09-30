/**
 * Harvests Module Routes
 * Endpoints for harvest logging, quantity recording, and traceability genesis.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { HarvestsController } from '../controllers/harvests.controller';

const router = Router();

/**
 * GET /api/harvests/status
 * Status check for Harvest endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'harvests',
      phase: '3D',
      status: 'active',
      description: 'Harvest logging and traceability genesis routes active',
    },
    'Harvests API ready'
  );
});

/**
 * GET /api/harvests
 * Retrieves harvests belonging to the authenticated beekeeper, or all for KVIC_ADMIN.
 */
router.get('/', requireAuth, HarvestsController.getHarvests);

/**
 * POST /api/harvests
 * Creates a new honey harvest record.
 */
router.post(
  '/',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  HarvestsController.createHarvest
);

/**
 * GET /api/harvests/:harvestId
 * Retrieves a single harvest record with ownership validation.
 */
router.get('/:harvestId', requireAuth, HarvestsController.getHarvestById);

export const harvestRoutes = router;

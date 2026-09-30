/**
 * Apiaries Module Routes
 * Endpoints for apiary registration, location, and associated hive drill-down.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { ApiariesController } from '../controllers/apiaries.controller';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/apiaries/:apiaryId/hives
 * Returns hives belonging to a specific apiary on demand.
 * Protected by requireAuth + requireRole('KVIC_ADMIN').
 */
router.get(
  '/:apiaryId/hives',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  ApiariesController.getHives
);

/**
 * GET /api/apiaries/status
 * Status check for Apiary endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'apiaries',
      phase: '3C',
      status: 'active',
      description: 'Apiaries management routes active',
    },
    'Apiaries API route ready'
  );
});

export const apiaryRoutes = router;

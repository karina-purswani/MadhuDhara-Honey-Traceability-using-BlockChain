/**
 * Beekeepers Module Routes
 * Endpoints for beekeeper profile and institutional directory records.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { BeekeepersController } from '../controllers/beekeepers.controller';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/beekeepers
 * Returns lightweight beekeeper directory records for KVIC Admin.
 * Protected by requireAuth + requireRole('KVIC_ADMIN').
 */
router.get('/', requireAuth, requireRole('KVIC_ADMIN'), BeekeepersController.getDirectory);

/**
 * GET /api/beekeepers/:beekeeperId/apiaries
 * Returns apiaries belonging to a specific beekeeper on demand.
 * Protected by requireAuth + requireRole('KVIC_ADMIN').
 */
router.get(
  '/:beekeeperId/apiaries',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  BeekeepersController.getApiaries
);

/**
 * GET /api/beekeepers/status
 * Status check for Beekeepers endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'beekeepers',
      phase: '3C',
      status: 'active',
      description: 'Beekeeper management routes active',
    },
    'Beekeepers API route ready'
  );
});

export const beekeeperRoutes = router;

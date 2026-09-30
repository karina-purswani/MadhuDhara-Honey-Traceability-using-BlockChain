/**
 * Batches Module Routes
 * Endpoints for batch packaging, minting, event timelines, and traceability.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { BatchesController } from '../controllers/batches.controller';

const router = Router();

/**
 * GET /api/batches/status
 * Status check for Batch endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'batches',
      phase: '3D',
      status: 'active',
      description: 'Batch packaging, event logging, and traceability routes active',
    },
    'Batches API ready'
  );
});

/**
 * GET /api/batches
 * Returns batches belonging to the authenticated beekeeper, or all for KVIC_ADMIN.
 */
router.get('/', requireAuth, BatchesController.getBatches);

/**
 * POST /api/batches
 * Creates a new honey batch, generates events, and registers on simulated ledger.
 */
router.post(
  '/',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  BatchesController.createBatch
);

/**
 * GET /api/batches/:batchNumber/events
 * Returns the lifecycle event timeline for a batch.
 */
router.get('/:batchNumber/events', requireAuth, BatchesController.getBatchEvents);

/**
 * GET /api/batches/:batchNumber
 * Returns batch details with ownership authorization.
 */
router.get('/:batchNumber', requireAuth, BatchesController.getBatchByNumber);

export const batchRoutes = router;

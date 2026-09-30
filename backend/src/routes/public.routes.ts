/**
 * Public Consumer Module Routes
 * Endpoints for unauthenticated consumers: QR verification, public catalog, etc.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { PublicController } from '../controllers/public.controller';

const router = Router();

/**
 * GET /api/public/status
 * Status check for Public consumer endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'public',
      phase: '3D',
      status: 'active',
      role: 'PUBLIC_CONSUMER',
      authRequired: false,
      description: 'Public consumer verification and traceability routes active',
    },
    'Public Consumer API ready'
  );
});

/**
 * GET /api/public/batches/:batchNumber
 * Unauthenticated consumer batch verification and traceability lookup.
 */
router.get('/batches/:batchNumber', PublicController.getPublicBatch);

export const publicRoutes = router;

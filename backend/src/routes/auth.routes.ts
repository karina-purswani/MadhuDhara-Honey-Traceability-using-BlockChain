/**
 * Authentication Verification Routes
 * Foundation for token validation and session inspection.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

/**
 * GET /api/auth/me
 * Protected endpoint returning verified user claims.
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  ApiResponseUtil.success(res, req.user, 'Authentication token verified');
});

export const authRoutes = router;

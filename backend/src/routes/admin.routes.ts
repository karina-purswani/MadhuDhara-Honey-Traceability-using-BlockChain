/**
 * Admin Module Routes
 * Dedicated endpoints for KVIC institutional administration and oversight.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { AdminController } from '../controllers/admin.controller';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

// Protect all admin routes: require authentication and KVIC_ADMIN role
router.use(requireAuth, requireRole('KVIC_ADMIN'));

/**
 * GET /api/admin/stats
 * Real aggregate institutional statistics for KVIC Admin dashboard
 */
router.get('/stats', AdminController.getStats);

/**
 * GET /api/admin/status
 * Status check for Admin endpoints
 */
router.get('/status', (req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'admin',
      phase: '3B',
      status: 'active',
      authorizedUser: req.user?.email,
    },
    'Admin API route ready'
  );
});

export const adminRoutes = router;

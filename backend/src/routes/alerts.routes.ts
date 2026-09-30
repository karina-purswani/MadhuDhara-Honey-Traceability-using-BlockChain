/**
 * Alerts Module Routes
 * Endpoints for IoT threshold alerts, notifications, and alert-to-ticket triage.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { AlertsController } from '../controllers/alerts.controller';

const router = Router();

/**
 * GET /api/alerts/status
 * Status check for Alert endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'alerts',
      phase: '3D',
      status: 'active',
      description: 'Hive anomaly detection and alert triage routes active',
    },
    'Alerts API ready'
  );
});

/**
 * GET /api/alerts
 * Returns alerts belonging to authenticated beekeeper, or all for KVIC_ADMIN.
 */
router.get('/', requireAuth, AlertsController.getAlerts);

/**
 * POST /api/alerts
 * Records a new hive condition alert.
 */
router.post(
  '/',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  AlertsController.createAlert
);

/**
 * PATCH /api/alerts/:alertId/acknowledge
 * Acknowledges an alert by its owner.
 */
router.patch('/:alertId/acknowledge', requireAuth, AlertsController.acknowledgeAlert);

/**
 * GET /api/alerts/:alertId
 * Returns single alert details with ownership verification.
 */
router.get('/:alertId', requireAuth, AlertsController.getAlertById);

export const alertRoutes = router;

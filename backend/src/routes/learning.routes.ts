/**
 * Learning Module Routes
 * Endpoints for educational materials, video guides, and notification broadcasts.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.middleware';
import { LearningController } from '../controllers/learning.controller';

const router = Router();

/**
 * GET /api/learning/status
 * Status check for Learning endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'learning',
      phase: '3D',
      status: 'active',
      description: 'Educational modules and training content routes active',
    },
    'Learning Hub API ready'
  );
});

/**
 * GET /api/learning
 * Retrieves published educational tutorials (or all content for KVIC_ADMIN).
 */
router.get('/', optionalAuth, LearningController.getLearningContent);

/**
 * GET /api/learning/notifications/my
 * Retrieves broadcast notifications for the authenticated user.
 */
router.get('/notifications/my', requireAuth, LearningController.getUserNotifications);

/**
 * PATCH /api/learning/notifications/:notificationId/read
 * Marks a notification as read.
 */
router.patch('/notifications/:notificationId/read', requireAuth, LearningController.markNotificationAsRead);

/**
 * POST /api/learning
 * Publishes new tutorial content (Admin only).
 */
router.post(
  '/',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  LearningController.createLearningContent
);

/**
 * GET /api/learning/:contentId
 * Retrieves a single learning tutorial.
 */
router.get('/:contentId', optionalAuth, LearningController.getLearningContentById);

/**
 * PUT /api/learning/:contentId
 * Updates existing learning tutorial (Admin only).
 */
router.put(
  '/:contentId',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  LearningController.updateLearningContent
);

/**
 * DELETE /api/learning/:contentId
 * Deletes a learning tutorial (Admin only).
 */
router.delete(
  '/:contentId',
  requireAuth,
  requireRole('KVIC_ADMIN'),
  LearningController.deleteLearningContent
);

export const learningRoutes = router;

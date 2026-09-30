/**
 * Orders Module Routes
 * Endpoints for direct consumer honey order requests and producer inquiry management.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth } from '../middleware/auth.middleware';
import { OrdersController } from '../controllers/orders.controller';

const router = Router();

/**
 * GET /api/orders/status
 * Status check for Orders endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'orders',
      phase: '3D',
      status: 'active',
      description: 'Order inquiries and producer-consumer transaction workflow routes active',
    },
    'Orders API ready'
  );
});

/**
 * POST /api/orders
 * Creates a consumer enquiry/order request (unauthenticated public or registered user).
 */
router.post('/', OrdersController.createOrderRequest);

/**
 * GET /api/orders
 * Retrieves order requests addressed to authenticated beekeeper, or all for KVIC_ADMIN.
 */
router.get('/', requireAuth, OrdersController.getOrderRequests);

/**
 * GET /api/orders/:orderId
 * Retrieves a single order request with seller ownership verification.
 */
router.get('/:orderId', requireAuth, OrdersController.getOrderRequestById);

/**
 * PATCH /api/orders/:orderId/status
 * Updates the order request status (PENDING / ACCEPTED / REJECTED / COMPLETED).
 */
router.patch('/:orderId/status', requireAuth, OrdersController.updateOrderStatus);

export const orderRoutes = router;

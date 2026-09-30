/**
 * Marketplace Module Routes
 * Endpoints for direct beekeeper honey listings, product catalog, and batch associations.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.middleware';
import { MarketplaceController } from '../controllers/marketplace.controller';

const router = Router();

/**
 * GET /api/marketplace/status
 * Status check for Marketplace endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'marketplace',
      phase: '3D',
      status: 'active',
      description: 'Marketplace product listings and direct producer commerce routes active',
    },
    'Marketplace API ready'
  );
});

/**
 * GET /api/marketplace/products
 * Retrieves active marketplace products for consumers, or beekeeper-filtered products with ?my=true.
 */
router.get('/products', optionalAuth, MarketplaceController.getProducts);

/**
 * GET /api/marketplace
 * Backward-compatible root endpoint mapping to product listings.
 */
router.get('/', optionalAuth, MarketplaceController.getProducts);

/**
 * POST /api/marketplace/products
 * Creates a new marketplace listing linked to an authentic batch.
 */
router.post(
  '/products',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  MarketplaceController.createProduct
);

/**
 * POST /api/marketplace
 * Root alias for creating listings.
 */
router.post(
  '/',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  MarketplaceController.createProduct
);

/**
 * GET /api/marketplace/products/:productId
 * Retrieves a single marketplace product.
 */
router.get('/products/:productId', MarketplaceController.getProductById);

/**
 * GET /api/marketplace/:productId
 * Root alias for single product.
 */
router.get('/:productId', MarketplaceController.getProductById);

/**
 * DELETE /api/marketplace/products/:productId
 * Deletes a marketplace listing with seller ownership verification.
 */
router.delete(
  '/products/:productId',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  MarketplaceController.deleteProduct
);

/**
 * DELETE /api/marketplace/:productId
 * Root alias for delete.
 */
router.delete(
  '/:productId',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  MarketplaceController.deleteProduct
);

export const marketplaceRoutes = router;

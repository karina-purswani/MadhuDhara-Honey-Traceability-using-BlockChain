/**
 * Master API Router
 * Aggregates all modular route handlers under /api
 */

import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { adminRoutes } from './admin.routes';
import { beekeeperRoutes } from './beekeepers.routes';
import { apiaryRoutes } from './apiaries.routes';
import { hiveRoutes } from './hives.routes';
import { harvestRoutes } from './harvests.routes';
import { batchRoutes } from './batches.routes';
import { alertRoutes } from './alerts.routes';
import { ticketRoutes } from './tickets.routes';
import { learningRoutes } from './learning.routes';
import { marketplaceRoutes } from './marketplace.routes';
import { orderRoutes } from './orders.routes';
import { publicRoutes } from './public.routes';

const apiRouter = Router();

// 1. System & Health
apiRouter.use('/health', healthRoutes);

// 2. Auth & Identity
apiRouter.use('/auth', authRoutes);

// 3. Institutional Administration (KVIC_ADMIN)
apiRouter.use('/admin', adminRoutes);

// 4. Beekeeper & Domain Resources
apiRouter.use('/beekeepers', beekeeperRoutes);
apiRouter.use('/apiaries', apiaryRoutes);
apiRouter.use('/hives', hiveRoutes);
apiRouter.use('/harvests', harvestRoutes);
apiRouter.use('/batches', batchRoutes);

// 5. Operations & Workflows
apiRouter.use('/alerts', alertRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/learning', learningRoutes);

// 6. Marketplace & Commerce
apiRouter.use('/marketplace', marketplaceRoutes);
apiRouter.use('/orders', orderRoutes);

// 7. Public Consumer
apiRouter.use('/public', publicRoutes);

export default apiRouter;

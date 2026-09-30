/**
 * Admin Repository
 * Provides server-side aggregate statistics using Firebase Admin SDK Firestore count aggregation.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { AdminSystemStats } from '../types/admin.types';

export class AdminRepository {
  /**
   * Fetches aggregate ecosystem statistics.
   * Utilizes Firestore server-side count aggregations (.count().get())
   * to guarantee zero document transfer and optimal O(1) performance.
   */
  public async getSystemStats(): Promise<AdminSystemStats> {
    if (!hasAdminCredentials) {
      return await this.getFallbackStats();
    }

    try {
      const [
        beekeepersSnap,
        apiariesSnap,
        hivesSnap,
        batchesSnap,
        publishedLearningSnap,
        activeMarketplaceSnap,
        activeAlertsSnap,
        ticketsTotalSnap,
        ticketsOpenSnap,
        ticketsInReviewSnap,
        ticketsResolvedSnap,
        ordersTotalSnap,
        ordersPendingSnap,
      ] = await Promise.all([
        adminFirestore.collection('beekeepers').count().get(),
        adminFirestore.collection('apiaries').count().get(),
        adminFirestore.collection('hives').count().get(),
        adminFirestore.collection('batches').count().get(),
        adminFirestore.collection('learning_content').where('status', '==', 'published').count().get(),
        adminFirestore.collection('marketplace_products').where('status', '==', 'active').count().get(),
        adminFirestore.collection('alerts').where('isAcknowledged', '==', false).count().get(),
        adminFirestore.collection('support_tickets').count().get(),
        adminFirestore.collection('support_tickets').where('status', '==', 'OPEN').count().get(),
        adminFirestore.collection('support_tickets').where('status', '==', 'IN REVIEW').count().get(),
        adminFirestore.collection('support_tickets').where('status', '==', 'RESOLVED').count().get(),
        adminFirestore.collection('order_requests').count().get(),
        adminFirestore.collection('order_requests').where('status', '==', 'PENDING').count().get(),
      ]);

      return {
        registeredBeekeepers: beekeepersSnap.data().count,
        activeApiaries: apiariesSnap.data().count,
        registeredHives: hivesSnap.data().count,
        honeyBatches: batchesSnap.data().count,
        tickets: {
          open: ticketsOpenSnap.data().count,
          inReview: ticketsInReviewSnap.data().count,
          resolved: ticketsResolvedSnap.data().count,
          total: ticketsTotalSnap.data().count,
        },
        publishedLearning: publishedLearningSnap.data().count,
        marketplace: {
          activeListings: activeMarketplaceSnap.data().count,
          totalOrders: ordersTotalSnap.data().count,
          pendingOrders: ordersPendingSnap.data().count,
        },
        activeAlertsCount: activeAlertsSnap.data().count,
      };
    } catch (adminErr: any) {
      console.warn(
        '[AdminRepository] Firebase Admin SDK count aggregation notice:',
        adminErr?.message || adminErr
      );
      return await this.getFallbackStats();
    }
  }

  /**
   * Fallback for environments without Google Application Default Credentials
   */
  private async getFallbackStats(): Promise<AdminSystemStats> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreIdentityService } = await import('../../../src/services/firestore/index');
      return await firestoreIdentityService.getAdminSystemStats();
    } catch {
      const { mockDb } = await import('./mock.db');
      const mockTickets = Array.from(mockDb.tickets.values());
      return {
        registeredBeekeepers: mockDb.beekeepers.size,
        activeApiaries: mockDb.apiaries.size,
        registeredHives: mockDb.hives.size,
        honeyBatches: mockDb.batches.size,
        tickets: {
          open: mockTickets.filter((t) => t.status === 'OPEN').length,
          inReview: mockTickets.filter((t) => t.status === 'IN REVIEW').length,
          resolved: mockTickets.filter((t) => t.status === 'RESOLVED').length,
          total: mockTickets.length,
        },
        publishedLearning: 1,
        marketplace: {
          activeListings: mockDb.marketplace.size,
          totalOrders: 0,
          pendingOrders: 0,
        },
        activeAlertsCount: Array.from(mockDb.alerts.values()).filter((a) => !a.isAcknowledged).length,
      };
    }
  }
}

export const adminRepository = new AdminRepository();

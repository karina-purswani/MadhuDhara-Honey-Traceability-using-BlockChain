/**
 * Apiaries Repository
 * Queries apiaries and their associated hives using Firebase Admin SDK Firestore.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { Apiary, Hive } from '../../../shared/types';

export class ApiariesRepository {
  /**
   * Retrieves apiaries belonging to a specific beekeeper (by UID or beekeeperId).
   */
  public async getApiariesByBeekeeper(beekeeperId: string): Promise<Apiary[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackApiaries(beekeeperId);
    }

    try {
      // Resolve both UID and formal beekeeperId
      let resolvedUid = beekeeperId;
      let resolvedBeekeeperId = beekeeperId;

      try {
        const bkDoc = await adminFirestore.collection('beekeepers').doc(beekeeperId).get();
        if (bkDoc.exists) {
          const bkData = bkDoc.data() || {};
          resolvedUid = bkDoc.id;
          resolvedBeekeeperId = bkData.beekeeperId || bkDoc.id;
        } else {
          const bkQuery = await adminFirestore
            .collection('beekeepers')
            .where('beekeeperId', '==', beekeeperId)
            .limit(1)
            .get();
          if (!bkQuery.empty) {
            const bkData = bkQuery.docs[0].data() || {};
            resolvedUid = bkQuery.docs[0].id;
            resolvedBeekeeperId = bkData.beekeeperId || bkQuery.docs[0].id;
          }
        }
      } catch (err) {
        // Continue with provided ID
      }

      // 1. Query by beekeeperUid
      let snapshot = await adminFirestore
        .collection('apiaries')
        .where('beekeeperUid', '==', resolvedUid)
        .get();

      // 2. If empty, query by formal beekeeperId
      if (snapshot.empty) {
        snapshot = await adminFirestore
          .collection('apiaries')
          .where('beekeeperId', '==', resolvedBeekeeperId)
          .get();
      }

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.apiaryId || d.id,
            name: data.name || '',
            beekeeperId: data.beekeeperId || resolvedBeekeeperId,
            locationName: data.locationName || `${data.village || ''}, ${data.district || ''}`,
            village: data.village || '',
            district: data.district || '',
            state: data.state || '',
            coordinates: data.coordinates || { lat: 19.9975, lng: 73.7898 },
            floraType: Array.isArray(data.floraType) ? data.floraType : ['Wild Flora'],
            hiveCount: Number(data.hiveCount || 0),
            status: data.status || 'active',
            createdAt: data.createdAt || new Date().toISOString(),
          };
        });
      }

      return await this.getFallbackApiaries(resolvedBeekeeperId);
    } catch (err: any) {
      console.warn(
        `[ApiariesRepository] Firebase Admin query warning for beekeeper ${beekeeperId}:`,
        err?.message || err
      );
      return await this.getFallbackApiaries(beekeeperId);
    }
  }

  /**
   * Retrieves hives belonging to a specific apiary.
   */
  public async getHivesByApiary(apiaryId: string): Promise<Hive[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackHives(apiaryId);
    }

    try {
      const snapshot = await adminFirestore
        .collection('hives')
        .where('apiaryId', '==', apiaryId)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.hiveId || d.id,
            apiaryId: data.apiaryId || apiaryId,
            beekeeperId: data.beekeeperId || '',
            boxNumber: data.boxNumber || d.id.slice(-4),
            beeSpecies: data.beeSpecies || 'Apis cerana indica',
            installationDate: data.installationDate || new Date().toISOString().split('T')[0],
            queenAgeMonths: Number(data.queenAgeMonths || 3),
            currentHealthScore: Number(data.currentHealthScore || 90),
            status: data.status || 'healthy',
            lastInspectionDate: data.lastInspectionDate || new Date().toISOString().split('T')[0],
            hasIoTUnit: Boolean(data.hasIoTUnit),
            iotDeviceId: data.iotDeviceId,
            batteryLevel: Number(data.batteryLevel || 95),
            totalHarvestsCount: Number(data.totalHarvestsCount || 0),
            lifetimeHoneyYieldKg: Number(data.lifetimeHoneyYieldKg || 0),
          };
        });
      }

      return await this.getFallbackHives(apiaryId);
    } catch (err: any) {
      console.warn(
        `[ApiariesRepository] Firebase Admin query warning for apiary ${apiaryId}:`,
        err?.message || err
      );
      return await this.getFallbackHives(apiaryId);
    }
  }

  private async getFallbackApiaries(beekeeperId: string): Promise<Apiary[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreIdentityService } = await import('../../../src/services/firestore/index');
      const res = await firestoreIdentityService.getBeekeeperApiaries(beekeeperId);
      const matches = res.filter(
        (a) => a.beekeeperId === beekeeperId || a.beekeeperId.includes(beekeeperId)
      );
      if (matches.length > 0) return matches;
    } catch {
      // Continue to mockDb
    }

    const { mockDb } = await import('./mock.db');
    const matches = Array.from(mockDb.apiaries.values()).filter(
      (a) => a.beekeeperId === beekeeperId || a.beekeeperId.includes(beekeeperId)
    );
    return matches;
  }

  private async getFallbackHives(apiaryId: string): Promise<Hive[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreIdentityService } = await import('../../../src/services/firestore/index');
      const res = await firestoreIdentityService.getBeekeeperHives('', apiaryId);
      const matches = res.filter((h) => h.apiaryId === apiaryId);
      if (matches.length > 0) return matches;
    } catch {
      // Continue to mockDb
    }

    const { mockDb } = await import('./mock.db');
    const matches = Array.from(mockDb.hives.values()).filter((h) => h.apiaryId === apiaryId);
    return matches;
  }
}

export const apiariesRepository = new ApiariesRepository();

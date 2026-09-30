/**
 * Hives Repository
 * Handles hive digital passport retrieval, provenance data, and on-demand IoT telemetry.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { Hive, Apiary, BeekeeperProfile, HiveReading } from '../../../shared/types';
import { HiveDetailResponse } from '../types/admin.types';
import { iotService } from '../../../iot/services/iot.service';
import { aiService } from '../../../ai-service/services/ai.service';

export class HivesRepository {
  /**
   * Retrieves complete digital passport details for a single selected hive.
   * Includes linked beekeeper provenance and apiary location records.
   */
  public async getHiveDetail(hiveId: string): Promise<HiveDetailResponse | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackHiveDetail(hiveId);
    }

    try {
      // 1. Fetch hive document
      let hiveSnap = await adminFirestore.collection('hives').doc(hiveId).get();

      if (!hiveSnap.exists) {
        const querySnap = await adminFirestore
          .collection('hives')
          .where('hiveId', '==', hiveId)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          hiveSnap = querySnap.docs[0];
        }
      }

      if (!hiveSnap.exists) {
        return await this.getFallbackHiveDetail(hiveId);
      }

      const d = hiveSnap.data() || {};
      const hive: Hive = {
        id: d.hiveId || hiveSnap.id,
        apiaryId: d.apiaryId || '',
        beekeeperId: d.beekeeperId || '',
        boxNumber: d.boxNumber || hiveSnap.id.slice(-4),
        beeSpecies: d.beeSpecies || 'Apis cerana indica',
        installationDate: d.installationDate || new Date().toISOString().split('T')[0],
        queenAgeMonths: Number(d.queenAgeMonths || 3),
        currentHealthScore: Number(d.currentHealthScore || 90),
        status: d.status || 'healthy',
        lastInspectionDate: d.lastInspectionDate || new Date().toISOString().split('T')[0],
        hasIoTUnit: Boolean(d.hasIoTUnit),
        iotDeviceId: d.iotDeviceId,
        batteryLevel: Number(d.batteryLevel || 95),
        totalHarvestsCount: Number(d.totalHarvestsCount || 0),
        lifetimeHoneyYieldKg: Number(d.lifetimeHoneyYieldKg || 0),
      };

      // 2. Fetch linked Beekeeper
      let beekeeper: BeekeeperProfile | null = null;
      const beekeeperUid = d.beekeeperUid || d.beekeeperId;
      if (beekeeperUid) {
        let bkSnap = await adminFirestore.collection('beekeepers').doc(beekeeperUid).get();
        if (!bkSnap.exists) {
          const bkQuery = await adminFirestore
            .collection('beekeepers')
            .where('beekeeperId', '==', beekeeperUid)
            .limit(1)
            .get();
          if (!bkQuery.empty) bkSnap = bkQuery.docs[0];
        }

        if (bkSnap.exists) {
          const b = bkSnap.data() || {};
          beekeeper = {
            id: bkSnap.id,
            firebaseUid: b.firebaseUid || bkSnap.id,
            name: b.name || '',
            email: b.email || '',
            phone: b.phone || '',
            role: 'beekeeper',
            preferredLanguage: b.preferredLanguage || 'en',
            beekeeperId: b.beekeeperId || beekeeperUid,
            kvicRegistrationNumber: b.kvicRegistrationNumber || '',
            village: b.village || '',
            district: b.district || '',
            state: b.state || '',
            totalApiaries: Number(b.totalApiaries || 1),
            totalHives: Number(b.totalHives || 2),
            onboardingDate: b.onboardingDate || new Date().toISOString().split('T')[0],
            experienceYears: Number(b.experienceYears || 3),
          };
        }
      }

      // 3. Fetch linked Apiary
      let apiary: Apiary | null = null;
      if (hive.apiaryId) {
        let apiarySnap = await adminFirestore.collection('apiaries').doc(hive.apiaryId).get();
        if (!apiarySnap.exists) {
          const apiaryQuery = await adminFirestore
            .collection('apiaries')
            .where('apiaryId', '==', hive.apiaryId)
            .limit(1)
            .get();
          if (!apiaryQuery.empty) apiarySnap = apiaryQuery.docs[0];
        }

        if (apiarySnap.exists) {
          const a = apiarySnap.data() || {};
          apiary = {
            id: a.apiaryId || apiarySnap.id,
            name: a.name || '',
            beekeeperId: a.beekeeperId || hive.beekeeperId,
            locationName: a.locationName || `${a.village || ''}, ${a.district || ''}`,
            village: a.village || '',
            district: a.district || '',
            state: a.state || '',
            coordinates: a.coordinates || { lat: 19.9975, lng: 73.7898 },
            floraType: Array.isArray(a.floraType) ? a.floraType : ['Wild Flora'],
            hiveCount: Number(a.hiveCount || 0),
            status: a.status || 'active',
            createdAt: a.createdAt || new Date().toISOString(),
          };
        }
      }

      return { hive, beekeeper, apiary };
    } catch (err: any) {
      console.warn(`[HivesRepository] Error querying hive detail for ${hiveId}:`, err?.message || err);
      return await this.getFallbackHiveDetail(hiveId);
    }
  }

  /**
   * Retrieves the latest simulated IoT reading for ONE selected hive.
   */
  public async getLatestIoTReading(hiveId: string): Promise<HiveReading> {
    const reading = await iotService.getLatestReading(hiveId);
    try {
      const health = aiService.calculateHealthScore(reading);
      return {
        ...reading,
        healthScore: health.overallScore,
      };
    } catch {
      return reading;
    }
  }

  public async recordHiveExtraction(hiveId: string, quantityKg: number): Promise<void> {
    const now = new Date().toISOString();
    const cleanKg = Number(quantityKg) || 0;

    if (hasAdminCredentials) {
      try {
        let hiveRef = adminFirestore.collection('hives').doc(hiveId);
        let snap = await hiveRef.get();
        if (!snap.exists) {
          const qSnap = await adminFirestore.collection('hives').where('hiveId', '==', hiveId).limit(1).get();
          if (!qSnap.empty) {
            hiveRef = qSnap.docs[0].ref;
            snap = qSnap.docs[0];
          }
        }

        if (snap.exists) {
          const currentYield = Number(snap.data()?.lifetimeHoneyYieldKg || 0);
          const currentHarvests = Number(snap.data()?.totalHarvestsCount || 0);
          await hiveRef.update({
            lifetimeHoneyYieldKg: Number((currentYield + cleanKg).toFixed(1)),
            totalHarvestsCount: currentHarvests + 1,
            lastInspectionDate: now.split('T')[0],
            updatedAt: now,
          });
        }
      } catch (err: any) {
        console.warn(`[HivesRepository] recordHiveExtraction error for ${hiveId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      const hive = mockDb.hives.get(hiveId) || Array.from(mockDb.hives.values()).find((h) => h.id === hiveId);
      if (hive) {
        hive.lifetimeHoneyYieldKg = Number(((hive.lifetimeHoneyYieldKg || 0) + cleanKg).toFixed(1));
        hive.totalHarvestsCount = (hive.totalHarvestsCount || 0) + 1;
        hive.lastInspectionDate = now.split('T')[0];
        mockDb.hives.set(hive.id, hive);
      }
    } catch {
      // ignore
    }
  }

  private async getFallbackHiveDetail(hiveId: string): Promise<HiveDetailResponse> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreIdentityService } = await import('../../../src/services/firestore/index');
      return await firestoreIdentityService.getHiveDetail(hiveId);
    } catch {
      const { mockDb } = await import('./mock.db');
      const hive = mockDb.hives.get(hiveId) || Array.from(mockDb.hives.values())[0] || null;
      const beekeeper = hive ? mockDb.beekeepers.get(hive.beekeeperId) || Array.from(mockDb.beekeepers.values())[0] || null : null;
      const apiary = hive ? mockDb.apiaries.get(hive.apiaryId) || Array.from(mockDb.apiaries.values())[0] || null : null;
      return { hive, beekeeper, apiary };
    }
  }
}

export const hivesRepository = new HivesRepository();

/**
 * Beekeepers Repository
 * Fetches lightweight beekeeper directory records using Firebase Admin SDK Firestore.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { LightweightBeekeeperSummary } from '../types/admin.types';

export class BeekeepersRepository {
  /**
   * Retrieves lightweight beekeeper records for the directory.
   * Excludes heavy telemetry, sensor readings, and hive passports.
   */
  public async getLightweightBeekeepers(
    districtFilter?: string
  ): Promise<LightweightBeekeeperSummary[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackBeekeepers(districtFilter);
    }

    try {
      let queryRef: FirebaseFirestore.Query = adminFirestore.collection('beekeepers');

      if (districtFilter && districtFilter.trim()) {
        queryRef = queryRef.where('district', '==', districtFilter.trim());
      }

      const snapshot = await queryRef.get();

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => {
          const data = d.data();
          return {
            firebaseUid: d.id,
            beekeeperId: data.beekeeperId || '',
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            district: data.district || '',
            state: data.state || '',
            village: data.village || '',
            kvicRegistrationNumber: data.kvicRegistrationNumber || '',
            totalApiaries: Number(data.totalApiaries || 1),
            totalHives: Number(data.totalHives || 2),
            status: data.status || 'Active',
          };
        });
      }

      // If empty in adminFirestore, fallback
      return await this.getFallbackBeekeepers(districtFilter);
    } catch (adminErr: any) {
      console.warn(
        '[BeekeepersRepository] Firebase Admin SDK query notice:',
        adminErr?.message || adminErr
      );
      return await this.getFallbackBeekeepers(districtFilter);
    }
  }

  /**
   * Fallback for environments without Google Application Default Credentials
   */
  private async getFallbackBeekeepers(
    districtFilter?: string
  ): Promise<LightweightBeekeeperSummary[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreIdentityService } = await import('../../../src/services/firestore/index');
      const list = await firestoreIdentityService.getLightweightBeekeepers();
      if (districtFilter && districtFilter.trim()) {
        return list.filter(
          (b: any) => b.district.toLowerCase() === districtFilter.trim().toLowerCase()
        );
      }
      return list;
    } catch {
      const { mockDb } = await import('./mock.db');
      let list = Array.from(mockDb.beekeepers.values()).map((b) => ({
        firebaseUid: b.id,
        beekeeperId: b.beekeeperId,
        name: b.name,
        email: b.email,
        phone: b.phone,
        district: b.district,
        state: b.state,
        village: b.village,
        kvicRegistrationNumber: b.kvicRegistrationNumber,
        totalApiaries: b.totalApiaries || 1,
        totalHives: b.totalHives || 2,
        status: 'Active',
      }));
      if (districtFilter && districtFilter.trim()) {
        list = list.filter(
          (b) => b.district.toLowerCase() === districtFilter.trim().toLowerCase()
        );
      }
      return list;
    }
  }
}

export const beekeepersRepository = new BeekeepersRepository();

/**
 * Harvests Repository
 * Manages honey harvest logs in `harvests/{harvestId}` using Firebase Admin SDK Firestore.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { HarvestRecord } from '../../../shared/types';

export class HarvestsRepository {
  private collectionName = 'harvests';

  public async getHarvestsByBeekeeper(beekeeperUid: string): Promise<HarvestRecord[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackHarvestsByBeekeeper(beekeeperUid);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('beekeeperUid', '==', beekeeperUid)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      }

      return await this.getFallbackHarvestsByBeekeeper(beekeeperUid);
    } catch (err: any) {
      console.warn(`[HarvestsRepository] getHarvestsByBeekeeper error for ${beekeeperUid}:`, err?.message || err);
      return await this.getFallbackHarvestsByBeekeeper(beekeeperUid);
    }
  }

  public async getAllHarvests(): Promise<HarvestRecord[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllHarvests();
    }

    try {
      const snapshot = await adminFirestore.collection(this.collectionName).get();
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      }
      return await this.getFallbackAllHarvests();
    } catch (err: any) {
      console.warn('[HarvestsRepository] getAllHarvests error:', err?.message || err);
      return await this.getFallbackAllHarvests();
    }
  }

  public async getHarvestById(harvestId: string): Promise<HarvestRecord | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackHarvestById(harvestId);
    }

    try {
      const docRef = await adminFirestore.collection(this.collectionName).doc(harvestId).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      const qSnap = await adminFirestore
        .collection(this.collectionName)
        .where('harvestId', '==', harvestId)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        return this.mapDoc(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      return await this.getFallbackHarvestById(harvestId);
    } catch (err: any) {
      console.warn(`[HarvestsRepository] getHarvestById error for ${harvestId}:`, err?.message || err);
      return await this.getFallbackHarvestById(harvestId);
    }
  }

  public async createHarvest(harvest: {
    harvestId?: string;
    beekeeperUid: string;
    beekeeperId: string;
    hiveId: string;
    apiaryId: string;
    harvestDate: string;
    quantityKg: number;
    floralSource: string;
    moisturePercentage?: number;
    colorGrade?: string;
    notes?: string;
    batchId?: string;
  }): Promise<HarvestRecord> {
    const docId = harvest.harvestId || `HV-${Date.now().toString().slice(-4)}`;
    const record: HarvestRecord = {
      id: docId,
      hiveId: harvest.hiveId,
      apiaryId: harvest.apiaryId,
      beekeeperId: harvest.beekeeperId,
      harvestDate: harvest.harvestDate || new Date().toISOString().split('T')[0],
      quantityKg: Number(harvest.quantityKg || 0),
      floralSource: harvest.floralSource || 'Multi-Floral Flora',
      moisturePercentage: Number(harvest.moisturePercentage || 17.5),
      colorGrade: harvest.colorGrade || 'Light Amber',
      notes: harvest.notes || '',
      batchId: harvest.batchId,
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(docId).set({
          id: docId,
          harvestId: docId,
          beekeeperUid: harvest.beekeeperUid,
          beekeeperId: harvest.beekeeperId,
          hiveId: harvest.hiveId,
          apiaryId: harvest.apiaryId,
          harvestDate: record.harvestDate,
          quantityKg: record.quantityKg,
          floralSource: record.floralSource,
          moisturePercentage: record.moisturePercentage,
          colorGrade: record.colorGrade,
          notes: record.notes,
          batchId: record.batchId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[HarvestsRepository] createHarvest write error for ${docId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.harvests.set(docId, record);
    } catch {
      // ignore
    }

    return record;
  }

  private mapDoc(id: string, data: any): HarvestRecord {
    return {
      id: data.harvestId || id,
      hiveId: data.hiveId || '',
      apiaryId: data.apiaryId || '',
      beekeeperId: data.beekeeperId || '',
      harvestDate: data.harvestDate || new Date().toISOString().split('T')[0],
      quantityKg: Number(data.quantityKg || 0),
      floralSource: data.floralSource || '',
      moisturePercentage: Number(data.moisturePercentage || 17.5),
      colorGrade: data.colorGrade || 'Light Amber',
      notes: data.notes || '',
      batchId: data.batchId || undefined,
    };
  }

  private async getFallbackHarvestsByBeekeeper(beekeeperUid: string): Promise<HarvestRecord[]> {
    try {
      const { firestoreHarvestRepository } = await import('../../../src/services/firestore/harvest.repository');
      const docs = await firestoreHarvestRepository.getHarvestsByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) {
        return docs.map((d) => ({
          id: d.harvestId,
          hiveId: d.hiveId,
          apiaryId: d.apiaryId,
          beekeeperId: d.beekeeperId,
          harvestDate: d.harvestDate,
          quantityKg: d.quantityKg,
          floralSource: d.floralSource,
          moisturePercentage: d.moisturePercentage,
          colorGrade: d.colorGrade,
          notes: d.notes,
          batchId: d.batchId,
        }));
      }
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.harvests.values()).filter(
      (h) => h.beekeeperId === beekeeperUid || h.beekeeperId.includes(beekeeperUid)
    );
  }

  private async getFallbackAllHarvests(): Promise<HarvestRecord[]> {
    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.harvests.values());
  }

  private async getFallbackHarvestById(harvestId: string): Promise<HarvestRecord | null> {
    const { mockDb } = await import('./mock.db');
    return mockDb.harvests.get(harvestId) || null;
  }
}

export const harvestsRepository = new HarvestsRepository();

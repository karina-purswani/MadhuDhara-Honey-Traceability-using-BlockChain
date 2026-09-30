/**
 * Honey Chain - Firestore Harvest Repository
 * Manages honey harvest records in `harvests/{harvestId}`
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreHarvestDoc } from './types';

export class FirestoreHarvestRepository {
  private collectionName = 'harvests';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getHarvestsByBeekeeper(beekeeperUid: string): Promise<FirestoreHarvestDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
    } catch (error) {
      console.warn(`FirestoreHarvestRepository.getHarvestsByBeekeeper error:`, error);
      return [];
    }
  }

  public async createHarvest(
    harvest: Omit<FirestoreHarvestDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreHarvestDoc> {
    const now = new Date().toISOString();
    const docId = harvest.harvestId || harvest.id;

    if (!db) {
      return {
        ...harvest,
        id: docId,
        harvestId: docId,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, docId);
    const docPayload = {
      id: docId,
      harvestId: docId,
      beekeeperUid: harvest.beekeeperUid,
      beekeeperId: harvest.beekeeperId,
      hiveId: harvest.hiveId,
      apiaryId: harvest.apiaryId,
      harvestDate: harvest.harvestDate,
      quantityKg: Number(harvest.quantityKg || 0),
      floralSource: harvest.floralSource,
      moisturePercentage: Number(harvest.moisturePercentage || 17.5),
      colorGrade: harvest.colorGrade || 'Light Amber',
      notes: harvest.notes || '',
      batchId: harvest.batchId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreHarvestRepository.createHarvest warning for ${docId}:`, writeErr);
    }

    return {
      ...harvest,
      id: docId,
      harvestId: docId,
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapDoc(id: string, data: any): FirestoreHarvestDoc {
    return {
      id,
      harvestId: data.harvestId || id,
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      hiveId: data.hiveId || '',
      apiaryId: data.apiaryId || '',
      harvestDate: data.harvestDate || new Date().toISOString().split('T')[0],
      quantityKg: Number(data.quantityKg || 0),
      floralSource: data.floralSource || '',
      moisturePercentage: Number(data.moisturePercentage || 17.5),
      colorGrade: data.colorGrade || 'Light Amber',
      notes: data.notes || '',
      batchId: data.batchId || undefined,
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreHarvestRepository = new FirestoreHarvestRepository();

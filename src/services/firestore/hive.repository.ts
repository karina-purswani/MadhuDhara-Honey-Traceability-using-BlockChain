/**
 * Honey Chain - Firestore Hive Repository
 * Manages hive identity and telemetry status documents in `hives/{hiveId}`
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreHiveDoc } from './types';

export class FirestoreHiveRepository {
  private collectionName = 'hives';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getHivesByBeekeeper(beekeeperUid: string): Promise<FirestoreHiveDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
    } catch (error) {
      console.warn(`FirestoreHiveRepository.getHivesByBeekeeper error:`, error);
      return [];
    }
  }

  public async getAllHives(): Promise<FirestoreHiveDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
    } catch (error) {
      console.warn(`FirestoreHiveRepository.getAllHives error:`, error);
      return [];
    }
  }

  public async createHive(
    hive: Omit<FirestoreHiveDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreHiveDoc> {
    if (!db) {
      throw new Error('Firestore is not configured.');
    }

    const now = new Date().toISOString();
    const docId = hive.hiveId || hive.id;
    const ref = doc(db, this.collectionName, docId);

    const docPayload = {
      id: docId,
      hiveId: docId,
      beekeeperUid: hive.beekeeperUid,
      beekeeperId: hive.beekeeperId,
      apiaryId: hive.apiaryId,
      boxNumber: hive.boxNumber,
      beeSpecies: hive.beeSpecies,
      installationDate: hive.installationDate,
      queenAgeMonths: hive.queenAgeMonths,
      currentHealthScore: hive.currentHealthScore,
      status: hive.status,
      lastInspectionDate: hive.lastInspectionDate,
      hasIoTUnit: hive.hasIoTUnit,
      iotDeviceId: hive.iotDeviceId,
      batteryLevel: hive.batteryLevel,
      totalHarvestsCount: hive.totalHarvestsCount,
      lifetimeHoneyYieldKg: hive.lifetimeHoneyYieldKg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreHiveRepository.createHive warning for ${docId}:`, writeErr);
    }

    return {
      ...hive,
      id: docId,
      hiveId: docId,
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapDoc(id: string, data: any): FirestoreHiveDoc {
    return {
      id,
      hiveId: data.hiveId || id,
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      apiaryId: data.apiaryId || '',
      boxNumber: data.boxNumber || '',
      beeSpecies: data.beeSpecies || 'Apis cerana indica',
      installationDate: data.installationDate || new Date().toISOString().split('T')[0],
      queenAgeMonths: Number(data.queenAgeMonths || 4),
      currentHealthScore: Number(data.currentHealthScore || 90),
      status: data.status || 'healthy',
      lastInspectionDate: data.lastInspectionDate || new Date().toISOString().split('T')[0],
      hasIoTUnit: Boolean(data.hasIoTUnit),
      iotDeviceId: data.iotDeviceId || '',
      batteryLevel: Number(data.batteryLevel || 100),
      totalHarvestsCount: Number(data.totalHarvestsCount || 0),
      lifetimeHoneyYieldKg: Number(data.lifetimeHoneyYieldKg || 0),
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreHiveRepository = new FirestoreHiveRepository();

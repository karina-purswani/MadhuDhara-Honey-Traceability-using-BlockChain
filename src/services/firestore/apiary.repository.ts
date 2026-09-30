/**
 * Honey Chain - Firestore Apiary Repository
 * Manages apiary documents in `apiaries/{apiaryId}`
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreApiaryDoc } from './types';

export class FirestoreApiaryRepository {
  private collectionName = 'apiaries';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getApiariesByBeekeeper(beekeeperUid: string): Promise<FirestoreApiaryDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          apiaryId: data.apiaryId || d.id,
          beekeeperUid: data.beekeeperUid,
          beekeeperId: data.beekeeperId || '',
          name: data.name || '',
          locationName: data.locationName || '',
          village: data.village || '',
          district: data.district || '',
          state: data.state || '',
          coordinates: data.coordinates || { lat: 19.9975, lng: 73.7898 },
          floraType: Array.isArray(data.floraType) ? data.floraType : [],
          hiveCount: Number(data.hiveCount || 0),
          status: data.status || 'active',
          createdAt: this.normalizeTimestamp(data.createdAt),
          updatedAt: this.normalizeTimestamp(data.updatedAt),
        };
      });
    } catch (error) {
      console.warn(`FirestoreApiaryRepository.getApiariesByBeekeeper error:`, error);
      return [];
    }
  }

  public async getAllApiaries(): Promise<FirestoreApiaryDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          apiaryId: data.apiaryId || d.id,
          beekeeperUid: data.beekeeperUid,
          beekeeperId: data.beekeeperId || '',
          name: data.name || '',
          locationName: data.locationName || '',
          village: data.village || '',
          district: data.district || '',
          state: data.state || '',
          coordinates: data.coordinates || { lat: 19.9975, lng: 73.7898 },
          floraType: Array.isArray(data.floraType) ? data.floraType : [],
          hiveCount: Number(data.hiveCount || 0),
          status: data.status || 'active',
          createdAt: this.normalizeTimestamp(data.createdAt),
          updatedAt: this.normalizeTimestamp(data.updatedAt),
        };
      });
    } catch (error) {
      console.warn('FirestoreApiaryRepository.getAllApiaries error:', error);
      return [];
    }
  }

  public async createApiary(
    apiary: Omit<FirestoreApiaryDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreApiaryDoc> {
    if (!db) {
      throw new Error('Firestore is not configured.');
    }

    const now = new Date().toISOString();
    const docId = apiary.apiaryId || apiary.id;
    const ref = doc(db, this.collectionName, docId);

    const docPayload = {
      id: docId,
      apiaryId: docId,
      beekeeperUid: apiary.beekeeperUid,
      beekeeperId: apiary.beekeeperId,
      name: apiary.name,
      locationName: apiary.locationName,
      village: apiary.village,
      district: apiary.district,
      state: apiary.state,
      coordinates: apiary.coordinates,
      floraType: apiary.floraType,
      hiveCount: apiary.hiveCount,
      status: apiary.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreApiaryRepository.createApiary warning for ${docId}:`, writeErr);
    }

    return {
      ...apiary,
      id: docId,
      apiaryId: docId,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export const firestoreApiaryRepository = new FirestoreApiaryRepository();

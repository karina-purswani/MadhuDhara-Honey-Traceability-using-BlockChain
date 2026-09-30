/**
 * Honey Chain - Firestore Beekeeper Repository
 * Manages rural beekeeper profile documents in `beekeepers/{firebaseUid}`
 */

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreBeekeeperDoc } from './types';

export class FirestoreBeekeeperRepository {
  private collectionName = 'beekeepers';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getAllBeekeepers(): Promise<FirestoreBeekeeperDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          firebaseUid: d.id,
          beekeeperId: data.beekeeperId || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          village: data.village || '',
          district: data.district || '',
          state: data.state || '',
          experienceYears: Number(data.experienceYears || 0),
          kvicRegistrationNumber: data.kvicRegistrationNumber || '',
          preferredLanguage: data.preferredLanguage || 'en',
          totalApiaries: Number(data.totalApiaries || 1),
          totalHives: Number(data.totalHives || 0),
          onboardingDate: data.onboardingDate || new Date().toISOString().split('T')[0],
          createdAt: this.normalizeTimestamp(data.createdAt),
          updatedAt: this.normalizeTimestamp(data.updatedAt),
        };
      });
    } catch (error) {
      console.warn('FirestoreBeekeeperRepository.getAllBeekeepers error:', error);
      return [];
    }
  }

  public async getBeekeeper(firebaseUid: string): Promise<FirestoreBeekeeperDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, firebaseUid);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        firebaseUid,
        beekeeperId: data.beekeeperId || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        village: data.village || '',
        district: data.district || '',
        state: data.state || '',
        experienceYears: Number(data.experienceYears || 0),
        kvicRegistrationNumber: data.kvicRegistrationNumber || '',
        preferredLanguage: data.preferredLanguage || 'en',
        totalApiaries: Number(data.totalApiaries || 1),
        totalHives: Number(data.totalHives || 0),
        onboardingDate: data.onboardingDate || new Date().toISOString().split('T')[0],
        createdAt: this.normalizeTimestamp(data.createdAt),
        updatedAt: this.normalizeTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.warn(`FirestoreBeekeeperRepository.getBeekeeper error for ${firebaseUid}:`, error);
      return null;
    }
  }

  public async createOrUpdateBeekeeper(
    profile: Omit<FirestoreBeekeeperDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreBeekeeperDoc> {
    if (!db) {
      throw new Error('Firestore is not configured.');
    }

    const now = new Date().toISOString();
    const ref = doc(db, this.collectionName, profile.firebaseUid);

    const docPayload = {
      firebaseUid: profile.firebaseUid,
      beekeeperId: profile.beekeeperId,
      name: profile.name,
      email: profile.email.toLowerCase().trim(),
      phone: profile.phone,
      village: profile.village,
      district: profile.district,
      state: profile.state,
      experienceYears: profile.experienceYears,
      kvicRegistrationNumber: profile.kvicRegistrationNumber,
      preferredLanguage: profile.preferredLanguage,
      totalApiaries: profile.totalApiaries,
      totalHives: profile.totalHives,
      onboardingDate: profile.onboardingDate,
      updatedAt: serverTimestamp(),
    };

    try {
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, {
          ...docPayload,
          createdAt: serverTimestamp(),
        });
        return {
          ...profile,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        await updateDoc(ref, docPayload);
        const existingData = existing.data();
        return {
          ...profile,
          createdAt: this.normalizeTimestamp(existingData.createdAt),
          updatedAt: now,
        };
      }
    } catch (writeErr) {
      console.warn(`FirestoreBeekeeperRepository.createOrUpdateBeekeeper warning for ${profile.firebaseUid}:`, writeErr);
      return {
        ...profile,
        createdAt: now,
        updatedAt: now,
      };
    }
  }
}

export const firestoreBeekeeperRepository = new FirestoreBeekeeperRepository();

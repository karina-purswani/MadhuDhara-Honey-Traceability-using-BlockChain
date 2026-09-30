/**
 * Honey Chain - Firestore User Repository
 * Manages identity records in `users/{firebaseUid}`
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreUserDoc } from './types';

export class FirestoreUserRepository {
  private collectionName = 'users';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getUser(firebaseUid: string): Promise<FirestoreUserDoc | null> {
    if (!db) return null;
    try {
      const userRef = doc(db, this.collectionName, firebaseUid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        firebaseUid,
        role: data.role,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        preferredLanguage: data.preferredLanguage || 'en',
        beekeeperId: data.beekeeperId,
        status: data.status || 'active',
        createdAt: this.normalizeTimestamp(data.createdAt),
        updatedAt: this.normalizeTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.warn(`FirestoreUserRepository.getUser error for ${firebaseUid}:`, error);
      return null;
    }
  }

  public async createOrUpdateUser(
    user: Omit<FirestoreUserDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreUserDoc> {
    if (!db) {
      throw new Error('Firestore is not configured.');
    }

    const now = new Date().toISOString();
    const userRef = doc(db, this.collectionName, user.firebaseUid);

    const docPayload = {
      firebaseUid: user.firebaseUid,
      role: user.role,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      phone: user.phone || '',
      preferredLanguage: user.preferredLanguage || 'en',
      beekeeperId: user.beekeeperId || null,
      status: user.status || 'active',
      updatedAt: serverTimestamp(),
    };

    try {
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          ...docPayload,
          createdAt: serverTimestamp(),
        });
        return {
          ...user,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        await updateDoc(userRef, docPayload);
        const existingData = existing.data();
        return {
          ...user,
          createdAt: this.normalizeTimestamp(existingData.createdAt),
          updatedAt: now,
        };
      }
    } catch (writeErr) {
      console.warn(`FirestoreUserRepository.createOrUpdateUser warning for ${user.firebaseUid}:`, writeErr);
      return {
        ...user,
        createdAt: now,
        updatedAt: now,
      };
    }
  }
}

export const firestoreUserRepository = new FirestoreUserRepository();

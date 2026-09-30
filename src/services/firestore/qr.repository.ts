/**
 * Honey Chain - Firestore QR Repository
 * Manages persistent batch QR codes in `qr_records/{batchNumber}`
 */

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreQrDoc } from './types';

export class FirestoreQrRepository {
  private collectionName = 'qr_records';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getQrRecord(batchNumber: string): Promise<FirestoreQrDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, batchNumber);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        batchNumber,
        traceabilityUrl: data.traceabilityUrl || `/trace/${batchNumber}`,
        qrDataUrl: data.qrDataUrl || '',
        createdAt: this.normalizeTimestamp(data.createdAt),
        updatedAt: this.normalizeTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.warn(`FirestoreQrRepository.getQrRecord error for ${batchNumber}:`, error);
      return null;
    }
  }

  public async saveQrRecord(record: {
    batchNumber: string;
    traceabilityUrl: string;
    qrDataUrl: string;
  }): Promise<FirestoreQrDoc> {
    const now = new Date().toISOString();
    if (!db) {
      return {
        ...record,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, record.batchNumber);
    const docPayload = {
      batchNumber: record.batchNumber,
      traceabilityUrl: record.traceabilityUrl,
      qrDataUrl: record.qrDataUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreQrRepository.saveQrRecord warning for ${record.batchNumber}:`, writeErr);
    }

    return {
      ...record,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export const firestoreQrRepository = new FirestoreQrRepository();

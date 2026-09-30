/**
 * Honey Chain - Firestore Public Batch Repository
 * Manages sanitized consumer-safe public batch documents in `public_batches/{batchNumber}`.
 * Allows unauthenticated consumer verification without exposing private beekeeper records.
 */

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestorePublicBatchDoc } from './types';

export class FirestorePublicBatchRepository {
  private collectionName = 'public_batches';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getPublicBatch(batchNumber: string): Promise<FirestorePublicBatchDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, batchNumber);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        batchNumber: data.batchNumber || snapshot.id,
        productName: data.productName || '',
        floralSource: data.floralSource || '',
        harvestDate: data.harvestDate || '',
        packagingDate: data.packagingDate || '',
        bestBeforeDate: data.bestBeforeDate || '',
        beekeeperName: data.beekeeperName || '',
        originDistrict: data.originDistrict || '',
        originState: data.originState || '',
        fssaiNumber: data.fssaiNumber || '',
        kvicCertificationId: data.kvicCertificationId || '',
        moisturePercentage: Number(data.moisturePercentage || 17.5),
        sucrosePercentage: Number(data.sucrosePercentage || 3.0),
        blockchainTxHash: data.blockchainTxHash || '',
        blockNumber: Number(data.blockNumber || 18492040),
        smartContractAddress: data.smartContractAddress || '',
        verificationStatus: data.verificationStatus || 'VERIFIED',
        qrCodeUrl: data.qrCodeUrl || `/trace/${snapshot.id}`,
        traceabilityUrl: data.traceabilityUrl || `/trace/${snapshot.id}`,
        qrDataUrl: data.qrDataUrl || '',
        scanCount: Number(data.scanCount || 1),
        events: Array.isArray(data.events) ? data.events : [],
        suspiciousReason: data.suspiciousReason || undefined,
        updatedAt: this.normalizeTimestamp(data.updatedAt),
      };
    } catch (error) {
      console.warn(`FirestorePublicBatchRepository.getPublicBatch error for ${batchNumber}:`, error);
      return null;
    }
  }

  public async savePublicBatch(
    publicDoc: Omit<FirestorePublicBatchDoc, 'updatedAt'>
  ): Promise<FirestorePublicBatchDoc> {
    const now = new Date().toISOString();
    if (!db) {
      return {
        ...publicDoc,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, publicDoc.batchNumber);
    const docPayload = {
      batchNumber: publicDoc.batchNumber,
      productName: publicDoc.productName,
      floralSource: publicDoc.floralSource,
      harvestDate: publicDoc.harvestDate,
      packagingDate: publicDoc.packagingDate,
      bestBeforeDate: publicDoc.bestBeforeDate,
      beekeeperName: publicDoc.beekeeperName,
      originDistrict: publicDoc.originDistrict,
      originState: publicDoc.originState,
      fssaiNumber: publicDoc.fssaiNumber,
      kvicCertificationId: publicDoc.kvicCertificationId,
      moisturePercentage: publicDoc.moisturePercentage,
      sucrosePercentage: publicDoc.sucrosePercentage,
      blockchainTxHash: publicDoc.blockchainTxHash,
      blockNumber: publicDoc.blockNumber,
      smartContractAddress: publicDoc.smartContractAddress,
      verificationStatus: publicDoc.verificationStatus,
      qrCodeUrl: publicDoc.qrCodeUrl,
      traceabilityUrl: publicDoc.traceabilityUrl,
      qrDataUrl: publicDoc.qrDataUrl,
      scanCount: publicDoc.scanCount,
      events: publicDoc.events,
      suspiciousReason: publicDoc.suspiciousReason || null,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestorePublicBatchRepository.savePublicBatch warning for ${publicDoc.batchNumber}:`, writeErr);
    }

    return {
      ...publicDoc,
      updatedAt: now,
    };
  }
}

export const firestorePublicBatchRepository = new FirestorePublicBatchRepository();

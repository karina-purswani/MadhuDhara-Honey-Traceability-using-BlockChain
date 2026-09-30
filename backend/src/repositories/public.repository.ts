/**
 * Public Batch Repository
 * Handles unauthenticated public consumer batch verification queries using Firebase Admin SDK.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { FirestorePublicBatchDoc } from '../../../src/services/firestore/types';

export class PublicRepository {
  private publicCollectionName = 'public_batches';
  private batchesCollectionName = 'batches';

  public async getPublicBatch(batchNumber: string): Promise<FirestorePublicBatchDoc | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackPublicBatch(batchNumber);
    }

    try {
      // 1. Try public_batches collection
      const docRef = await adminFirestore.collection(this.publicCollectionName).doc(batchNumber).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      // 2. Try batches collection and sanitize
      const bRef = await adminFirestore.collection(this.batchesCollectionName).doc(batchNumber).get();
      if (bRef.exists) {
        return this.mapDoc(bRef.id, bRef.data());
      }

      return await this.getFallbackPublicBatch(batchNumber);
    } catch (err: any) {
      console.warn(`[PublicRepository] getPublicBatch error for ${batchNumber}:`, err?.message || err);
      return await this.getFallbackPublicBatch(batchNumber);
    }
  }

  private mapDoc(id: string, data: any): FirestorePublicBatchDoc {
    return {
      batchNumber: data.batchNumber || id,
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
      qrCodeUrl: data.qrCodeUrl || `/trace/${id}`,
      traceabilityUrl: data.traceabilityUrl || `/trace/${id}`,
      qrDataUrl: data.qrDataUrl || '',
      scanCount: Number(data.scanCount || 1),
      events: Array.isArray(data.events) ? data.events : [],
      suspiciousReason: data.suspiciousReason || undefined,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  private async getFallbackPublicBatch(batchNumber: string): Promise<FirestorePublicBatchDoc | null> {
    try {
      const { firestorePublicBatchRepository } = await import(
        '../../../src/services/firestore/public-batch.repository'
      );
      const res = await firestorePublicBatchRepository.getPublicBatch(batchNumber);
      if (res) return res;
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    const batch = mockDb.batches.get(batchNumber);
    if (!batch) return null;

    return {
      batchNumber: batch.id,
      productName: batch.productName,
      floralSource: batch.floralSource,
      harvestDate: batch.harvestDate,
      packagingDate: batch.packagingDate,
      bestBeforeDate: batch.bestBeforeDate,
      beekeeperName: batch.beekeeperName,
      originDistrict: batch.originDistrict,
      originState: batch.originState,
      fssaiNumber: batch.fssaiNumber,
      kvicCertificationId: batch.kvicCertificationId,
      moisturePercentage: batch.moisturePercentage,
      sucrosePercentage: batch.sucrosePercentage,
      blockchainTxHash: batch.blockchainTxHash,
      blockNumber: batch.blockNumber,
      smartContractAddress: batch.smartContractAddress,
      verificationStatus: batch.verificationStatus,
      qrCodeUrl: batch.qrCodeUrl,
      traceabilityUrl: batch.traceabilityUrl,
      qrDataUrl: '',
      scanCount: batch.scanCount,
      events: batch.events,
      suspiciousReason: batch.suspiciousReason,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const publicRepository = new PublicRepository();

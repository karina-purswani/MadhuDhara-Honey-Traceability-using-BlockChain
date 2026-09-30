/**
 * Honey Chain - Firestore Honey Batch Repository
 * Manages honey batches in `batches/{batchNumber}` and lifecycle events in `batch_events/{eventId}`
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
import { FirestoreBatchDoc, FirestoreBatchEventDoc } from './types';

export class FirestoreBatchRepository {
  private collectionName = 'batches';
  private eventsCollectionName = 'batch_events';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getBatchesByBeekeeper(beekeeperUid: string, beekeeperId?: string): Promise<FirestoreBatchDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));

      if (beekeeperId && beekeeperId !== beekeeperUid) {
        try {
          const q2 = query(
            collection(db, this.collectionName),
            where('beekeeperId', '==', beekeeperId)
          );
          const snap2 = await getDocs(q2);
          const existingIds = new Set(results.map((r) => r.id));
          snap2.docs.forEach((d) => {
            if (!existingIds.has(d.id)) {
              results.push(this.mapDoc(d.id, d.data()));
            }
          });
        } catch {
          // ignore
        }
      }

      return results;
    } catch (error) {
      console.warn(`FirestoreBatchRepository.getBatchesByBeekeeper error:`, error);
      return [];
    }
  }

  public async getAllBatches(): Promise<FirestoreBatchDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
    } catch (error) {
      console.warn(`FirestoreBatchRepository.getAllBatches error:`, error);
      return [];
    }
  }

  public async getBatchByNumber(batchNumber: string): Promise<FirestoreBatchDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, batchNumber);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return this.mapDoc(snapshot.id, snapshot.data());
    } catch (error) {
      console.warn(`FirestoreBatchRepository.getBatchByNumber error for ${batchNumber}:`, error);
      return null;
    }
  }

  public async createBatch(
    batch: Omit<FirestoreBatchDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreBatchDoc> {
    const now = new Date().toISOString();
    const batchNumber = batch.batchNumber || batch.id;

    if (!db) {
      return {
        ...batch,
        id: batchNumber,
        batchNumber,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, batchNumber);

    // Save individual events in batch_events/{eventId}
    if (Array.isArray(batch.events)) {
      for (const event of batch.events) {
        const eventId = event.eventId || event.id;
        const eventRef = doc(db, this.eventsCollectionName, eventId);
        const eventPayload = {
          id: eventId,
          eventId,
          batchNumber,
          eventType: event.eventType,
          title: event.title,
          timestamp: event.timestamp,
          actor: event.actor,
          actorRole: event.actorRole,
          location: event.location,
          description: event.description,
          txHash: event.txHash || null,
          verified: Boolean(event.verified),
          metadata: event.metadata || null,
          createdAt: serverTimestamp(),
        };

        try {
          await setDoc(eventRef, eventPayload, { merge: true });
        } catch (e) {
          console.warn(`FirestoreBatchRepository could not write event ${eventId}:`, e);
        }
      }
    }

    const docPayload = {
      id: batchNumber,
      batchNumber,
      beekeeperUid: batch.beekeeperUid,
      beekeeperId: batch.beekeeperId,
      beekeeperName: batch.beekeeperName,
      apiaryId: batch.apiaryId,
      apiaryName: batch.apiaryName,
      hiveIds: batch.hiveIds,
      harvestId: batch.harvestId,
      productName: batch.productName,
      floralSource: batch.floralSource,
      harvestDate: batch.harvestDate,
      packagingDate: batch.packagingDate,
      bestBeforeDate: batch.bestBeforeDate,
      quantityBottles: Number(batch.quantityBottles || 0),
      bottleVolumeMl: Number(batch.bottleVolumeMl || 500),
      originDistrict: batch.originDistrict,
      originState: batch.originState,
      fssaiNumber: batch.fssaiNumber,
      kvicCertificationId: batch.kvicCertificationId,
      moisturePercentage: Number(batch.moisturePercentage || 17.5),
      sucrosePercentage: Number(batch.sucrosePercentage || 3.0),
      pollenAnalysis: batch.pollenAnalysis,
      blockchainTxHash: batch.blockchainTxHash,
      blockNumber: Number(batch.blockNumber || 18492040),
      smartContractAddress: batch.smartContractAddress,
      verificationStatus: batch.verificationStatus,
      qrCodeUrl: batch.qrCodeUrl,
      traceabilityUrl: batch.traceabilityUrl,
      scanCount: Number(batch.scanCount || 1),
      events: batch.events,
      suspiciousReason: batch.suspiciousReason || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreBatchRepository.createBatch warning for ${batchNumber}:`, writeErr);
    }

    return {
      ...batch,
      id: batchNumber,
      batchNumber,
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapDoc(id: string, data: any): FirestoreBatchDoc {
    return {
      id,
      batchNumber: data.batchNumber || id,
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || '',
      apiaryId: data.apiaryId || '',
      apiaryName: data.apiaryName || '',
      hiveIds: Array.isArray(data.hiveIds) ? data.hiveIds : [],
      harvestId: data.harvestId || '',
      productName: data.productName || '',
      floralSource: data.floralSource || '',
      harvestDate: data.harvestDate || '',
      packagingDate: data.packagingDate || '',
      bestBeforeDate: data.bestBeforeDate || '',
      quantityBottles: Number(data.quantityBottles || 0),
      bottleVolumeMl: Number(data.bottleVolumeMl || 500),
      originDistrict: data.originDistrict || '',
      originState: data.originState || '',
      fssaiNumber: data.fssaiNumber || '',
      kvicCertificationId: data.kvicCertificationId || '',
      moisturePercentage: Number(data.moisturePercentage || 17.5),
      sucrosePercentage: Number(data.sucrosePercentage || 3.0),
      pollenAnalysis: data.pollenAnalysis || '',
      blockchainTxHash: data.blockchainTxHash || '',
      blockNumber: Number(data.blockNumber || 18492040),
      smartContractAddress: data.smartContractAddress || '',
      verificationStatus: data.verificationStatus || 'VERIFIED',
      qrCodeUrl: data.qrCodeUrl || `/trace/${id}`,
      traceabilityUrl: data.traceabilityUrl || `/trace/${id}`,
      scanCount: Number(data.scanCount || 1),
      events: Array.isArray(data.events) ? data.events : [],
      suspiciousReason: data.suspiciousReason || undefined,
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreBatchRepository = new FirestoreBatchRepository();

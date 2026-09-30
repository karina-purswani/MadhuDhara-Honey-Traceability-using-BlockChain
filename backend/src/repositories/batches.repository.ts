/**
 * Batches Repository
 * Handles batch creation, lifecycle event logging, and traceability queries using Firebase Admin SDK.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { HoneyBatch, BatchEvent } from '../../../shared/types';

export class BatchesRepository {
  private collectionName = 'batches';
  private eventsCollectionName = 'batch_events';
  private publicCollectionName = 'public_batches';

  public async getBatchesByBeekeeper(beekeeperUid: string): Promise<HoneyBatch[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackBatchesByBeekeeper(beekeeperUid);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('beekeeperUid', '==', beekeeperUid)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      }

      return await this.getFallbackBatchesByBeekeeper(beekeeperUid);
    } catch (err: any) {
      console.warn(`[BatchesRepository] getBatchesByBeekeeper error for ${beekeeperUid}:`, err?.message || err);
      return await this.getFallbackBatchesByBeekeeper(beekeeperUid);
    }
  }

  public async getAllBatches(): Promise<HoneyBatch[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllBatches();
    }

    try {
      const snapshot = await adminFirestore.collection(this.collectionName).get();
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      }
      return await this.getFallbackAllBatches();
    } catch (err: any) {
      console.warn('[BatchesRepository] getAllBatches error:', err?.message || err);
      return await this.getFallbackAllBatches();
    }
  }

  public async getBatchByNumber(batchNumber: string): Promise<HoneyBatch | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackBatchByNumber(batchNumber);
    }

    try {
      const docRef = await adminFirestore.collection(this.collectionName).doc(batchNumber).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      const qSnap = await adminFirestore
        .collection(this.collectionName)
        .where('batchNumber', '==', batchNumber)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        return this.mapDoc(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      return await this.getFallbackBatchByNumber(batchNumber);
    } catch (err: any) {
      console.warn(`[BatchesRepository] getBatchByNumber error for ${batchNumber}:`, err?.message || err);
      return await this.getFallbackBatchByNumber(batchNumber);
    }
  }

  public async getBatchEvents(batchNumber: string): Promise<BatchEvent[]> {
    if (hasAdminCredentials) {
      try {
        const snapshot = await adminFirestore
          .collection(this.eventsCollectionName)
          .where('batchNumber', '==', batchNumber)
          .get();

        if (!snapshot.empty) {
          const events = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: data.eventId || d.id,
              eventType: data.eventType,
              title: data.title,
              timestamp: data.timestamp,
              actor: data.actor,
              actorRole: data.actorRole,
              location: data.location,
              description: data.description,
              txHash: data.txHash || undefined,
              verified: Boolean(data.verified),
              metadata: data.metadata || undefined,
            } as BatchEvent;
          });
          return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
      } catch (err) {
        console.warn(`[BatchesRepository] getBatchEvents admin query warning:`, err);
      }
    }

    const batch = await this.getBatchByNumber(batchNumber);
    return batch?.events || [];
  }

  public async createBatch(batch: HoneyBatch & { beekeeperUid: string; qrDataUrl?: string }): Promise<HoneyBatch> {
    const batchNumber = batch.id;
    const now = new Date().toISOString();

    if (hasAdminCredentials) {
      try {
        // 1. Write batch document
        await adminFirestore.collection(this.collectionName).doc(batchNumber).set({
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
          quantityBottles: batch.quantityBottles,
          bottleVolumeMl: batch.bottleVolumeMl,
          originDistrict: batch.originDistrict,
          originState: batch.originState,
          fssaiNumber: batch.fssaiNumber,
          kvicCertificationId: batch.kvicCertificationId,
          moisturePercentage: batch.moisturePercentage,
          sucrosePercentage: batch.sucrosePercentage,
          pollenAnalysis: batch.pollenAnalysis,
          blockchainTxHash: batch.blockchainTxHash,
          blockNumber: batch.blockNumber,
          smartContractAddress: batch.smartContractAddress,
          verificationStatus: batch.verificationStatus,
          qrCodeUrl: batch.qrCodeUrl,
          traceabilityUrl: batch.traceabilityUrl,
          scanCount: batch.scanCount || 1,
          events: batch.events,
          createdAt: now,
          updatedAt: now,
        }, { merge: true });

        // 2. Write lifecycle events to batch_events/{eventId}
        if (Array.isArray(batch.events)) {
          for (const ev of batch.events) {
            await adminFirestore.collection(this.eventsCollectionName).doc(ev.id).set({
              id: ev.id,
              eventId: ev.id,
              batchNumber,
              eventType: ev.eventType,
              title: ev.title,
              timestamp: ev.timestamp,
              actor: ev.actor,
              actorRole: ev.actorRole,
              location: ev.location,
              description: ev.description,
              txHash: ev.txHash || null,
              verified: Boolean(ev.verified),
              metadata: ev.metadata || null,
              createdAt: now,
            }, { merge: true });
          }
        }

        // 3. Write public verification snapshot to public_batches/{batchNumber}
        await adminFirestore.collection(this.publicCollectionName).doc(batchNumber).set({
          batchNumber,
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
          qrDataUrl: batch.qrDataUrl || '',
          scanCount: batch.scanCount || 1,
          events: batch.events,
          updatedAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[BatchesRepository] createBatch write error for ${batchNumber}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.batches.set(batchNumber, batch);
    } catch {
      // ignore
    }

    return batch;
  }

  private mapDoc(id: string, data: any): HoneyBatch {
    return {
      id: data.batchNumber || id,
      productName: data.productName || '',
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || '',
      apiaryId: data.apiaryId || '',
      apiaryName: data.apiaryName || '',
      hiveIds: Array.isArray(data.hiveIds) ? data.hiveIds : [],
      harvestId: data.harvestId || '',
      harvestDate: data.harvestDate || '',
      packagingDate: data.packagingDate || '',
      bestBeforeDate: data.bestBeforeDate || '',
      quantityBottles: Number(data.quantityBottles || 0),
      bottleVolumeMl: Number(data.bottleVolumeMl || 500),
      floralSource: data.floralSource || '',
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
    };
  }

  private async getFallbackBatchesByBeekeeper(beekeeperUid: string): Promise<HoneyBatch[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreBatchRepository } = await import('../../../src/services/firestore/batch.repository');
      const docs = await firestoreBatchRepository.getBatchesByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) {
        return docs.map((d) => this.mapDoc(d.id, d));
      }
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.batches.values()).filter(
      (b) => b.beekeeperId === beekeeperUid || b.beekeeperId.includes(beekeeperUid)
    );
  }

  private async getFallbackAllBatches(): Promise<HoneyBatch[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreBatchRepository } = await import('../../../src/services/firestore/batch.repository');
      const docs = await firestoreBatchRepository.getAllBatches();
      if (docs && docs.length > 0) {
        return docs.map((d) => this.mapDoc(d.id, d));
      }
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.batches.values());
  }

  private async getFallbackBatchByNumber(batchNumber: string): Promise<HoneyBatch | null> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreBatchRepository } = await import('../../../src/services/firestore/batch.repository');
      const doc = await firestoreBatchRepository.getBatchByNumber(batchNumber);
      if (doc) return this.mapDoc(doc.id, doc);
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return mockDb.batches.get(batchNumber) || null;
  }
}

export const batchesRepository = new BatchesRepository();

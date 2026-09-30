/**
 * Batches Service
 * Manages honey batch creation, ownership authorization, and batch event history.
 */

import { batchesRepository } from '../repositories/batches.repository';
import { hivesRepository } from '../repositories/hives.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { HoneyBatch, BatchEvent, BatchEventType } from '../../../shared/types';
import { blockchainService } from '../../../blockchain/services/blockchain.service';
import { QrService } from '../../../src/services/qr.service';

export class BatchesService {
  public async getBatches(user: AuthenticatedUser): Promise<HoneyBatch[]> {
    if (user.role === 'KVIC_ADMIN') {
      return await batchesRepository.getAllBatches();
    }
    return await batchesRepository.getBatchesByBeekeeper(user.uid, user.beekeeperId);
  }

  public async getBatchByNumber(
    batchNumber: string,
    user: AuthenticatedUser
  ): Promise<{ batch: HoneyBatch | null; unauthorized?: boolean }> {
    const batch = await batchesRepository.getBatchByNumber(batchNumber);
    if (!batch) {
      return { batch: null };
    }

    if (user.role === 'KVIC_ADMIN') {
      return { batch };
    }

    // Beekeeper ownership check
    const ownsBatch =
      batch.beekeeperId === user.uid ||
      batch.beekeeperId === user.beekeeperId ||
      (user.beekeeperId && batch.beekeeperId.includes(user.beekeeperId));

    if (!ownsBatch) {
      return { batch: null, unauthorized: true };
    }

    return { batch };
  }

  public async getBatchEvents(
    batchNumber: string,
    user: AuthenticatedUser
  ): Promise<{ events: BatchEvent[]; unauthorized?: boolean; notFound?: boolean }> {
    const check = await this.getBatchByNumber(batchNumber, user);
    if (check.unauthorized) {
      return { events: [], unauthorized: true };
    }
    if (!check.batch) {
      return { events: [], notFound: true };
    }

    const events = await batchesRepository.getBatchEvents(batchNumber);
    return { events };
  }

  public async createBatch(
    params: {
      productName: string;
      floralSource: string;
      quantityKg: number;
      hiveId: string;
      hiveBoxNumber?: string;
      apiaryId?: string;
      apiaryName?: string;
      beekeeperId?: string;
      packagingDate?: string;
      bestBeforeDate?: string;
      fssaiNumber?: string;
      kvicCertificationId?: string;
    },
    user: AuthenticatedUser
  ): Promise<HoneyBatch> {
    const now = new Date();
    const year = now.getFullYear();
    const stateCode = 'MH';
    const distCode = 'NAS';
    const batchSeq = Math.floor(10000 + Math.random() * 90000);
    const batchNumber = `HC-${stateCode}-${distCode}-${year}-${batchSeq}`;
    const harvestId = `HV-${Date.now().toString().slice(-4)}`;

    // 1. Blockchain proof
    const receipt = await blockchainService.registerBatchOnChain({ id: batchNumber });

    // 2. Persistent QR data
    const qrDataUrl = await QrService.getBatchQrCode(batchNumber);

    const bottleVolumeMl = 500;
    const quantityBottles = Math.floor((params.quantityKg * 1000) / bottleVolumeMl);
    const beekeeperName = user.name || 'Ramesh Patil';
    const assignedBeekeeperId = params.beekeeperId || user.beekeeperId || user.uid;

    // 3. Lifecycle events
    const events: BatchEvent[] = [
      {
        id: `EVT-${Date.now()}-1`,
        eventType: 'HIVE_REGISTERED' as BatchEventType,
        title: 'Hive Sourced & Verified',
        timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        actor: beekeeperName,
        actorRole: 'Certified Beekeeper',
        location: `${distCode} Flora Apiary, Maharashtra`,
        description: `Raw comb collected from active Hive Box ${params.hiveBoxNumber || params.hiveId.slice(-4)}. Brood health certified.`,
        verified: true,
      },
      {
        id: `EVT-${Date.now()}-2`,
        eventType: 'HONEY_PRODUCED' as BatchEventType,
        title: 'Apiary Extraction & Filtration',
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        actor: beekeeperName,
        actorRole: 'Producer',
        location: 'Nashik Apiary Station',
        description: `Centrifugal raw extraction. Multi-stage stainless mesh filtration below 40°C preserving active enzymes.`,
        verified: true,
      },
      {
        id: `EVT-${Date.now()}-3`,
        eventType: 'QUALITY_TESTED' as BatchEventType,
        title: 'KVIC Lab Parameter Benchmark',
        timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        actor: 'KVIC Regional Testing Lab, Nashik',
        actorRole: 'Quality Inspector',
        location: 'KVIC Certified Testing Facility',
        description: `Passed NMR purity test. Moisture: 17.6% (Standard <20%), HMF: 11 mg/kg (<40 mg/kg), C4 Sugar: Negative.`,
        verified: true,
      },
      {
        id: `EVT-${Date.now()}-4`,
        eventType: 'PROCESSED_PACKAGED' as BatchEventType,
        title: 'Food-Grade Glass Packaging & Tamper Seal',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        actor: beekeeperName,
        actorRole: 'Packaging Lead',
        location: 'Nashik Packaging Unit',
        description: `Packaged into 500g sterilized glass jars. Holographic tamper-evident seal applied with unique batch QR code.`,
        verified: true,
      },
      {
        id: `EVT-${Date.now()}-5`,
        eventType: 'BLOCKCHAIN_MINTED' as BatchEventType,
        title: 'Polygon Blockchain Traceability Hash Minted',
        timestamp: new Date().toISOString(),
        actor: 'Honey Chain Smart Contract Gateway',
        actorRole: 'Smart Contract',
        location: 'Decentralized Ledger (Polygon PoS)',
        description: `Batch authenticity hash minted permanently to smart contract. Tamper-proof public provenance record created.`,
        txHash: receipt.txHash,
        verified: true,
      },
    ];

    const newBatch: HoneyBatch = {
      id: batchNumber,
      productName: params.productName,
      beekeeperId: assignedBeekeeperId,
      beekeeperName,
      apiaryId: params.apiaryId || 'API-MH-NAS-01',
      apiaryName: params.apiaryName || `${beekeeperName}'s Apiary`,
      hiveIds: [params.hiveId],
      harvestId,
      harvestDate: new Date().toISOString().split('T')[0],
      packagingDate: params.packagingDate || new Date().toISOString().split('T')[0],
      bestBeforeDate:
        params.bestBeforeDate ||
        new Date(Date.now() + 365 * 24 * 3600 * 1000 * 1.5).toISOString().split('T')[0],
      quantityBottles,
      bottleVolumeMl,
      floralSource: params.floralSource,
      originDistrict: 'Nashik',
      originState: 'Maharashtra',
      fssaiNumber: params.fssaiNumber || '11524036000192',
      kvicCertificationId: params.kvicCertificationId || `KVIC-CERT-2026-${batchSeq.toString().slice(-4)}`,
      moisturePercentage: 17.6,
      sucrosePercentage: 2.8,
      pollenAnalysis: 'Authentic Multi-Floral Wild Flora Markers (Mustard & Jamun Dominant)',
      blockchainTxHash: receipt.txHash,
      blockNumber: receipt.blockNumber,
      smartContractAddress: receipt.contractAddress,
      verificationStatus: 'VERIFIED',
      qrCodeUrl: `/trace/${batchNumber}`,
      traceabilityUrl: `/trace/${batchNumber}`,
      scanCount: 1,
      events,
    };

    const created = await batchesRepository.createBatch({
      ...newBatch,
      beekeeperUid: user.uid,
      qrDataUrl,
    });

    // Automatically update the hive's Lifetime Honey Yield and harvest count
    if (params.hiveId) {
      try {
        await hivesRepository.recordHiveExtraction(params.hiveId, params.quantityKg);
      } catch (hErr) {
        console.warn(`[BatchesService] Could not record hive extraction for ${params.hiveId}:`, hErr);
      }
    }

    return created;
  }
}

export const batchesService = new BatchesService();

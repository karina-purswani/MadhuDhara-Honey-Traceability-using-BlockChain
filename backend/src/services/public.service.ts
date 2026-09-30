/**
 * Public Service
 * Sanitizes and protects consumer-facing batch verification data.
 */

import { publicRepository } from '../repositories/public.repository';
import { FirestorePublicBatchDoc } from '../../../src/services/firestore/types';

export class PublicService {
  public async getPublicBatch(batchNumber: string): Promise<FirestorePublicBatchDoc | null> {
    const raw = await publicRepository.getPublicBatch(batchNumber);
    if (!raw) {
      return null;
    }

    // Explicit sanitize: only consumer-safe public fields
    return {
      batchNumber: raw.batchNumber,
      productName: raw.productName,
      floralSource: raw.floralSource,
      harvestDate: raw.harvestDate,
      packagingDate: raw.packagingDate,
      bestBeforeDate: raw.bestBeforeDate,
      beekeeperName: raw.beekeeperName,
      originDistrict: raw.originDistrict,
      originState: raw.originState,
      fssaiNumber: raw.fssaiNumber,
      kvicCertificationId: raw.kvicCertificationId,
      moisturePercentage: raw.moisturePercentage,
      sucrosePercentage: raw.sucrosePercentage,
      blockchainTxHash: raw.blockchainTxHash,
      blockNumber: raw.blockNumber,
      smartContractAddress: raw.smartContractAddress,
      verificationStatus: raw.verificationStatus,
      qrCodeUrl: raw.qrCodeUrl,
      traceabilityUrl: raw.traceabilityUrl,
      qrDataUrl: raw.qrDataUrl,
      scanCount: raw.scanCount,
      events: raw.events || [],
      suspiciousReason: raw.suspiciousReason,
      updatedAt: raw.updatedAt,
    };
  }
}

export const publicService = new PublicService();

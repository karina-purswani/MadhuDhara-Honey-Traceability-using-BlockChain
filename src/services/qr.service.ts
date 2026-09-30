/**
 * Persistent QR Service (Phase 2B)
 * Generates and stores deterministic QR codes in Firestore `qr_records/{batchNumber}`.
 * Rule: The QR code is minted upon batch creation and remains persistent throughout the batch lifecycle,
 * surviving page refreshes, logouts, different browsers, and different devices.
 */

import QRCode from 'qrcode';
import { firestoreQrRepository } from './firestore/qr.repository';

export interface QrCodePayload {
  batchNumber: string;
  traceabilityUrl: string;
  qrDataUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Local session L1 cache to avoid redundant network round-trips within the same page lifecycle
const qrMemoryCache: Map<string, string> = new Map();

export class QrService {
  /**
   * Retrieves or creates the persistent QR code for an existing honey batch.
   * Checks Firestore `qr_records/{batchNumber}` first before generating a new QR.
   */
  public static async getBatchQrCode(
    batchNumber: string,
    baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://honeychain.app'
  ): Promise<string> {
    const cleanBatch = batchNumber.trim();
    if (!cleanBatch) return '';

    // 1. Check in-memory L1 cache
    if (qrMemoryCache.has(cleanBatch)) {
      return qrMemoryCache.get(cleanBatch)!;
    }

    const traceabilityUrl = `${baseUrl}/trace/${encodeURIComponent(cleanBatch)}`;

    // 2. Check Firestore persistent storage
    try {
      const existingRecord = await firestoreQrRepository.getQrRecord(cleanBatch);
      if (existingRecord && existingRecord.qrDataUrl) {
        qrMemoryCache.set(cleanBatch, existingRecord.qrDataUrl);
        return existingRecord.qrDataUrl;
      }
    } catch (err) {
      console.warn(`QrService: Could not read QR record for ${cleanBatch} from Firestore:`, err);
    }

    // 3. Generate deterministic QR code if not already saved
    try {
      const qrDataUrl = await QRCode.toDataURL(traceabilityUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1c1917', // Stone-900
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      // 4. Save to Firestore for permanent cross-device persistence
      await firestoreQrRepository.saveQrRecord({
        batchNumber: cleanBatch,
        traceabilityUrl,
        qrDataUrl,
      });

      qrMemoryCache.set(cleanBatch, qrDataUrl);
      return qrDataUrl;
    } catch (err) {
      console.error('Failed to generate deterministic QR code:', err);
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" font-size="12" text-anchor="middle" fill="black">${cleanBatch}</text></svg>`;
    }
  }

  /**
   * Get the canonical public traceability URL for a batch.
   */
  public static getTraceabilityUrl(
    batchNumber: string,
    baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://honeychain.app'
  ): string {
    return `${baseUrl}/trace/${encodeURIComponent(batchNumber.trim())}`;
  }
}

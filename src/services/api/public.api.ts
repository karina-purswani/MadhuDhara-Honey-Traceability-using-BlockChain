/**
 * Public Batch Verification API Service
 * Interacts with unauthenticated /api/public/batches endpoints.
 */

import { apiClient } from './apiClient';
import { FirestorePublicBatchDoc } from '../firestore/types';

export async function getPublicBatch(batchNumber: string): Promise<FirestorePublicBatchDoc | null> {
  try {
    const res = await apiClient.get<FirestorePublicBatchDoc>(
      `/public/batches/${encodeURIComponent(batchNumber)}`
    );
    return res.data || null;
  } catch {
    return null;
  }
}

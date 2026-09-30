/**
 * Batches API Service
 * Interacts with backend /api/batches endpoints.
 */

import { apiClient } from './apiClient';
import { HoneyBatch, BatchEvent } from '../../../shared/types';

export async function getBatches(): Promise<HoneyBatch[]> {
  const res = await apiClient.get<HoneyBatch[]>('/batches', { requiresAuth: true });
  return res.data || [];
}

export async function getBatchByNumber(batchNumber: string): Promise<HoneyBatch | null> {
  try {
    const res = await apiClient.get<HoneyBatch>(`/batches/${encodeURIComponent(batchNumber)}`, {
      requiresAuth: true,
    });
    return res.data || null;
  } catch {
    return null;
  }
}

export async function getBatchEvents(batchNumber: string): Promise<BatchEvent[]> {
  try {
    const res = await apiClient.get<BatchEvent[]>(`/batches/${encodeURIComponent(batchNumber)}/events`, {
      requiresAuth: true,
    });
    return res.data || [];
  } catch {
    return [];
  }
}

export async function createBatch(data: {
  productName: string;
  floralSource: string;
  quantityKg: number;
  hiveId: string;
  hiveBoxNumber?: string;
  apiaryId?: string;
  apiaryName?: string;
}): Promise<HoneyBatch> {
  const res = await apiClient.post<HoneyBatch>('/batches', data, { requiresAuth: true });
  if (!res.data) {
    throw new Error(res.message || 'Failed to create honey batch');
  }
  return res.data;
}


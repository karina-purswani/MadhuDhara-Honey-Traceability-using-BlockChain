/**
 * Harvests API Service
 * Interacts with backend /api/harvests endpoints.
 */

import { apiClient } from './apiClient';
import { HarvestRecord } from '../../../shared/types';

export async function getHarvests(): Promise<HarvestRecord[]> {
  const res = await apiClient.get<HarvestRecord[]>('/harvests');
  return res.data || [];
}

export async function getHarvestById(harvestId: string): Promise<HarvestRecord | null> {
  try {
    const res = await apiClient.get<HarvestRecord>(`/harvests/${encodeURIComponent(harvestId)}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function createHarvest(data: {
  hiveId: string;
  apiaryId: string;
  quantityKg: number;
  floralSource: string;
  harvestDate?: string;
  moisturePercentage?: number;
  colorGrade?: string;
  notes?: string;
  batchId?: string;
}): Promise<HarvestRecord> {
  const res = await apiClient.post<HarvestRecord>('/harvests', data);
  if (!res.data) {
    throw new Error(res.message || 'Failed to create harvest record');
  }
  return res.data;
}

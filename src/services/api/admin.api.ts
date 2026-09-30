/**
 * Admin API Service (Phase 3B & 3C)
 * Communicates with the Express backend REST APIs for Admin System Stats,
 * Beekeepers Directory, and On-Demand Hierarchical Drill-Downs (Apiaries, Hives, Passports, IoT).
 */

import { apiClient } from './apiClient';
import type { AdminSystemStats, LightweightBeekeeperSummary } from '../firestore/index';
import type { Apiary, Hive, HiveReading, BeekeeperProfile } from '../../../shared/types';

export interface HiveDetailResponse {
  hive: Hive | null;
  beekeeper: BeekeeperProfile | null;
  apiary: Apiary | null;
}

/**
 * Fetches aggregate system statistics for the Admin dashboard via Express REST API.
 * GET /api/admin/stats
 */
export async function getAdminSystemStats(): Promise<AdminSystemStats> {
  try {
    const response = await apiClient.get<AdminSystemStats>('/admin/stats', {
      requiresAuth: true,
    });

    if (response.data) {
      return response.data;
    }
  } catch (apiErr) {
    console.warn('Express API /admin/stats notice, falling back to direct Firestore:', apiErr);
  }

  // Direct Firestore client fallback
  const { firestoreIdentityService } = await import('../firestore/index');
  return await firestoreIdentityService.getAdminSystemStats();
}

/**
 * Fetches lightweight beekeeper directory records via Express REST API.
 * GET /api/beekeepers
 */
export async function getAdminBeekeepers(
  district?: string
): Promise<LightweightBeekeeperSummary[]> {
  try {
    const response = await apiClient.get<LightweightBeekeeperSummary[]>('/beekeepers', {
      requiresAuth: true,
      params: district ? { district } : undefined,
    });

    if (response.data && response.data.length > 0) {
      return response.data;
    }
  } catch (apiErr) {
    console.warn('Express API /beekeepers notice, falling back to direct Firestore:', apiErr);
  }

  // Direct Firestore client fallback
  const { firestoreIdentityService } = await import('../firestore/index');
  const list = await firestoreIdentityService.getLightweightBeekeepers();
  if (district && district.trim()) {
    return list.filter(
      (b) => b.district.toLowerCase() === district.trim().toLowerCase()
    );
  }
  return list;
}

/**
 * Fetches apiaries belonging to a specific beekeeper on demand via Express REST API.
 * GET /api/beekeepers/:beekeeperId/apiaries
 */
export async function getBeekeeperApiaries(beekeeperId: string): Promise<Apiary[]> {
  const response = await apiClient.get<Apiary[]>(
    `/beekeepers/${encodeURIComponent(beekeeperId)}/apiaries`,
    {
      requiresAuth: true,
    }
  );

  return response.data || [];
}

/**
 * Fetches hives belonging to a specific apiary on demand via Express REST API.
 * GET /api/apiaries/:apiaryId/hives
 */
export async function getApiaryHives(apiaryId: string): Promise<Hive[]> {
  const response = await apiClient.get<Hive[]>(
    `/apiaries/${encodeURIComponent(apiaryId)}/hives`,
    {
      requiresAuth: true,
    }
  );

  return response.data || [];
}

/**
 * Fetches digital passport details for a selected hive via Express REST API.
 * GET /api/hives/:hiveId
 */
export async function getHiveDetail(hiveId: string): Promise<HiveDetailResponse> {
  const response = await apiClient.get<HiveDetailResponse>(
    `/hives/${encodeURIComponent(hiveId)}`,
    {
      requiresAuth: true,
    }
  );

  if (!response.data) {
    throw new Error(response.message || `No data received for hive ${hiveId}`);
  }

  return response.data;
}

/**
 * Fetches the latest simulated IoT sensor reading for a selected hive via Express REST API.
 * GET /api/hives/:hiveId/iot/latest
 */
export async function getLatestHiveReading(hiveId: string): Promise<HiveReading> {
  const response = await apiClient.get<HiveReading>(
    `/hives/${encodeURIComponent(hiveId)}/iot/latest`,
    {
      requiresAuth: true,
    }
  );

  if (!response.data) {
    throw new Error(response.message || `No sensor reading received for hive ${hiveId}`);
  }

  return response.data;
}

/**
 * Alerts API Service
 * Interacts with backend /api/alerts endpoints.
 */

import { apiClient } from './apiClient';
import { HiveAlert } from '../../../shared/types';

export async function getAlerts(): Promise<HiveAlert[]> {
  const res = await apiClient.get<HiveAlert[]>('/alerts');
  return res.data || [];
}

export async function getAlertById(alertId: string): Promise<HiveAlert | null> {
  try {
    const res = await apiClient.get<HiveAlert>(`/alerts/${encodeURIComponent(alertId)}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function createAlert(data: {
  hiveId: string;
  alertType: string;
  severity: string;
  title: string;
  description?: string;
  message?: string;
  observedValues?: string;
  observedValue?: string;
  idealRange?: string;
  recommendedAction?: string;
  healthScore?: number;
}): Promise<HiveAlert> {
  const payload = {
    ...data,
    description: data.description || data.message || '',
    observedValues: data.observedValues || data.observedValue,
  };
  const res = await apiClient.post<HiveAlert>('/alerts', payload);
  if (!res.data) {
    throw new Error(res.message || 'Failed to create alert');
  }
  return res.data;
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    const res = await apiClient.patch<{ acknowledged: boolean }>(
      `/alerts/${encodeURIComponent(alertId)}/acknowledge`
    );
    return res.data?.acknowledged ?? true;
  } catch {
    return false;
  }
}

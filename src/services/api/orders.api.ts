/**
 * Orders API Service
 * Interacts with backend /api/orders endpoints.
 */

import { apiClient } from './apiClient';
import { OrderRequest } from '../../../shared/types';

export async function createOrderRequest(data: {
  productId: string;
  batchNumber: string;
  beekeeperUid: string;
  productName?: string;
  beekeeperId?: string;
  beekeeperName?: string;
  consumerName?: string;
  consumerContact?: string;
  consumerMessage?: string;
  requestedQuantity?: number;
}): Promise<OrderRequest> {
  const res = await apiClient.post<OrderRequest>('/orders', data);
  if (!res.data) {
    throw new Error(res.message || 'Failed to submit order request');
  }
  return res.data;
}

export async function getOrderRequests(): Promise<OrderRequest[]> {
  const res = await apiClient.get<OrderRequest[]>('/orders');
  return res.data || [];
}

export async function getOrderRequestById(orderId: string): Promise<OrderRequest | null> {
  try {
    const res = await apiClient.get<OrderRequest>(`/orders/${encodeURIComponent(orderId)}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
): Promise<boolean> {
  try {
    await apiClient.patch(`/orders/${encodeURIComponent(orderId)}/status`, { status });
    return true;
  } catch {
    return false;
  }
}

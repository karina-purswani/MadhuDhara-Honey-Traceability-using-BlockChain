/**
 * Marketplace API Service
 * Interacts with backend /api/marketplace endpoints.
 */

import { apiClient } from './apiClient';
import { MarketplaceProduct } from '../../../shared/types';

export async function getMarketplaceProducts(myOnly = false): Promise<MarketplaceProduct[]> {
  const url = myOnly ? '/marketplace/products?my=true' : '/marketplace/products';
  const res = await apiClient.get<MarketplaceProduct[]>(url);
  return res.data || [];
}

export async function getMarketplaceProductById(productId: string): Promise<MarketplaceProduct | null> {
  try {
    const res = await apiClient.get<MarketplaceProduct>(
      `/marketplace/products/${encodeURIComponent(productId)}`
    );
    return res.data || null;
  } catch {
    return null;
  }
}

export async function createMarketplaceProduct(data: {
  batchNumber?: string;
  batchId?: string;
  title: string;
  priceInr: number;
  availableStockBottles: number;
  description: string;
  producerLocation?: string;
  floralType?: string;
  weightGrams?: number;
  contactNumber?: string;
  harvestDate?: string;
  imageUrl?: string;
}): Promise<MarketplaceProduct> {
  const payload = {
    ...data,
    batchNumber: data.batchNumber || data.batchId || '',
  };
  const res = await apiClient.post<MarketplaceProduct>('/marketplace/products', payload);
  if (!res.data) {
    throw new Error(res.message || 'Failed to create marketplace listing');
  }
  return res.data;
}

export async function deleteMarketplaceProduct(productId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/marketplace/products/${encodeURIComponent(productId)}`);
    return true;
  } catch {
    return false;
  }
}

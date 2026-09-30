/**
 * Backend Admin & Beekeeper Domain Types
 * Matches the institutional KVIC Admin schema established in Phase 2F.
 */

import { Apiary, Hive, BeekeeperProfile } from '../../../shared/types';

export interface AdminSystemStats {
  registeredBeekeepers: number;
  activeApiaries: number;
  registeredHives: number;
  honeyBatches: number;
  tickets: {
    open: number;
    inReview: number;
    resolved: number;
    total: number;
  };
  publishedLearning: number;
  marketplace: {
    activeListings: number;
    totalOrders: number;
    pendingOrders: number;
  };
  activeAlertsCount: number;
}

export interface LightweightBeekeeperSummary {
  firebaseUid: string;
  beekeeperId: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  state: string;
  village: string;
  kvicRegistrationNumber: string;
  totalApiaries: number;
  totalHives: number;
  status: string;
}

export interface HiveDetailResponse {
  hive: Hive | null;
  beekeeper: BeekeeperProfile | null;
  apiary: Apiary | null;
}

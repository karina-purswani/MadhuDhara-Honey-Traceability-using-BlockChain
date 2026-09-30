/**
 * Honey Chain - Firestore Schema & Document Definitions (Phase 2A)
 * Maps Firebase UID permanently across users -> beekeepers -> apiaries -> hives.
 */

import { LanguageCode } from '../../../shared/types';

export interface FirestoreUserDoc {
  firebaseUid: string;
  role: 'beekeeper' | 'admin';
  name: string;
  email: string;
  phone?: string;
  preferredLanguage: LanguageCode;
  beekeeperId?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreBeekeeperDoc {
  firebaseUid: string;
  beekeeperId: string;
  name: string;
  email: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  experienceYears: number;
  kvicRegistrationNumber: string;
  preferredLanguage: LanguageCode;
  totalApiaries: number;
  totalHives: number;
  onboardingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreApiaryDoc {
  id: string;
  apiaryId: string;
  beekeeperUid: string;
  beekeeperId: string;
  name: string;
  locationName: string;
  village: string;
  district: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  floraType: string[];
  hiveCount: number;
  status: 'active' | 'seasonal_migration' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreHiveDoc {
  id: string;
  hiveId: string;
  beekeeperUid: string;
  beekeeperId: string;
  apiaryId: string;
  boxNumber: string;
  beeSpecies: string;
  installationDate: string;
  queenAgeMonths: number;
  currentHealthScore: number;
  status: 'healthy' | 'attention' | 'critical' | 'dormant';
  lastInspectionDate: string;
  hasIoTUnit: boolean;
  iotDeviceId: string;
  batteryLevel: number;
  totalHarvestsCount: number;
  lifetimeHoneyYieldKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreHarvestDoc {
  id: string;
  harvestId: string;
  beekeeperUid: string;
  beekeeperId: string;
  hiveId: string;
  apiaryId: string;
  harvestDate: string;
  quantityKg: number;
  floralSource: string;
  moisturePercentage: number;
  colorGrade: string;
  notes?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreBatchEventDoc {
  id: string;
  eventId: string;
  batchNumber: string;
  eventType: string;
  title: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  location: string;
  description: string;
  txHash?: string;
  verified: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface FirestoreBatchDoc {
  id: string;
  batchNumber: string;
  beekeeperUid: string;
  beekeeperId: string;
  beekeeperName: string;
  apiaryId: string;
  apiaryName: string;
  hiveIds: string[];
  harvestId: string;
  productName: string;
  floralSource: string;
  harvestDate: string;
  packagingDate: string;
  bestBeforeDate: string;
  quantityBottles: number;
  bottleVolumeMl: number;
  originDistrict: string;
  originState: string;
  fssaiNumber: string;
  kvicCertificationId: string;
  moisturePercentage: number;
  sucrosePercentage: number;
  pollenAnalysis: string;
  blockchainTxHash: string;
  blockNumber: number;
  smartContractAddress: string;
  verificationStatus: 'VERIFIED' | 'SUSPICIOUS' | 'INVALID';
  qrCodeUrl: string;
  traceabilityUrl: string;
  scanCount: number;
  events: FirestoreBatchEventDoc[];
  suspiciousReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreQrDoc {
  batchNumber: string;
  traceabilityUrl: string;
  qrDataUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestorePublicBatchDoc {
  batchNumber: string;
  productName: string;
  floralSource: string;
  harvestDate: string;
  packagingDate: string;
  bestBeforeDate: string;
  beekeeperName: string;
  originDistrict: string;
  originState: string;
  fssaiNumber: string;
  kvicCertificationId: string;
  moisturePercentage: number;
  sucrosePercentage: number;
  blockchainTxHash: string;
  blockNumber: number;
  smartContractAddress: string;
  verificationStatus: 'VERIFIED' | 'SUSPICIOUS' | 'INVALID';
  qrCodeUrl: string;
  traceabilityUrl: string;
  qrDataUrl: string;
  scanCount: number;
  events: {
    id: string;
    eventType: string;
    title: string;
    timestamp: string;
    actor: string;
    actorRole: string;
    location: string;
    description: string;
    txHash?: string;
    verified: boolean;
  }[];
  suspiciousReason?: string;
  updatedAt: string;
}

export interface FirestoreAlertDoc {
  id: string;
  alertId: string;
  beekeeperUid: string;
  beekeeperId: string;
  hiveId: string;
  alertType: 'temperature' | 'humidity' | 'weight' | 'activity' | 'general';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  observedValues: string;
  idealRange: string;
  recommendedAction: string;
  healthScore: number;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'ticket_created';
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  linkedTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreTicketDoc {
  id: string;
  ticketId: string;
  beekeeperUid: string;
  beekeeperId: string;
  beekeeperName: string;
  hiveId?: string;
  alertId?: string;
  title: string;
  description: string;
  category: 'hive_health' | 'disease' | 'equipment' | 'market_linkage' | 'kvic_scheme';
  status: 'OPEN' | 'IN REVIEW' | 'RESPONDED' | 'RESOLVED';
  sensorSnapshot?: {
    temperature: number;
    humidity: number;
    weight: number;
    healthScore: number;
    timestamp?: string;
  };
  healthScore: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreTicketMessageDoc {
  id: string;
  messageId: string;
  ticketId: string;
  senderUid: string;
  senderName: string;
  senderRole: 'beekeeper' | 'admin';
  message: string;
  createdAt: string;
}

export interface FirestoreLearningContentDoc {
  id: string;
  contentId: string;
  title: string;
  description: string;
  category: 'hive_management' | 'disease_control' | 'extraction' | 'kvic_schemes' | 'market_sales';
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration: number;
  durationMinutes: number;
  language: LanguageCode;
  targetLanguage?: string;
  publishedBy: string;
  publishedAt: string;
  viewsCount: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreNotificationDoc {
  id: string;
  notificationId: string;
  recipientUid: string;
  userId?: string;
  type: 'learning' | 'alert' | 'ticket' | 'market' | 'system';
  title: string;
  message: string;
  relatedContentId?: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface FirestoreMarketplaceProductDoc {
  id: string;
  productId: string;
  beekeeperUid: string;
  beekeeperId: string;
  beekeeperName: string;
  batchNumber: string;
  batchId: string;
  productName: string;
  title: string;
  productType: string;
  floralType: string;
  description: string;
  price: number;
  priceInr: number;
  quantityAvailable: number;
  availableStockBottles: number;
  unit: string;
  weightGrams: number;
  imageUrl?: string;
  location: string;
  producerLocation: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS';
  verifiedBadge: boolean;
  batchVerificationReference: string;
  harvestDate: string;
  contactNumber: string;
  status: 'active' | 'out_of_stock' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreOrderRequestDoc {
  id: string;
  orderRequestId: string;
  productId: string;
  batchNumber: string;
  batchId: string;
  beekeeperUid: string;
  beekeeperId: string;
  productName: string;
  consumerName?: string;
  consumerContact?: string;
  consumerMessage?: string;
  requestedQuantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}


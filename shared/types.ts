/**
 * Honey Chain - Shared TypeScript Domain Models and Interfaces
 * Core domain entities connecting Beekeeper -> Apiary -> Hive -> IoT -> Health -> Harvest -> Batch -> Blockchain -> QR -> Consumer
 */

export type UserRole = 'beekeeper' | 'admin' | 'consumer';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'beekeeper' | 'admin';
  firebaseUid?: string;
  passwordHash?: string;
  preferredLanguage: LanguageCode;
  district?: string;
  state?: string;
  avatarUrl?: string;
}

export interface BeekeeperProfile extends User {
  role: 'beekeeper';
  beekeeperId: string;
  kvicRegistrationNumber: string;
  village: string;
  district: string;
  state: string;
  totalApiaries: number;
  totalHives: number;
  onboardingDate: string;
  experienceYears: number;
}

export interface Apiary {
  id: string;
  name: string;
  beekeeperId: string;
  locationName: string;
  village: string;
  district: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  floraType: string[]; // e.g. ['Mustard', 'Wild Forest', 'Sunflower', 'Acacia', 'Jamun']
  hiveCount: number;
  status: 'active' | 'seasonal_migration' | 'maintenance';
  createdAt: string;
}

export interface Hive {
  id: string; // Unique Honey Chain Hive ID: e.g. "HC-HIVE-MH-NAS-00123"
  apiaryId: string;
  beekeeperId: string;
  boxNumber: string;
  beeSpecies: string; // e.g. "Apis cerana indica" | "Apis mellifera" | "Apis dorsata"
  installationDate: string;
  queenAgeMonths: number;
  currentHealthScore: number; // 0 - 100
  status: 'healthy' | 'attention' | 'critical' | 'dormant';
  lastInspectionDate: string;
  hasIoTUnit: boolean;
  iotDeviceId?: string;
  batteryLevel?: number; // 0 - 100%
  totalHarvestsCount: number;
  lifetimeHoneyYieldKg: number;
}

export interface HiveReading {
  id: string;
  hiveId: string;
  timestamp: string;
  temperature: number; // in Celsius (Ideal brood ~34.0°C - 35.5°C)
  humidity: number; // in % (Ideal ~50% - 65%)
  weight: number; // in kg (Brood box + honey supers)
  activityLevel: 'low' | 'normal' | 'high' | 'agitated';
  acousticFrequencyHz?: number; // Hive sound frequency (400-500Hz normal, >600Hz swarming / queen distress)
  batteryVoltage?: number;
  healthScore?: number;
}

export interface HealthScoreBreakdown {
  overallScore: number; // 0 - 100
  temperatureScore: number; // 0 - 100
  humidityScore: number; // 0 - 100
  weightTrendScore: number; // 0 - 100
  activityScore: number; // 0 - 100
  status: 'healthy' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  factors: string[];
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface HiveAlert {
  id: string;
  hiveId: string;
  beekeeperId: string;
  timestamp: string;
  severity: AlertSeverity;
  parameter: 'temperature' | 'humidity' | 'weight' | 'activity' | 'general';
  title: string;
  message: string;
  observedValue: string;
  idealRange: string;
  recommendedAction: string;
  isAcknowledged: boolean;
  linkedTicketId?: string;
}

export interface DiseaseAssessment {
  id: string;
  hiveId: string;
  beekeeperId: string;
  timestamp: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  suspectedCondition: string; // e.g. "Varroa Mite Infestation Indicators", "Nosema Risk", "Foulbrood Alert"
  confidencePercentage: number;
  supportingFactors: string[];
  recommendedSteps: string[];
  imageUrl?: string;
  beekeeperNotes?: string;
}

export interface YieldPrediction {
  hiveId: string;
  timestamp: string;
  estimatedYieldKg: number;
  confidenceRange: { min: number; max: number };
  trend: 'Increasing' | 'Stable' | 'Declining';
  daysToOptimalHarvest: number;
  factors: {
    weightAccumulationRate: string;
    floweringSeasonScore: string;
    colonyStrength: string;
  };
}

export interface HarvestRecord {
  id: string; // e.g. "HV-2026-0042"
  hiveId: string;
  apiaryId: string;
  beekeeperId: string;
  harvestDate: string;
  quantityKg: number;
  floralSource: string;
  moisturePercentage: number; // Ideal < 20%
  colorGrade: string; // e.g. "Extra Light Amber", "Amber", "Dark Amber"
  notes?: string;
  batchId?: string; // Associated honey batch
}

export type BatchEventType = 
  | 'HIVE_REGISTERED'
  | 'HONEY_PRODUCED'
  | 'HARVESTED'
  | 'EXTRACTED'
  | 'QUALITY_TESTED'
  | 'PROCESSED_PACKAGED'
  | 'BLOCKCHAIN_MINTED'
  | 'DISTRIBUTED';

export interface BatchEvent {
  id: string;
  eventType: BatchEventType;
  title: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  location: string;
  description: string;
  txHash?: string;
  verified: boolean;
  metadata?: Record<string, any>;
}

export type BatchVerificationStatus = 'VERIFIED' | 'SUSPICIOUS' | 'INVALID';

export interface HoneyBatch {
  id: string; // Batch Number: e.g. "HC-MH-NAS-2026-00047"
  productName: string; // e.g. "Pure Raw Multi-Floral Sahyadri Honey"
  beekeeperId: string;
  beekeeperName: string;
  apiaryId: string;
  apiaryName: string;
  hiveIds: string[];
  harvestId: string;
  harvestDate: string;
  packagingDate: string;
  bestBeforeDate: string;
  quantityBottles: number;
  bottleVolumeMl: number;
  floralSource: string;
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
  verificationStatus: BatchVerificationStatus;
  qrCodeUrl: string; // Traceability route: `/trace/HC-MH-NAS-2026-00047`
  traceabilityUrl: string;
  scanCount: number;
  events: BatchEvent[];
  suspiciousReason?: string;
}

export interface MarketplaceProduct {
  id: string;
  productId?: string;
  batchId: string;
  batchNumber?: string;
  title: string;
  productName?: string;
  beekeeperUid?: string;
  beekeeperId: string;
  beekeeperName: string;
  producerLocation: string;
  floralType: string;
  productType?: string;
  priceInr: number;
  weightGrams: number;
  unit?: string;
  availableStockBottles: number;
  quantityAvailable?: number;
  verifiedBadge: boolean;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS';
  batchVerificationReference?: string;
  harvestDate: string;
  description: string;
  imageUrl?: string;
  contactNumber: string;
  status?: 'active' | 'out_of_stock' | 'draft' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderRequest {
  id: string;
  orderRequestId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  beekeeperUid: string;
  beekeeperId: string;
  beekeeperName?: string;
  requestedQuantity: number;
  consumerName?: string;
  consumerContact?: string;
  consumerMessage?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string; // e.g. "HC-T-1023"
  beekeeperId: string;
  beekeeperName: string;
  hiveId?: string;
  alertId?: string;
  title: string;
  category: 'hive_health' | 'disease' | 'equipment' | 'market_linkage' | 'kvic_scheme';
  status: 'OPEN' | 'IN REVIEW' | 'RESPONDED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  prefilledTelemetry?: {
    temperature: number;
    humidity: number;
    weight: number;
    healthScore: number;
  };
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'beekeeper' | 'admin';
  timestamp: string;
  message: string;
  attachmentUrl?: string;
}

export interface LearningContent {
  id: string;
  title: string;
  description: string;
  category: 'hive_management' | 'disease_control' | 'extraction' | 'kvic_schemes' | 'market_sales';
  youtubeUrl: string;
  thumbnailUrl?: string;
  durationMinutes: number;
  language: LanguageCode;
  publishedDate: string;
  authorName: string;
  viewsCount: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'learning' | 'ticket' | 'market' | 'system';
  timestamp: string;
  read: boolean;
  linkUrl?: string;
  relatedContentId?: string;
}

export interface ProfitCalculationInput {
  numberOfHives: number;
  expectedYieldPerHiveKg: number;
  sellingPricePerKg: number;
  packagingCostPerKg: number;
  transportCostPerKg: number;
  processingCostPerKg: number;
  equipmentMaintenancePerHive: number;
  feedingOtherCosts: number;
}

export interface ProfitCalculationResult {
  totalHoneyProducedKg: number;
  grossRevenueInr: number;
  totalOperationalCostsInr: number;
  netProfitInr: number;
  profitPerHiveInr: number;
  costPerKgInr: number;
  profitMarginPercent: number;
}

export interface ClusterStatistics {
  clusterId: string;
  name: string;
  state: string;
  district: string;
  registeredBeekeepers: number;
  registeredApiaries: number;
  activeHives: number;
  healthyHives: number;
  warningHives: number;
  criticalHives: number;
  totalHoneyProducedKg: number;
  activeBatchesCount: number;
  activeAlertsCount: number;
  openTicketsCount: number;
}

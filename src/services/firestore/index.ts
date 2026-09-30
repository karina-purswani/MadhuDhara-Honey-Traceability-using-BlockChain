/**
 * Honey Chain - Firestore Identity & Core Domain Service (Phase 2A & 2B)
 * Unified interface orchestrating Firestore User, Beekeeper, Apiary, Hive,
 * Harvest, Honey Batch, Batch Events, QR, and Public Verification repositories.
 */

import { firestoreUserRepository } from './user.repository';
import { firestoreBeekeeperRepository } from './beekeeper.repository';
import { firestoreApiaryRepository } from './apiary.repository';
import { firestoreHiveRepository } from './hive.repository';
import { firestoreHarvestRepository } from './harvest.repository';
import { firestoreBatchRepository } from './batch.repository';
import { firestoreQrRepository } from './qr.repository';
import { firestorePublicBatchRepository } from './public-batch.repository';
import { firestoreAlertRepository } from './alert.repository';
import { firestoreTicketRepository } from './ticket.repository';
import { firestoreLearningRepository } from './learning.repository';
import { firestoreNotificationRepository } from './notification.repository';
import { firestoreMarketplaceRepository } from './marketplace.repository';
import { firestoreOrderRequestRepository } from './order-request.repository';
import {
  FirestoreUserDoc,
  FirestoreBeekeeperDoc,
  FirestoreApiaryDoc,
  FirestoreHiveDoc,
  FirestoreHarvestDoc,
  FirestoreBatchDoc,
  FirestoreBatchEventDoc,
  FirestoreQrDoc,
  FirestorePublicBatchDoc,
  FirestoreAlertDoc,
  FirestoreTicketDoc,
  FirestoreTicketMessageDoc,
  FirestoreLearningContentDoc,
  FirestoreNotificationDoc,
  FirestoreMarketplaceProductDoc,
  FirestoreOrderRequestDoc,
} from './types';
import {
  BeekeeperProfile,
  User,
  Apiary,
  Hive,
  HoneyBatch,
  BatchEvent,
  HiveAlert,
  SupportTicket,
  TicketMessage,
  LearningContent,
  AppNotification,
  MarketplaceProduct,
  OrderRequest,
  LanguageCode,
} from '../../../shared/types';
import { blockchainService } from '../../../blockchain/services/blockchain.service';
import { QrService } from '../qr.service';
import { collection, getCountFromServer, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.service';
import { mockDb } from '../../../backend/src/repositories/mock.db';

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

export * from './types';
export * from './user.repository';
export * from './beekeeper.repository';
export * from './apiary.repository';
export * from './hive.repository';
export * from './harvest.repository';
export * from './batch.repository';
export * from './qr.repository';
export * from './public-batch.repository';
export * from './alert.repository';
export * from './ticket.repository';
export * from './learning.repository';
export * from './notification.repository';
export * from './marketplace.repository';
export * from './order-request.repository';

export class FirestoreIdentityService {
  /**
   * Initializes complete beekeeper identity and core apiary/hive documents in Firestore.
   */
  public async registerBeekeeperInFirestore(params: {
    firebaseUid: string;
    name: string;
    email: string;
    phone: string;
    village: string;
    district: string;
    state: string;
    experienceYears: number;
    preferredLanguage: LanguageCode;
    kvicRegistrationNumber?: string;
  }): Promise<{
    user: FirestoreUserDoc;
    beekeeper: BeekeeperProfile;
    apiaries: Apiary[];
    hives: Hive[];
  }> {
    const seq = Math.floor(1000 + Math.random() * 9000);
    const stateCode = params.state.slice(0, 2).toUpperCase() || 'MH';
    const distCode = params.district.slice(0, 3).toUpperCase() || 'NAS';
    const beekeeperId = `BK-${stateCode}-${distCode}-${seq}`;
    const kvicReg = params.kvicRegistrationNumber || `KVIC-HM-2026-${seq}`;

    // 1. Create User document in users/{firebaseUid}
    const userDoc = await firestoreUserRepository.createOrUpdateUser({
      firebaseUid: params.firebaseUid,
      role: 'beekeeper',
      name: params.name,
      email: params.email,
      phone: params.phone,
      preferredLanguage: params.preferredLanguage,
      beekeeperId,
      status: 'active',
    });

    // 2. Create Beekeeper document in beekeepers/{firebaseUid}
    const beekeeperDoc = await firestoreBeekeeperRepository.createOrUpdateBeekeeper({
      firebaseUid: params.firebaseUid,
      beekeeperId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      village: params.village,
      district: params.district,
      state: params.state,
      experienceYears: params.experienceYears,
      kvicRegistrationNumber: kvicReg,
      preferredLanguage: params.preferredLanguage,
      totalApiaries: 1,
      totalHives: 2,
      onboardingDate: new Date().toISOString().split('T')[0],
    });

    // 3. Create initial Apiary in apiaries/{apiaryId}
    const apiaryId = `API-${distCode}-${seq}`;
    const apiaryDoc = await firestoreApiaryRepository.createApiary({
      id: apiaryId,
      apiaryId,
      beekeeperUid: params.firebaseUid,
      beekeeperId,
      name: `${params.village} Flora Apiary`,
      locationName: `${params.village}, ${params.district}`,
      village: params.village,
      district: params.district,
      state: params.state,
      coordinates: { lat: 19.9975, lng: 73.7898 },
      floraType: ['Multi-Floral Wild Bloom', 'Mustard', 'Neem'],
      hiveCount: 2,
      status: 'active',
    });

    // 4. Create initial Hives in hives/{hiveId}
    const hive1Id = `HC-HIVE-${stateCode}-${distCode}-${seq}1`;
    const hive2Id = `HC-HIVE-${stateCode}-${distCode}-${seq}2`;

    const hive1Doc = await firestoreHiveRepository.createHive({
      id: hive1Id,
      hiveId: hive1Id,
      beekeeperUid: params.firebaseUid,
      beekeeperId,
      apiaryId,
      boxNumber: `H-${seq.toString().slice(-2)}A`,
      beeSpecies: 'Apis cerana indica',
      installationDate: new Date().toISOString().split('T')[0],
      queenAgeMonths: 4,
      currentHealthScore: 92,
      status: 'healthy',
      lastInspectionDate: new Date().toISOString().split('T')[0],
      hasIoTUnit: true,
      iotDeviceId: `IOT-ESP32-${seq}1`,
      batteryLevel: 98,
      totalHarvestsCount: 0,
      lifetimeHoneyYieldKg: 0,
    });

    const hive2Doc = await firestoreHiveRepository.createHive({
      id: hive2Id,
      hiveId: hive2Id,
      beekeeperUid: params.firebaseUid,
      beekeeperId,
      apiaryId,
      boxNumber: `H-${seq.toString().slice(-2)}B`,
      beeSpecies: 'Apis cerana indica',
      installationDate: new Date().toISOString().split('T')[0],
      queenAgeMonths: 3,
      currentHealthScore: 89,
      status: 'healthy',
      lastInspectionDate: new Date().toISOString().split('T')[0],
      hasIoTUnit: true,
      iotDeviceId: `IOT-ESP32-${seq}2`,
      batteryLevel: 95,
      totalHarvestsCount: 0,
      lifetimeHoneyYieldKg: 0,
    });

    const beekeeperProfile: BeekeeperProfile = {
      id: params.firebaseUid,
      firebaseUid: params.firebaseUid,
      name: beekeeperDoc.name,
      email: beekeeperDoc.email,
      phone: beekeeperDoc.phone,
      role: 'beekeeper',
      preferredLanguage: beekeeperDoc.preferredLanguage,
      beekeeperId: beekeeperDoc.beekeeperId,
      kvicRegistrationNumber: beekeeperDoc.kvicRegistrationNumber,
      village: beekeeperDoc.village,
      district: beekeeperDoc.district,
      state: beekeeperDoc.state,
      totalApiaries: beekeeperDoc.totalApiaries,
      totalHives: beekeeperDoc.totalHives,
      onboardingDate: beekeeperDoc.onboardingDate,
      experienceYears: beekeeperDoc.experienceYears,
    };

    const apiaries: Apiary[] = [
      {
        id: apiaryDoc.apiaryId,
        name: apiaryDoc.name,
        beekeeperId: apiaryDoc.beekeeperId,
        locationName: apiaryDoc.locationName,
        village: apiaryDoc.village,
        district: apiaryDoc.district,
        state: apiaryDoc.state,
        coordinates: apiaryDoc.coordinates,
        floraType: apiaryDoc.floraType,
        hiveCount: apiaryDoc.hiveCount,
        status: apiaryDoc.status,
        createdAt: apiaryDoc.createdAt,
      },
    ];

    const hives: Hive[] = [
      {
        id: hive1Doc.hiveId,
        apiaryId: hive1Doc.apiaryId,
        beekeeperId: hive1Doc.beekeeperId,
        boxNumber: hive1Doc.boxNumber,
        beeSpecies: hive1Doc.beeSpecies,
        installationDate: hive1Doc.installationDate,
        queenAgeMonths: hive1Doc.queenAgeMonths,
        currentHealthScore: hive1Doc.currentHealthScore,
        status: hive1Doc.status,
        lastInspectionDate: hive1Doc.lastInspectionDate,
        hasIoTUnit: hive1Doc.hasIoTUnit,
        iotDeviceId: hive1Doc.iotDeviceId,
        batteryLevel: hive1Doc.batteryLevel,
        totalHarvestsCount: hive1Doc.totalHarvestsCount,
        lifetimeHoneyYieldKg: hive1Doc.lifetimeHoneyYieldKg,
      },
      {
        id: hive2Doc.hiveId,
        apiaryId: hive2Doc.apiaryId,
        beekeeperId: hive2Doc.beekeeperId,
        boxNumber: hive2Doc.boxNumber,
        beeSpecies: hive2Doc.beeSpecies,
        installationDate: hive2Doc.installationDate,
        queenAgeMonths: hive2Doc.queenAgeMonths,
        currentHealthScore: hive2Doc.currentHealthScore,
        status: hive2Doc.status,
        lastInspectionDate: hive2Doc.lastInspectionDate,
        hasIoTUnit: hive2Doc.hasIoTUnit,
        iotDeviceId: hive2Doc.iotDeviceId,
        batteryLevel: hive2Doc.batteryLevel,
        totalHarvestsCount: hive2Doc.totalHarvestsCount,
        lifetimeHoneyYieldKg: hive2Doc.lifetimeHoneyYieldKg,
      },
    ];

    return {
      user: userDoc,
      beekeeper: beekeeperProfile,
      apiaries,
      hives,
    };
  }

  /**
   * Loads authenticated user profile and related collections from Firestore.
   */
  public async loadAuthenticatedProfile(firebaseUid: string): Promise<{
    userDoc: FirestoreUserDoc | null;
    beekeeperProfile: BeekeeperProfile | null;
    adminProfile: User | null;
    apiaries: Apiary[];
    hives: Hive[];
  }> {
    const userDoc = await firestoreUserRepository.getUser(firebaseUid);

    if (!userDoc) {
      return {
        userDoc: null,
        beekeeperProfile: null,
        adminProfile: null,
        apiaries: [],
        hives: [],
      };
    }

    if (userDoc.role === 'admin') {
      const adminProfile: User = {
        id: userDoc.firebaseUid,
        firebaseUid: userDoc.firebaseUid,
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone || '+91 94220 11928',
        role: 'admin',
        preferredLanguage: userDoc.preferredLanguage,
        district: 'Nashik',
        state: 'Maharashtra',
      };
      return {
        userDoc,
        beekeeperProfile: null,
        adminProfile,
        apiaries: [],
        hives: [],
      };
    }

    const bkDoc = await firestoreBeekeeperRepository.getBeekeeper(firebaseUid);
    const apiaryDocs = await firestoreApiaryRepository.getApiariesByBeekeeper(firebaseUid);
    const hiveDocs = await firestoreHiveRepository.getHivesByBeekeeper(firebaseUid);

    const beekeeperProfile: BeekeeperProfile = {
      id: firebaseUid,
      firebaseUid,
      name: bkDoc?.name || userDoc.name,
      email: bkDoc?.email || userDoc.email,
      phone: bkDoc?.phone || userDoc.phone || '',
      role: 'beekeeper',
      preferredLanguage: bkDoc?.preferredLanguage || userDoc.preferredLanguage,
      beekeeperId: bkDoc?.beekeeperId || userDoc.beekeeperId || 'BK-MH-NAS-0129',
      kvicRegistrationNumber: bkDoc?.kvicRegistrationNumber || 'KVIC-HM-2026-0001',
      village: bkDoc?.village || 'Dindori',
      district: bkDoc?.district || 'Nashik',
      state: bkDoc?.state || 'Maharashtra',
      totalApiaries: bkDoc?.totalApiaries || apiaryDocs.length || 1,
      totalHives: bkDoc?.totalHives || hiveDocs.length || 2,
      onboardingDate: bkDoc?.onboardingDate || new Date().toISOString().split('T')[0],
      experienceYears: bkDoc?.experienceYears || 3,
    };

    const apiaries: Apiary[] = apiaryDocs.map((a) => ({
      id: a.apiaryId,
      name: a.name,
      beekeeperId: a.beekeeperId,
      locationName: a.locationName,
      village: a.village,
      district: a.district,
      state: a.state,
      coordinates: a.coordinates,
      floraType: a.floraType,
      hiveCount: a.hiveCount,
      status: a.status,
      createdAt: a.createdAt,
    }));

    const hives: Hive[] = hiveDocs.map((h) => ({
      id: h.hiveId,
      apiaryId: h.apiaryId,
      beekeeperId: h.beekeeperId,
      boxNumber: h.boxNumber,
      beeSpecies: h.beeSpecies,
      installationDate: h.installationDate,
      queenAgeMonths: h.queenAgeMonths,
      currentHealthScore: h.currentHealthScore,
      status: h.status,
      lastInspectionDate: h.lastInspectionDate,
      hasIoTUnit: h.hasIoTUnit,
      iotDeviceId: h.iotDeviceId,
      batteryLevel: h.batteryLevel,
      totalHarvestsCount: h.totalHarvestsCount,
      lifetimeHoneyYieldKg: h.lifetimeHoneyYieldKg,
    }));

    return {
      userDoc,
      beekeeperProfile,
      adminProfile: null,
      apiaries,
      hives,
    };
  }

  /**
   * Seeds/ensures admin document in users/{firebaseUid} for designated admin UID.
   */
  public async ensureAdminDocument(firebaseUid: string, email: string, name: string): Promise<User> {
    const existing = await firestoreUserRepository.getUser(firebaseUid);
    if (!existing) {
      await firestoreUserRepository.createOrUpdateUser({
        firebaseUid,
        role: 'admin',
        name: name || 'Dr. Anil Joshi (KVIC Officer)',
        email: email.toLowerCase().trim(),
        phone: '+91 94220 11928',
        preferredLanguage: 'en',
        status: 'active',
      });
    }

    return {
      id: firebaseUid,
      firebaseUid,
      name: existing?.name || name || 'Dr. Anil Joshi (KVIC Officer)',
      email: existing?.email || email,
      phone: existing?.phone || '+91 94220 11928',
      role: 'admin',
      preferredLanguage: existing?.preferredLanguage || 'en',
      district: 'Nashik',
      state: 'Maharashtra',
    };
  }

  /**
   * Creates a complete Honey Production record in Firestore:
   * Harvest -> Honey Batch -> Batch Events -> Persistent QR -> Sanitized Public Document
   */
  public async createHoneyBatchInFirestore(params: {
    beekeeperUid: string;
    beekeeperProfile: BeekeeperProfile;
    productName: string;
    floralSource: string;
    quantityKg: number;
    hiveId: string;
    hiveBoxNumber?: string;
    apiaryId?: string;
    apiaryName?: string;
    existingBatchesCount: number;
  }): Promise<HoneyBatch> {
    const year = new Date().getFullYear();
    const batchSeq = String(params.existingBatchesCount + 48).padStart(5, '0');
    const distCode = params.beekeeperProfile.district?.slice(0, 3).toUpperCase() || 'NAS';
    const stateCode = params.beekeeperProfile.state?.slice(0, 2).toUpperCase() || 'MH';
    const batchNumber = `HC-${stateCode}-${distCode}-${year}-${batchSeq}`;
    const harvestId = `HV-${Date.now().toString().slice(-4)}`;

    // 1. Simulated Blockchain Ledger Minting (Preserved Mock)
    const receipt = await blockchainService.registerBatchOnChain({ id: batchNumber });

    // 2. Persistent QR Code generation & Firestore storage
    const qrDataUrl = await QrService.getBatchQrCode(batchNumber);

    // 3. Create Harvest in Firestore: harvests/{harvestId}
    await firestoreHarvestRepository.createHarvest({
      id: harvestId,
      harvestId,
      beekeeperUid: params.beekeeperUid,
      beekeeperId: params.beekeeperProfile.beekeeperId,
      hiveId: params.hiveId,
      apiaryId: params.apiaryId || 'API-MH-NAS-01',
      harvestDate: new Date().toISOString().split('T')[0],
      quantityKg: params.quantityKg,
      floralSource: params.floralSource,
      moisturePercentage: 17.6,
      colorGrade: 'Light Amber',
      notes: `Fresh comb extraction from Hive Box ${params.hiveBoxNumber || 'H024'}.`,
      batchId: batchNumber,
    });

    // 4. Batch Lifecycle Events
    const events: BatchEvent[] = [
      {
        id: `EVT-${Date.now()}-1`,
        eventType: 'HIVE_REGISTERED',
        title: 'Origin Hive Digital Passport Verified',
        timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        actor: `${params.beekeeperProfile.name} (KVIC Beekeeper)`,
        actorRole: 'Beekeeper',
        location: `${params.beekeeperProfile.village || 'Dindori'}, ${params.beekeeperProfile.district || 'Nashik'}`,
        description: `Harvest linked to authenticated Hive ${params.hiveBoxNumber || 'H024'}.`,
        txHash: receipt.txHash,
        verified: true,
      },
      {
        id: `EVT-${Date.now()}-2`,
        eventType: 'HARVESTED',
        title: 'Comb Harvesting Recorded',
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        actor: params.beekeeperProfile.name,
        actorRole: 'Beekeeper',
        location: `${params.beekeeperProfile.district || 'Nashik'} Apiary`,
        description: `Extracted ${params.quantityKg} kg of ${params.floralSource} raw comb honey.`,
        txHash: receipt.txHash,
        verified: true,
      },
      {
        id: `EVT-${Date.now()}-3`,
        eventType: 'BLOCKCHAIN_MINTED',
        title: 'Batch Integrity Tokenized on Ledger',
        timestamp: new Date().toISOString(),
        actor: 'MadhuDhara Smart Contract',
        actorRole: 'Ledger Relayer',
        location: 'KVIC Cloud Node',
        description: `Batch ${batchNumber} permanently minted at Block #${receipt.blockNumber}.`,
        txHash: receipt.txHash,
        verified: true,
      },
    ];

    const firestoreEvents: FirestoreBatchEventDoc[] = events.map((e) => ({
      id: e.id,
      eventId: e.id,
      batchNumber,
      eventType: e.eventType,
      title: e.title,
      timestamp: e.timestamp,
      actor: e.actor,
      actorRole: e.actorRole,
      location: e.location,
      description: e.description,
      txHash: e.txHash,
      verified: e.verified,
      createdAt: new Date().toISOString(),
    }));

    // 5. Store Batch in Firestore: batches/{batchNumber}
    await firestoreBatchRepository.createBatch({
      id: batchNumber,
      batchNumber,
      beekeeperUid: params.beekeeperUid,
      beekeeperId: params.beekeeperProfile.beekeeperId,
      beekeeperName: params.beekeeperProfile.name,
      apiaryId: params.apiaryId || 'API-MH-NAS-01',
      apiaryName: params.apiaryName || `${params.beekeeperProfile.name}'s Apiary`,
      hiveIds: [params.hiveId],
      harvestId,
      productName: params.productName,
      floralSource: params.floralSource,
      harvestDate: new Date().toISOString().split('T')[0],
      packagingDate: new Date().toISOString().split('T')[0],
      bestBeforeDate: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      quantityBottles: Math.round(params.quantityKg * 2),
      bottleVolumeMl: 500,
      originDistrict: params.beekeeperProfile.district || 'Nashik',
      originState: params.beekeeperProfile.state || 'Maharashtra',
      fssaiNumber: '10022022000841',
      kvicCertificationId: `KVIC-HM-CERT-${year}-991`,
      moisturePercentage: 17.6,
      sucrosePercentage: 2.9,
      pollenAnalysis: 'Rich multi-floral spectrum with Brassica & wild forest floral markers',
      blockchainTxHash: receipt.txHash,
      blockNumber: receipt.blockNumber,
      smartContractAddress: blockchainService.getContractAddress(),
      verificationStatus: 'VERIFIED',
      qrCodeUrl: `/trace/${batchNumber}`,
      traceabilityUrl: `/trace/${batchNumber}`,
      scanCount: 1,
      events: firestoreEvents,
    });

    // 6. Store sanitized public verification record: public_batches/{batchNumber}
    await firestorePublicBatchRepository.savePublicBatch({
      batchNumber,
      productName: params.productName,
      floralSource: params.floralSource,
      harvestDate: new Date().toISOString().split('T')[0],
      packagingDate: new Date().toISOString().split('T')[0],
      bestBeforeDate: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      beekeeperName: params.beekeeperProfile.name,
      originDistrict: params.beekeeperProfile.district || 'Nashik',
      originState: params.beekeeperProfile.state || 'Maharashtra',
      fssaiNumber: '10022022000841',
      kvicCertificationId: `KVIC-HM-CERT-${year}-991`,
      moisturePercentage: 17.6,
      sucrosePercentage: 2.9,
      blockchainTxHash: receipt.txHash,
      blockNumber: receipt.blockNumber,
      smartContractAddress: blockchainService.getContractAddress(),
      verificationStatus: 'VERIFIED',
      qrCodeUrl: `/trace/${batchNumber}`,
      traceabilityUrl: `/trace/${batchNumber}`,
      qrDataUrl,
      scanCount: 1,
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        title: e.title,
        timestamp: e.timestamp,
        actor: e.actor,
        actorRole: e.actorRole,
        location: e.location,
        description: e.description,
        txHash: e.txHash,
        verified: e.verified,
      })),
    });

    const fullBatch: HoneyBatch = {
      id: batchNumber,
      productName: params.productName,
      beekeeperId: params.beekeeperProfile.beekeeperId,
      beekeeperName: params.beekeeperProfile.name,
      apiaryId: params.apiaryId || 'API-MH-NAS-01',
      apiaryName: params.apiaryName || `${params.beekeeperProfile.name}'s Apiary`,
      hiveIds: [params.hiveId],
      harvestId,
      harvestDate: new Date().toISOString().split('T')[0],
      packagingDate: new Date().toISOString().split('T')[0],
      bestBeforeDate: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      quantityBottles: Math.round(params.quantityKg * 2),
      bottleVolumeMl: 500,
      floralSource: params.floralSource,
      originDistrict: params.beekeeperProfile.district || 'Nashik',
      originState: params.beekeeperProfile.state || 'Maharashtra',
      fssaiNumber: '10022022000841',
      kvicCertificationId: `KVIC-HM-CERT-${year}-991`,
      moisturePercentage: 17.6,
      sucrosePercentage: 2.9,
      pollenAnalysis: 'Rich multi-floral spectrum with Brassica & wild forest floral markers',
      blockchainTxHash: receipt.txHash,
      blockNumber: receipt.blockNumber,
      smartContractAddress: blockchainService.getContractAddress(),
      verificationStatus: 'VERIFIED',
      qrCodeUrl: `/trace/${batchNumber}`,
      traceabilityUrl: `/trace/${batchNumber}`,
      scanCount: 1,
      events,
    };

    return fullBatch;
  }

  /**
   * Loads batches for a specific beekeeper from Firestore.
   */
  public async loadBeekeeperBatches(beekeeperUid: string): Promise<HoneyBatch[]> {
    const docs = await firestoreBatchRepository.getBatchesByBeekeeper(beekeeperUid);
    return docs.map((d) => ({
      id: d.batchNumber,
      productName: d.productName,
      beekeeperId: d.beekeeperId,
      beekeeperName: d.beekeeperName,
      apiaryId: d.apiaryId,
      apiaryName: d.apiaryName,
      hiveIds: d.hiveIds,
      harvestId: d.harvestId,
      harvestDate: d.harvestDate,
      packagingDate: d.packagingDate,
      bestBeforeDate: d.bestBeforeDate,
      quantityBottles: d.quantityBottles,
      bottleVolumeMl: d.bottleVolumeMl,
      floralSource: d.floralSource,
      originDistrict: d.originDistrict,
      originState: d.originState,
      fssaiNumber: d.fssaiNumber,
      kvicCertificationId: d.kvicCertificationId,
      moisturePercentage: d.moisturePercentage,
      sucrosePercentage: d.sucrosePercentage,
      pollenAnalysis: d.pollenAnalysis,
      blockchainTxHash: d.blockchainTxHash,
      blockNumber: d.blockNumber,
      smartContractAddress: d.smartContractAddress,
      verificationStatus: d.verificationStatus,
      qrCodeUrl: d.qrCodeUrl,
      traceabilityUrl: d.traceabilityUrl,
      scanCount: d.scanCount,
      events: d.events.map((e) => ({
        id: e.id,
        eventType: e.eventType as any,
        title: e.title,
        timestamp: e.timestamp,
        actor: e.actor,
        actorRole: e.actorRole,
        location: e.location,
        description: e.description,
        txHash: e.txHash,
        verified: e.verified,
      })),
      suspiciousReason: d.suspiciousReason,
    }));
  }

  /**
   * Loads sanitized public batch for consumer verification without authentication.
   */
  public async loadPublicBatch(batchNumber: string): Promise<FirestorePublicBatchDoc | null> {
    return await firestorePublicBatchRepository.getPublicBatch(batchNumber);
  }

  /**
   * Loads alerts for a beekeeper from Firestore.
   */
  public async loadBeekeeperAlerts(beekeeperUid: string): Promise<HiveAlert[]> {
    const docs = await firestoreAlertRepository.getAlertsByBeekeeper(beekeeperUid);
    return docs.map((d) => ({
      id: d.alertId,
      hiveId: d.hiveId,
      beekeeperId: d.beekeeperId,
      timestamp: d.timestamp,
      severity: d.severity,
      parameter: d.alertType,
      title: d.title,
      message: d.description,
      observedValue: d.observedValues,
      idealRange: d.idealRange,
      recommendedAction: d.recommendedAction,
      isAcknowledged: d.isAcknowledged,
      linkedTicketId: d.linkedTicketId,
    }));
  }

  /**
   * Loads all alerts from Firestore (for Admin desk).
   */
  public async loadAllAlerts(): Promise<HiveAlert[]> {
    const docs = await firestoreAlertRepository.getAllAlerts();
    return docs.map((d) => ({
      id: d.alertId,
      hiveId: d.hiveId,
      beekeeperId: d.beekeeperId,
      timestamp: d.timestamp,
      severity: d.severity,
      parameter: d.alertType,
      title: d.title,
      message: d.description,
      observedValue: d.observedValues,
      idealRange: d.idealRange,
      recommendedAction: d.recommendedAction,
      isAcknowledged: d.isAcknowledged,
      linkedTicketId: d.linkedTicketId,
    }));
  }

  /**
   * Acknowledges an alert in Firestore.
   */
  public async acknowledgeAlertInFirestore(alertId: string): Promise<boolean> {
    return await firestoreAlertRepository.acknowledgeAlert(alertId);
  }

  /**
   * Records a simulated IoT alert in Firestore with deduplication.
   * If an active unacknowledged alert already exists for (hiveId, alertType), it will not duplicate.
   */
  public async recordIoTAlertInFirestore(params: {
    beekeeperUid: string;
    beekeeperId: string;
    hiveId: string;
    alertType: 'temperature' | 'humidity' | 'weight' | 'activity' | 'general';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    observedValue: string;
    idealRange: string;
    recommendedAction: string;
    healthScore: number;
  }): Promise<HiveAlert | null> {
    // 1. Check for existing active unacknowledged alert for this hive & parameter
    const existing = await firestoreAlertRepository.getActiveAlert(params.hiveId, params.alertType);
    if (existing) {
      return null; // Deduplicated!
    }

    const alertId = `ALT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const created = await firestoreAlertRepository.createAlert({
      id: alertId,
      alertId,
      beekeeperUid: params.beekeeperUid,
      beekeeperId: params.beekeeperId,
      hiveId: params.hiveId,
      alertType: params.alertType,
      severity: params.severity,
      title: params.title,
      description: params.message,
      observedValues: params.observedValue,
      idealRange: params.idealRange,
      recommendedAction: params.recommendedAction,
      healthScore: params.healthScore,
      timestamp: now,
      status: 'active',
      isAcknowledged: false,
    });

    return {
      id: created.alertId,
      hiveId: created.hiveId,
      beekeeperId: created.beekeeperId,
      timestamp: created.timestamp,
      severity: created.severity,
      parameter: created.alertType,
      title: created.title,
      message: created.description,
      observedValue: created.observedValues,
      idealRange: created.idealRange,
      recommendedAction: created.recommendedAction,
      isAcknowledged: created.isAcknowledged,
      linkedTicketId: created.linkedTicketId,
    };
  }

  /**
   * Loads tickets for a beekeeper from Firestore.
   */
  public async loadBeekeeperTickets(beekeeperUid: string): Promise<SupportTicket[]> {
    return await firestoreTicketRepository.getTicketsByBeekeeper(beekeeperUid);
  }

  /**
   * Loads all tickets across beekeepers from Firestore (for Admin).
   */
  public async loadAllTickets(): Promise<SupportTicket[]> {
    return await firestoreTicketRepository.getAllTickets();
  }

  /**
   * Creates a support ticket in Firestore, attaches initial message, and links alert if provided.
   */
  public async createSupportTicketInFirestore(params: {
    beekeeperUid: string;
    beekeeperId: string;
    beekeeperName: string;
    hiveId?: string;
    alertId?: string;
    title: string;
    message: string;
    category?: 'hive_health' | 'disease' | 'equipment' | 'market_linkage' | 'kvic_scheme';
    sensorSnapshot?: {
      temperature: number;
      humidity: number;
      weight: number;
      healthScore: number;
    };
    healthScore?: number;
  }): Promise<SupportTicket> {
    const ticketId = `HC-T-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newTicket = await firestoreTicketRepository.createTicket({
      ticket: {
        id: ticketId,
        ticketId,
        beekeeperUid: params.beekeeperUid,
        beekeeperId: params.beekeeperId,
        beekeeperName: params.beekeeperName,
        hiveId: params.hiveId,
        alertId: params.alertId,
        title: params.title,
        description: params.message,
        category: params.category || 'hive_health',
        status: 'OPEN',
        sensorSnapshot: params.sensorSnapshot,
        healthScore: params.healthScore || params.sensorSnapshot?.healthScore || 65,
        timestamp: now,
      },
      initialMessage: params.message,
      senderUid: params.beekeeperUid,
      senderName: params.beekeeperName,
      senderRole: 'beekeeper',
    });

    // If linked to alert, update alert document
    if (params.alertId) {
      await firestoreAlertRepository.linkTicketToAlert(params.alertId, ticketId);
    }

    return newTicket;
  }

  /**
   * Responds to a support ticket in Firestore.
   */
  public async respondToTicketInFirestore(params: {
    ticketId: string;
    senderUid: string;
    senderName: string;
    senderRole: 'beekeeper' | 'admin';
    message: string;
    newStatus?: SupportTicket['status'];
  }): Promise<TicketMessage> {
    return await firestoreTicketRepository.addTicketMessage(params);
  }

  /**
   * Updates support ticket status in Firestore.
   */
  public async updateTicketStatusInFirestore(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<boolean> {
    return await firestoreTicketRepository.updateTicketStatus(ticketId, status);
  }

  /**
   * Seeds demo alerts and tickets for a demo beekeeper in Firestore if empty.
   */
  public async seedDemoAlertsAndTickets(params: {
    beekeeperUid: string;
    beekeeperId: string;
    beekeeperName: string;
    hiveId: string;
  }): Promise<void> {
    try {
      const existingAlerts = await firestoreAlertRepository.getAlertsByBeekeeper(params.beekeeperUid);
      if (existingAlerts.length === 0) {
        // Seed initial alert
        await firestoreAlertRepository.createAlert({
          id: 'ALT-2026-09-001',
          alertId: 'ALT-2026-09-001',
          beekeeperUid: params.beekeeperUid,
          beekeeperId: params.beekeeperId,
          hiveId: params.hiveId,
          alertType: 'temperature',
          severity: 'warning',
          title: 'High Brood Temperature Warning (38.6°C)',
          description: 'Brood temperature exceeded safety threshold of 35.5°C for 3 consecutive hours. Worker bees are actively fanning.',
          observedValues: '38.6°C',
          idealRange: '34.0°C - 35.5°C',
          recommendedAction: 'Provide additional canopy shade and ensure nearby freshwater trough is filled to prevent brood overheating.',
          healthScore: 64,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'active',
          isAcknowledged: false,
        });
      }

      const existingTickets = await firestoreTicketRepository.getTicketsByBeekeeper(params.beekeeperUid);
      if (existingTickets.length === 0) {
        // Seed initial ticket with reply
        await firestoreTicketRepository.createTicket({
          ticket: {
            id: 'HC-T-1023',
            ticketId: 'HC-T-1023',
            beekeeperUid: params.beekeeperUid,
            beekeeperId: params.beekeeperId,
            beekeeperName: params.beekeeperName,
            hiveId: params.hiveId,
            alertId: 'ALT-2026-09-001',
            title: 'High Brood Temperature (38.6°C) in Box H023',
            description: 'Hello, the IoT sensor on Box H023 triggered an alert showing 38.6°C. Bees are fanning vigorously at the entrance. Should I move the box under denser tree canopy or install a wet burlap cloth on top?',
            category: 'hive_health',
            status: 'OPEN',
            sensorSnapshot: {
              temperature: 38.6,
              humidity: 48,
              weight: 41.2,
              healthScore: 64,
            },
            healthScore: 64,
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
          initialMessage: 'Hello, the IoT sensor on Box H023 triggered an alert showing 38.6°C. Bees are fanning vigorously at the entrance. Should I move the box under denser tree canopy or install a wet burlap cloth on top?',
          senderUid: params.beekeeperUid,
          senderName: params.beekeeperName,
          senderRole: 'beekeeper',
        });
      }
    } catch (err) {
      console.warn('seedDemoAlertsAndTickets warning:', err);
    }
  }

  /**
   * Loads published learning resources from Firestore.
   */
  public async loadPublishedLearningContent(): Promise<LearningContent[]> {
    const docs = await firestoreLearningRepository.getAllPublishedLearningContent();
    return docs.map((d) => ({
      id: d.contentId || d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      youtubeUrl: d.youtubeUrl,
      thumbnailUrl: d.thumbnailUrl,
      durationMinutes: d.durationMinutes || d.duration || 15,
      language: d.language,
      publishedDate: d.publishedAt ? d.publishedAt.split('T')[0] : (d.createdAt ? d.createdAt.split('T')[0] : '2026-09-27'),
      authorName: d.publishedBy || 'KVIC Directorate of Honey Mission',
      viewsCount: d.viewsCount || 0,
    }));
  }

  /**
   * Admin publishes learning resource in Firestore and triggers notifications to beekeepers.
   */
  public async publishLearningContentInFirestore(params: {
    contentId?: string;
    title: string;
    description: string;
    category: 'hive_management' | 'disease_control' | 'extraction' | 'kvic_schemes' | 'market_sales';
    youtubeUrl: string;
    durationMinutes?: number;
    duration?: string | number;
    language: LanguageCode;
    authorName?: string;
    adminUid?: string;
  }): Promise<{ content: LearningContent; notificationsCount: number }> {
    const contentId = params.contentId || `LRN-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const author = params.authorName || 'KVIC Directorate of Honey Mission';
    const durationMinutes = Number(params.durationMinutes || params.duration || 15);

    // 1. Create Learning Content Document
    const createdDoc = await firestoreLearningRepository.createLearningContent({
      id: contentId,
      contentId,
      title: params.title,
      description: params.description,
      category: params.category,
      youtubeUrl: params.youtubeUrl,
      duration: durationMinutes,
      durationMinutes,
      language: params.language,
      targetLanguage: params.language,
      publishedBy: author,
      publishedAt: now,
      viewsCount: 0,
      status: 'published',
    });

    const content: LearningContent = {
      id: createdDoc.contentId,
      title: createdDoc.title,
      description: createdDoc.description,
      category: createdDoc.category,
      youtubeUrl: createdDoc.youtubeUrl,
      thumbnailUrl: createdDoc.thumbnailUrl,
      durationMinutes: createdDoc.durationMinutes,
      language: createdDoc.language,
      publishedDate: now.split('T')[0],
      authorName: createdDoc.publishedBy,
      viewsCount: 0,
    };

    // 2. Fetch all registered beekeepers to broadcast notification
    const beekeepers = await firestoreBeekeeperRepository.getAllBeekeepers();
    const recipientUids = new Set<string>();

    for (const b of beekeepers) {
      if (b.firebaseUid) recipientUids.add(b.firebaseUid);
    }

    // Ensure demo beekeeper is included
    recipientUids.add('usr-beekeeper-01');

    // 3. Dispatch notifications with deterministic deduplication ID
    const notifs = await firestoreNotificationRepository.createLearningNotificationsForBeekeepers({
      contentId,
      title: params.title,
      category: params.category,
      authorName: author,
      durationMinutes,
      recipientUids: Array.from(recipientUids),
    });

    return {
      content,
      notificationsCount: notifs.length,
    };
  }

  /**
   * Loads notifications for an authenticated user.
   */
  public async loadUserNotifications(userUid: string): Promise<AppNotification[]> {
    const docs = await firestoreNotificationRepository.getNotificationsByUser(userUid);
    return docs.map((d) => ({
      id: d.notificationId || d.id,
      userId: d.recipientUid,
      title: d.title,
      message: d.message,
      type: d.type,
      timestamp: d.createdAt,
      read: d.read,
      linkUrl: d.linkUrl || '#learning',
      relatedContentId: d.relatedContentId,
    }));
  }

  /**
   * Marks a notification as read in Firestore.
   */
  public async markNotificationAsReadInFirestore(notificationId: string): Promise<boolean> {
    return await firestoreNotificationRepository.markAsRead(notificationId);
  }

  /**
   * Seeds demo learning modules in Firestore if collection is empty.
   */
  public async seedDemoLearningContent(): Promise<void> {
    try {
      const existing = await firestoreLearningRepository.getAllPublishedLearningContent();
      if (existing.length === 0) {
        const demos = [
          {
            id: 'LRN-001',
            contentId: 'LRN-001',
            title: 'Modern Hive Monitoring & Temperature Equilibrium',
            description: 'Official KVIC Honey Mission guide on interpreting digital temperature/humidity sensor data and preventing summer thermal stress in Indian bee colonies.',
            category: 'hive_management' as const,
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 14,
            durationMinutes: 14,
            language: 'en' as const,
            targetLanguage: 'en',
            publishedBy: 'KVIC Central Bee Research Institute (CBRI), Pune',
            publishedAt: '2026-09-20T10:00:00Z',
            viewsCount: 1420,
            status: 'published' as const,
          },
          {
            id: 'LRN-002',
            contentId: 'LRN-002',
            title: 'Varroa Mite Detection & Organic Thymol Treatment',
            description: 'Step-by-step diagnostic techniques for inspecting brood comb frames and applying KVIC-approved herbal miticides without honey contamination.',
            category: 'disease_control' as const,
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 18,
            durationMinutes: 18,
            language: 'en' as const,
            targetLanguage: 'en',
            publishedBy: 'KVIC Bee Health Directorate',
            publishedAt: '2026-09-15T12:00:00Z',
            viewsCount: 2310,
            status: 'published' as const,
          },
          {
            id: 'LRN-003',
            contentId: 'LRN-003',
            title: 'KVIC Honey Mission Subsidy & Toolkits (मधुमक्खी पालन योजना)',
            description: 'Complete walkthrough of applying for 80% subsidized bee boxes, centrifugal extractors, and digital MadhuDhara IoT monitoring starter kits.',
            category: 'kvic_schemes' as const,
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 22,
            durationMinutes: 22,
            language: 'hi' as const,
            targetLanguage: 'hi',
            publishedBy: 'KVIC Directorate of Honey Mission',
            publishedAt: '2026-09-01T09:30:00Z',
            viewsCount: 4890,
            status: 'published' as const,
          },
        ];

        for (const item of demos) {
          await firestoreLearningRepository.createLearningContent(item);
        }
      }
    } catch (err) {
      console.warn('seedDemoLearningContent warning:', err);
    }
  }

  // ==========================================
  // PHASE 2E: MARKETPLACE & ORDER REQUESTS
  // ==========================================

  /**
   * Loads all active marketplace products for public consumer browsing.
   */
  public async loadPublicMarketplaceProducts(): Promise<MarketplaceProduct[]> {
    const docs = await firestoreMarketplaceRepository.getAllPublicProducts();
    return docs.map((d) => this.mapMarketplaceDocToProduct(d));
  }

  /**
   * Loads marketplace products owned by a specific beekeeper.
   */
  public async loadBeekeeperMarketplaceProducts(beekeeperUid: string): Promise<MarketplaceProduct[]> {
    const docs = await firestoreMarketplaceRepository.getProductsByBeekeeper(beekeeperUid);
    return docs.map((d) => this.mapMarketplaceDocToProduct(d));
  }

  /**
   * Loads all marketplace products across beekeepers (for KVIC Admin).
   */
  public async loadAllMarketplaceProducts(): Promise<MarketplaceProduct[]> {
    const docs = await firestoreMarketplaceRepository.getAllProducts();
    return docs.map((d) => this.mapMarketplaceDocToProduct(d));
  }

  /**
   * Beekeeper creates a new marketplace listing linked to a verified Honey Chain batch.
   * Enforces batch validation and ownership.
   */
  public async createMarketplaceListingInFirestore(params: {
    productId?: string;
    batchNumber: string;
    title: string;
    beekeeperUid: string;
    beekeeperId: string;
    beekeeperName: string;
    producerLocation: string;
    floralType: string;
    priceInr: number;
    weightGrams?: number;
    availableStockBottles: number;
    description: string;
    contactNumber?: string;
    harvestDate?: string;
    imageUrl?: string;
    isAdmin?: boolean;
  }): Promise<MarketplaceProduct> {
    const batchNumber = params.batchNumber.trim();

    // 1. Validate that the referenced batch exists in Honey Chain
    let batchDoc: FirestoreBatchDoc | null = await firestoreBatchRepository.getBatchByNumber(batchNumber);
    if (!batchDoc) {
      // Check public batches
      const publicBatch = await firestorePublicBatchRepository.getPublicBatch(batchNumber);
      if (!publicBatch) {
        throw new Error(`Referenced batch "${batchNumber}" does not exist in MadhuDhara.`);
      }
    }

    // 2. Validate batch ownership: only the owner beekeeper (or admin) can list it
    if (batchDoc && batchDoc.beekeeperUid && params.beekeeperUid && !params.isAdmin) {
      if (batchDoc.beekeeperUid !== params.beekeeperUid) {
        throw new Error(
          `Unauthorized: Batch "${batchNumber}" belongs to beekeeper "${batchDoc.beekeeperId}" (${batchDoc.beekeeperUid}), not "${params.beekeeperUid}".`
        );
      }
    }

    const productId = params.productId || `MP-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const createdDoc = await firestoreMarketplaceRepository.createProduct({
      id: productId,
      productId,
      beekeeperUid: params.beekeeperUid,
      beekeeperId: params.beekeeperId,
      beekeeperName: params.beekeeperName,
      batchNumber,
      batchId: batchNumber,
      productName: params.title,
      title: params.title,
      productType: params.floralType,
      floralType: params.floralType,
      description: params.description,
      price: params.priceInr,
      priceInr: params.priceInr,
      quantityAvailable: params.availableStockBottles,
      availableStockBottles: params.availableStockBottles,
      unit: `${params.weightGrams || 500}g Jar`,
      weightGrams: params.weightGrams || 500,
      imageUrl: params.imageUrl,
      location: params.producerLocation,
      producerLocation: params.producerLocation,
      verificationStatus: 'VERIFIED',
      verifiedBadge: true,
      batchVerificationReference: batchNumber,
      harvestDate: params.harvestDate || now.split('T')[0],
      contactNumber: params.contactNumber || '+91 98234 56781',
      status: 'active',
    });

    return this.mapMarketplaceDocToProduct(createdDoc);
  }

  /**
   * Updates an existing marketplace product listing.
   */
  public async updateMarketplaceProductInFirestore(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): Promise<boolean> {
    const docUpdates: Partial<FirestoreMarketplaceProductDoc> = {};
    if (updates.title) {
      docUpdates.title = updates.title;
      docUpdates.productName = updates.title;
    }
    if (updates.priceInr !== undefined) {
      docUpdates.price = updates.priceInr;
      docUpdates.priceInr = updates.priceInr;
    }
    if (updates.availableStockBottles !== undefined) {
      docUpdates.quantityAvailable = updates.availableStockBottles;
      docUpdates.availableStockBottles = updates.availableStockBottles;
    }
    if (updates.description) docUpdates.description = updates.description;
    if (updates.status) docUpdates.status = updates.status;
    if (updates.contactNumber) docUpdates.contactNumber = updates.contactNumber;

    return await firestoreMarketplaceRepository.updateProduct(productId, docUpdates);
  }

  /**
   * Deletes a marketplace product listing.
   */
  public async deleteMarketplaceProductInFirestore(productId: string): Promise<boolean> {
    return await firestoreMarketplaceRepository.deleteProduct(productId);
  }

  /**
   * Submits an enquiry or direct purchase request from a consumer to the beekeeper.
   */
  public async submitOrderRequestInFirestore(params: {
    productId: string;
    productName?: string;
    batchNumber: string;
    beekeeperUid: string;
    beekeeperId?: string;
    consumerName?: string;
    consumerContact?: string;
    consumerMessage?: string;
    requestedQuantity?: number;
  }): Promise<OrderRequest> {
    const orderRequestId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const created = await firestoreOrderRequestRepository.createOrderRequest({
      id: orderRequestId,
      orderRequestId,
      productId: params.productId,
      batchNumber: params.batchNumber,
      batchId: params.batchNumber,
      beekeeperUid: params.beekeeperUid,
      beekeeperId: params.beekeeperId || 'BK-PRODUCER',
      productName: params.productName || 'Honey Batch Jar',
      consumerName: params.consumerName || 'Interested Consumer',
      consumerContact: params.consumerContact || '',
      consumerMessage: params.consumerMessage || '',
      requestedQuantity: Number(params.requestedQuantity || 1),
      status: 'PENDING',
    });

    return {
      id: created.id,
      orderRequestId: created.orderRequestId,
      productId: created.productId,
      productName: created.productName,
      batchNumber: created.batchNumber,
      beekeeperUid: created.beekeeperUid,
      beekeeperId: created.beekeeperId,
      requestedQuantity: created.requestedQuantity,
      consumerName: created.consumerName,
      consumerContact: created.consumerContact,
      consumerMessage: created.consumerMessage,
      status: created.status,
      createdAt: created.createdAt || now,
      updatedAt: created.updatedAt || now,
    };
  }

  /**
   * Loads order and enquiry requests addressed to a specific beekeeper.
   */
  public async loadBeekeeperOrderRequests(beekeeperUid: string): Promise<OrderRequest[]> {
    const docs = await firestoreOrderRequestRepository.getOrderRequestsByBeekeeper(beekeeperUid);
    return docs.map((d) => ({
      id: d.id,
      orderRequestId: d.orderRequestId,
      productId: d.productId,
      productName: d.productName,
      batchNumber: d.batchNumber,
      beekeeperUid: d.beekeeperUid,
      beekeeperId: d.beekeeperId,
      requestedQuantity: d.requestedQuantity,
      consumerName: d.consumerName,
      consumerContact: d.consumerContact,
      consumerMessage: d.consumerMessage,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  /**
   * Loads all order requests across all beekeepers (for KVIC Admin).
   */
  public async loadAllOrderRequests(): Promise<OrderRequest[]> {
    const docs = await firestoreOrderRequestRepository.getAllOrderRequests();
    return docs.map((d) => ({
      id: d.id,
      orderRequestId: d.orderRequestId,
      productId: d.productId,
      productName: d.productName,
      batchNumber: d.batchNumber,
      beekeeperUid: d.beekeeperUid,
      beekeeperId: d.beekeeperId,
      requestedQuantity: d.requestedQuantity,
      consumerName: d.consumerName,
      consumerContact: d.consumerContact,
      consumerMessage: d.consumerMessage,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  /**
   * Updates an order request status (PENDING -> ACCEPTED / REJECTED / COMPLETED).
   */
  public async updateOrderRequestStatusInFirestore(
    orderRequestId: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  ): Promise<boolean> {
    return await firestoreOrderRequestRepository.updateOrderStatus(orderRequestId, status);
  }

  /**
   * Seeds demo marketplace listing (MP-001) in Firestore if empty.
   */
  public async seedDemoMarketplaceProducts(): Promise<void> {
    try {
      const existing = await firestoreMarketplaceRepository.getAllPublicProducts();
      if (!existing || existing.length === 0) {
        await firestoreMarketplaceRepository.createProduct({
          id: 'MP-001',
          productId: 'MP-001',
          batchNumber: 'HC-MH-NAS-2026-00047',
          batchId: 'HC-MH-NAS-2026-00047',
          title: 'KVIC Certified Pure Raw Sahyadri Honey (500g)',
          productName: 'KVIC Certified Pure Raw Sahyadri Honey (500g)',
          beekeeperUid: 'ZjV2un0It7ePDwk2NlXMyZfX6YR2',
          beekeeperId: 'BK-MH-NAS-0129',
          beekeeperName: 'Ramesh Patil',
          producerLocation: 'Dindori, Nashik (Maharashtra)',
          location: 'Dindori, Nashik (Maharashtra)',
          floralType: 'Multi-Floral Wild Forest & Mustard',
          productType: 'Multi-Floral Wild Forest & Mustard',
          price: 350,
          priceInr: 350,
          quantityAvailable: 86,
          availableStockBottles: 86,
          unit: '500g Jar',
          weightGrams: 500,
          verifiedBadge: true,
          verificationStatus: 'VERIFIED',
          batchVerificationReference: 'HC-MH-NAS-2026-00047',
          harvestDate: '12 Sept 2026',
          description:
            'Cold-extracted unpasteurized honey sourced directly from KVIC-assisted Apis cerana hives in the Western Ghats. Verified with blockchain traceability.',
          contactNumber: '+91 98234 56781',
          status: 'active',
        });
      }
    } catch (err) {
      console.warn('seedDemoMarketplaceProducts warning:', err);
    }
  }

  private mapMarketplaceDocToProduct(doc: FirestoreMarketplaceProductDoc): MarketplaceProduct {
    return {
      id: doc.productId || doc.id,
      productId: doc.productId || doc.id,
      batchId: doc.batchNumber || doc.batchId,
      batchNumber: doc.batchNumber || doc.batchId,
      title: doc.title || doc.productName,
      productName: doc.productName || doc.title,
      beekeeperUid: doc.beekeeperUid,
      beekeeperId: doc.beekeeperId,
      beekeeperName: doc.beekeeperName,
      producerLocation: doc.producerLocation || doc.location,
      floralType: doc.floralType || doc.productType,
      productType: doc.productType || doc.floralType,
      priceInr: doc.priceInr || doc.price,
      weightGrams: doc.weightGrams,
      unit: doc.unit,
      availableStockBottles: doc.availableStockBottles ?? doc.quantityAvailable ?? 0,
      quantityAvailable: doc.quantityAvailable ?? doc.availableStockBottles ?? 0,
      verifiedBadge: doc.verifiedBadge !== false,
      verificationStatus: doc.verificationStatus,
      batchVerificationReference: doc.batchVerificationReference,
      harvestDate: doc.harvestDate,
      description: doc.description,
      imageUrl: doc.imageUrl,
      contactNumber: doc.contactNumber,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * PHASE 2F: Lightweight Aggregate System Statistics for Admin Dashboard
   * Leverages Firestore getCountFromServer server-side aggregations.
   * Avoids N+1 queries and avoids downloading full documents or sensor records.
   */
  public async getAdminSystemStats(): Promise<AdminSystemStats> {
    let beekeepersCount = 0;
    let apiariesCount = 0;
    let hivesCount = 0;
    let batchesCount = 0;
    let openTickets = 0;
    let inReviewTickets = 0;
    let resolvedTickets = 0;
    let totalTickets = 0;
    let publishedLearning = 0;
    let activeMarketplaceListings = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let activeAlertsCount = 0;

    if (db) {
      // 1. Registered Beekeepers aggregate count
      try {
        const snap = await getCountFromServer(collection(db, 'beekeepers'));
        beekeepersCount = snap.data().count;
      } catch (err) {
        try {
          const docs = await firestoreBeekeeperRepository.getAllBeekeepers();
          beekeepersCount = docs.length;
        } catch {
          beekeepersCount = mockDb.beekeepers.size;
        }
      }

      // 2. Active Apiaries aggregate count
      try {
        const snap = await getCountFromServer(collection(db, 'apiaries'));
        apiariesCount = snap.data().count;
      } catch (err) {
        try {
          const docs = await firestoreApiaryRepository.getAllApiaries();
          apiariesCount = docs.length;
        } catch {
          apiariesCount = mockDb.apiaries.size;
        }
      }

      // 3. Registered Hives aggregate count
      try {
        const snap = await getCountFromServer(collection(db, 'hives'));
        hivesCount = snap.data().count;
      } catch (err) {
        try {
          const docs = await firestoreHiveRepository.getAllHives();
          hivesCount = docs.length;
        } catch {
          hivesCount = mockDb.hives.size;
        }
      }

      // 4. Honey Batches aggregate count
      try {
        const snap = await getCountFromServer(collection(db, 'batches'));
        batchesCount = snap.data().count;
      } catch (err) {
        try {
          const docs = await firestoreBatchRepository.getAllBatches();
          batchesCount = docs.length;
        } catch {
          batchesCount = mockDb.batches.size;
        }
      }

      // 5. Support Tickets summary counts
      try {
        const allTickets = await firestoreTicketRepository.getAllTickets();
        totalTickets = allTickets.length;
        openTickets = allTickets.filter((t) => t.status === 'OPEN').length;
        inReviewTickets = allTickets.filter((t) => t.status === 'IN REVIEW').length;
        resolvedTickets = allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'RESPONDED').length;
      } catch {
        const mockTickets = Array.from(mockDb.tickets.values());
        totalTickets = mockTickets.length;
        openTickets = mockTickets.filter((t) => t.status === 'OPEN').length;
        inReviewTickets = mockTickets.filter((t) => t.status === 'IN REVIEW').length;
        resolvedTickets = mockTickets.filter((t) => t.status === 'RESOLVED').length;
      }

      // 6. Published Learning count
      try {
        const pubSnap = await getCountFromServer(
          query(collection(db, 'learning_content'), where('status', '==', 'published'))
        );
        publishedLearning = pubSnap.data().count;
      } catch {
        try {
          const pubDocs = await firestoreLearningRepository.getAllPublishedLearningContent();
          publishedLearning = pubDocs.length;
        } catch {
          publishedLearning = 1;
        }
      }

      // 7. Marketplace Overview counts
      try {
        const pubSnap = await getCountFromServer(
          query(collection(db, 'marketplace_products'), where('status', '==', 'active'))
        );
        activeMarketplaceListings = pubSnap.data().count;
      } catch {
        try {
          const pubProds = await firestoreMarketplaceRepository.getAllPublicProducts();
          activeMarketplaceListings = pubProds.length;
        } catch {
          activeMarketplaceListings = mockDb.marketplace.size;
        }
      }

      try {
        const orderSnap = await getCountFromServer(collection(db, 'order_requests'));
        totalOrders = orderSnap.data().count;
        const pendingSnap = await getCountFromServer(
          query(collection(db, 'order_requests'), where('status', '==', 'PENDING'))
        );
        pendingOrders = pendingSnap.data().count;
      } catch {
        totalOrders = 0;
        pendingOrders = 0;
      }

      // 8. Active Alerts count
      try {
        const alertSnap = await getCountFromServer(
          query(collection(db, 'alerts'), where('isAcknowledged', '==', false))
        );
        activeAlertsCount = alertSnap.data().count;
      } catch {
        try {
          const alerts = await firestoreAlertRepository.getAllAlerts();
          activeAlertsCount = alerts.filter((a) => !a.isAcknowledged).length;
        } catch {
          activeAlertsCount = Array.from(mockDb.alerts.values()).filter((a) => !a.isAcknowledged).length;
        }
      }
    } else {
      beekeepersCount = mockDb.beekeepers.size;
      apiariesCount = mockDb.apiaries.size;
      hivesCount = mockDb.hives.size;
      batchesCount = mockDb.batches.size;
      const mockTickets = Array.from(mockDb.tickets.values());
      totalTickets = mockTickets.length;
      openTickets = mockTickets.filter((t) => t.status === 'OPEN').length;
      inReviewTickets = mockTickets.filter((t) => t.status === 'IN REVIEW').length;
      resolvedTickets = mockTickets.filter((t) => t.status === 'RESOLVED').length;
      publishedLearning = 1;
      activeMarketplaceListings = mockDb.marketplace.size;
      activeAlertsCount = Array.from(mockDb.alerts.values()).filter((a) => !a.isAcknowledged).length;
    }

    return {
      registeredBeekeepers: beekeepersCount,
      activeApiaries: apiariesCount,
      registeredHives: hivesCount,
      honeyBatches: batchesCount,
      tickets: {
        open: openTickets,
        inReview: inReviewTickets,
        resolved: resolvedTickets,
        total: totalTickets,
      },
      publishedLearning,
      marketplace: {
        activeListings: activeMarketplaceListings,
        totalOrders,
        pendingOrders,
      },
      activeAlertsCount,
    };
  }

  /**
   * PHASE 2F: Lightweight Beekeepers List for Scalable Directory
   * Fetches only high-level profile headers without loading full apiaries or hives.
   */
  public async getLightweightBeekeepers(): Promise<LightweightBeekeeperSummary[]> {
    const list: LightweightBeekeeperSummary[] = [];
    const seenIds = new Set<string>();

    try {
      const fsBeekeepers = await firestoreBeekeeperRepository.getAllBeekeepers();
      for (const b of fsBeekeepers) {
        seenIds.add(b.beekeeperId);
        list.push({
          firebaseUid: b.firebaseUid,
          beekeeperId: b.beekeeperId,
          name: b.name,
          email: b.email,
          phone: b.phone,
          district: b.district,
          state: b.state,
          village: b.village,
          kvicRegistrationNumber: b.kvicRegistrationNumber,
          totalApiaries: b.totalApiaries || 1,
          totalHives: b.totalHives || 2,
          status: 'Active',
        });
      }
    } catch (e) {
      console.warn('Could not load beekeepers from Firestore:', e);
    }

    // If Firestore has real beekeeper documents, return ONLY real Firestore records
    if (list.length > 0) {
      return list;
    }

    // Fallback to mock beekeepers only if Firestore is completely empty or offline
    for (const b of Array.from(mockDb.beekeepers.values())) {
      if (!seenIds.has(b.beekeeperId)) {
        seenIds.add(b.beekeeperId);
        list.push({
          firebaseUid: b.id,
          beekeeperId: b.beekeeperId,
          name: b.name,
          email: b.email,
          phone: b.phone,
          district: b.district,
          state: b.state,
          village: b.village,
          kvicRegistrationNumber: b.kvicRegistrationNumber,
          totalApiaries: b.totalApiaries || 1,
          totalHives: b.totalHives || 2,
          status: 'Active',
        });
      }
    }

    return list;
  }

  /**
   * PHASE 2F: On-Demand Apiaries Fetch for a Specific Beekeeper
   */
  public async getBeekeeperApiaries(beekeeperUid: string): Promise<Apiary[]> {
    try {
      const docs = await firestoreApiaryRepository.getApiariesByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) {
        return docs.map((a) => ({
          id: a.apiaryId,
          name: a.name,
          beekeeperId: a.beekeeperId,
          locationName: a.locationName,
          village: a.village,
          district: a.district,
          state: a.state,
          coordinates: a.coordinates,
          floraType: a.floraType,
          hiveCount: a.hiveCount,
          status: a.status,
          createdAt: a.createdAt,
        }));
      }
    } catch (e) {
      console.warn(`Could not load apiaries for beekeeper ${beekeeperUid}:`, e);
    }

    // Fallback: check mockDb
    const mockMatches = Array.from(mockDb.apiaries.values()).filter(
      (a) => a.beekeeperId === beekeeperUid || a.beekeeperId.includes(beekeeperUid)
    );
    if (mockMatches.length > 0) return mockMatches;
    return Array.from(mockDb.apiaries.values()).slice(0, 1);
  }

  /**
   * PHASE 2F: On-Demand Hives Fetch for a Specific Beekeeper / Apiary
   */
  public async getBeekeeperHives(beekeeperUid: string, apiaryId?: string): Promise<Hive[]> {
    try {
      const docs = await firestoreHiveRepository.getHivesByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) {
        let filtered = docs;
        if (apiaryId) {
          filtered = docs.filter((h) => h.apiaryId === apiaryId);
        }
        return filtered.map((h) => ({
          id: h.hiveId,
          apiaryId: h.apiaryId,
          beekeeperId: h.beekeeperId,
          boxNumber: h.boxNumber,
          beeSpecies: h.beeSpecies,
          installationDate: h.installationDate,
          queenAgeMonths: h.queenAgeMonths,
          currentHealthScore: h.currentHealthScore,
          status: h.status,
          lastInspectionDate: h.lastInspectionDate,
          hasIoTUnit: h.hasIoTUnit,
          iotDeviceId: h.iotDeviceId,
          batteryLevel: h.batteryLevel,
          totalHarvestsCount: h.totalHarvestsCount,
          lifetimeHoneyYieldKg: h.lifetimeHoneyYieldKg,
        }));
      }
    } catch (e) {
      console.warn(`Could not load hives for beekeeper ${beekeeperUid}:`, e);
    }

    // Fallback: check mockDb
    let mockHives = Array.from(mockDb.hives.values());
    if (apiaryId) {
      mockHives = mockHives.filter((h) => h.apiaryId === apiaryId);
    }
    return mockHives.slice(0, 3);
  }

  /**
   * PHASE 2F: On-Demand Hive Detail with Provenance Lookup
   */
  public async getHiveDetail(hiveId: string): Promise<{
    hive: Hive | null;
    beekeeper: BeekeeperProfile | null;
    apiary: Apiary | null;
  }> {
    let hive: Hive | null = null;
    let beekeeper: BeekeeperProfile | null = null;
    let apiary: Apiary | null = null;

    if (db) {
      try {
        const hiveSnap = await getDoc(doc(db, 'hives', hiveId));
        if (hiveSnap.exists()) {
          const d = hiveSnap.data();
          hive = {
            id: d.hiveId || hiveSnap.id,
            apiaryId: d.apiaryId,
            beekeeperId: d.beekeeperId,
            boxNumber: d.boxNumber,
            beeSpecies: d.beeSpecies,
            installationDate: d.installationDate,
            queenAgeMonths: d.queenAgeMonths,
            currentHealthScore: d.currentHealthScore,
            status: d.status,
            lastInspectionDate: d.lastInspectionDate,
            hasIoTUnit: d.hasIoTUnit,
            iotDeviceId: d.iotDeviceId,
            batteryLevel: d.batteryLevel,
            totalHarvestsCount: d.totalHarvestsCount,
            lifetimeHoneyYieldKg: d.lifetimeHoneyYieldKg,
          };

          if (d.beekeeperUid) {
            const bkDoc = await firestoreBeekeeperRepository.getBeekeeper(d.beekeeperUid);
            if (bkDoc) {
              beekeeper = {
                id: bkDoc.firebaseUid,
                firebaseUid: bkDoc.firebaseUid,
                name: bkDoc.name,
                email: bkDoc.email,
                phone: bkDoc.phone,
                role: 'beekeeper',
                preferredLanguage: bkDoc.preferredLanguage as LanguageCode,
                beekeeperId: bkDoc.beekeeperId,
                kvicRegistrationNumber: bkDoc.kvicRegistrationNumber,
                village: bkDoc.village,
                district: bkDoc.district,
                state: bkDoc.state,
                totalApiaries: bkDoc.totalApiaries,
                totalHives: bkDoc.totalHives,
                onboardingDate: bkDoc.onboardingDate,
                experienceYears: bkDoc.experienceYears,
              };
            }
          }
        }
      } catch (e) {
        console.warn('Could not load hive detail from Firestore:', e);
      }
    }

    if (!hive) {
      hive = mockDb.hives.get(hiveId) || Array.from(mockDb.hives.values())[0] || null;
    }

    if (hive && !beekeeper) {
      beekeeper = mockDb.beekeepers.get(hive.beekeeperId) || Array.from(mockDb.beekeepers.values())[0] || null;
    }

    if (hive && !apiary) {
      apiary = mockDb.apiaries.get(hive.apiaryId) || Array.from(mockDb.apiaries.values())[0] || null;
    }

    return { hive, beekeeper, apiary };
  }
}

export const firestoreIdentityService = new FirestoreIdentityService();
export { firestoreHiveRepository } from './hive.repository';
export { firestoreBatchRepository } from './batch.repository';
export { firestorePublicBatchRepository } from './public-batch.repository';



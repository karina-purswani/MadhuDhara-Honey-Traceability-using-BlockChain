/**
 * Mock Database Layer (Demo Mode)
 * In-memory state seeded with comprehensive, interconnected data across the Honey Chain domain.
 * Supports real multi-user registration & persistent session state.
 */

import {
  Apiary,
  AppNotification,
  BeekeeperProfile,
  ClusterStatistics,
  HarvestRecord,
  Hive,
  HiveAlert,
  HoneyBatch,
  LearningContent,
  MarketplaceProduct,
  SupportTicket,
  User,
} from '../../../shared/types';

export class MockDatabase {
  public users: Map<string, User> = new Map();
  public beekeepers: Map<string, BeekeeperProfile> = new Map();
  public apiaries: Map<string, Apiary> = new Map();
  public hives: Map<string, Hive> = new Map();
  public alerts: Map<string, HiveAlert> = new Map();
  public harvests: Map<string, HarvestRecord> = new Map();
  public batches: Map<string, HoneyBatch> = new Map();
  public marketplace: Map<string, MarketplaceProduct> = new Map();
  public tickets: Map<string, SupportTicket> = new Map();
  public learningContent: Map<string, LearningContent> = new Map();
  public notifications: Map<string, AppNotification> = new Map();
  public clusters: Map<string, ClusterStatistics> = new Map();

  constructor() {
    this.seed();
    this.loadCustomUsersFromStorage();
  }

  private loadCustomUsersFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('honeychain_registered_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.forEach((u: BeekeeperProfile) => {
            delete u.passwordHash;
            this.users.set(u.id, u);
            this.beekeepers.set(u.beekeeperId, u);
          });
        }
      } catch (e) {
        console.error('Error loading custom users from storage', e);
      }
    }
  }

  public registerNewBeekeeper(data: {
    name: string;
    email: string;
    phone: string;
    firebaseUid?: string;
    village: string;
    district: string;
    state: string;
    experienceYears: number;
    preferredLanguage: 'en' | 'hi' | 'mr';
    kvicRegistrationNumber?: string;
  }): BeekeeperProfile {
    const id = data.firebaseUid || `usr-bk-${Date.now()}`;
    const seq = Math.floor(1000 + Math.random() * 9000);
    const stateCode = data.state.slice(0, 2).toUpperCase() || 'MH';
    const distCode = data.district.slice(0, 3).toUpperCase() || 'NAS';
    const beekeeperId = `BK-${stateCode}-${distCode}-${seq}`;
    const kvicReg = data.kvicRegistrationNumber || `KVIC-HM-2026-${seq}`;

    const newProfile: BeekeeperProfile = {
      id,
      firebaseUid: data.firebaseUid,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      role: 'beekeeper',
      preferredLanguage: data.preferredLanguage,
      beekeeperId,
      kvicRegistrationNumber: kvicReg,
      village: data.village,
      district: data.district,
      state: data.state,
      totalApiaries: 1,
      totalHives: 5,
      onboardingDate: new Date().toISOString().split('T')[0],
      experienceYears: data.experienceYears,
    };

    this.users.set(id, newProfile);
    this.beekeepers.set(beekeeperId, newProfile);

    // Create an initial Apiary for this new beekeeper
    const apiaryId = `API-${distCode}-${seq}`;
    const newApiary: Apiary = {
      id: apiaryId,
      name: `${data.village} Flora Apiary`,
      beekeeperId,
      locationName: `${data.village}, ${data.district}`,
      village: data.village,
      district: data.district,
      state: data.state,
      coordinates: { lat: 19.9975, lng: 73.7898 },
      floraType: ['Multi-Floral Wild Bloom', 'Mustard', 'Neem'],
      hiveCount: 5,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.apiaries.set(apiaryId, newApiary);

    // Create 2 initial hives for this new beekeeper
    const hive1Id = `HC-HIVE-${stateCode}-${distCode}-${seq}1`;
    const newHive1: Hive = {
      id: hive1Id,
      apiaryId,
      beekeeperId,
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
    };
    this.hives.set(hive1Id, newHive1);

    // Save to local storage for persistence across reloads
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('honeychain_registered_users');
        const list = stored ? JSON.parse(stored) : [];
        list.push(newProfile);
        localStorage.setItem('honeychain_registered_users', JSON.stringify(list));
      } catch (e) {
        console.error('Failed to persist registered user', e);
      }
    }

    return newProfile;
  }

  private seed() {
    // 1. Users
    const beekeeperUser: BeekeeperProfile = {
      id: 'usr-beekeeper-01',
      beekeeperId: 'BK-MH-NAS-0129',
      kvicRegistrationNumber: 'KVIC-HM-2024-8841',
      name: 'Ramesh Patil',
      email: 'beekeeper@example.com',
      passwordHash: 'password123',
      phone: '+91 98234 56781',
      role: 'beekeeper',
      preferredLanguage: 'en',
      village: 'Dindori',
      district: 'Nashik',
      state: 'Maharashtra',
      totalApiaries: 2,
      totalHives: 24,
      onboardingDate: '2024-03-15',
      experienceYears: 6,
      avatarUrl: '',
    };

    const adminUser: User = {
      id: 'usr-admin-01',
      name: 'Dr. Anil Joshi (KVIC Officer)',
      email: 'admin@example.com',
      passwordHash: 'admin123',
      phone: '+91 94220 11928',
      role: 'admin',
      preferredLanguage: 'en',
      district: 'Nashik',
      state: 'Maharashtra',
    };

    this.users.set(beekeeperUser.id, beekeeperUser);
    this.users.set(adminUser.id, adminUser);
    this.beekeepers.set(beekeeperUser.beekeeperId, beekeeperUser);

    // 2. Apiaries for Ramesh Patil
    const apiary1: Apiary = {
      id: 'API-MH-NAS-01',
      name: 'Sahyadri Flora Apiary',
      beekeeperId: beekeeperUser.beekeeperId,
      locationName: 'Trimbak Foothills, Dindori',
      village: 'Dindori',
      district: 'Nashik',
      state: 'Maharashtra',
      coordinates: { lat: 19.9975, lng: 73.7898 },
      floraType: ['Wild Forest Flora', 'Mustard', 'Jamun', 'Neem'],
      hiveCount: 16,
      status: 'active',
      createdAt: '2024-03-20T08:00:00Z',
    };

    const apiary2: Apiary = {
      id: 'API-MH-NAS-02',
      name: 'Godavari Riverbank Apiary',
      beekeeperId: beekeeperUser.beekeeperId,
      locationName: 'Somanathpur Sector 4',
      village: 'Gangapur',
      district: 'Nashik',
      state: 'Maharashtra',
      coordinates: { lat: 20.0121, lng: 73.7431 },
      floraType: ['Acacia', 'Sunflower', 'Multi-Floral'],
      hiveCount: 8,
      status: 'active',
      createdAt: '2024-11-10T09:30:00Z',
    };

    this.apiaries.set(apiary1.id, apiary1);
    this.apiaries.set(apiary2.id, apiary2);

    // 3. Hives
    const hiveH023: Hive = {
      id: 'HC-HIVE-MH-NAS-00123',
      apiaryId: apiary1.id,
      beekeeperId: beekeeperUser.beekeeperId,
      boxNumber: 'H023',
      beeSpecies: 'Apis cerana indica',
      installationDate: '2024-04-02',
      queenAgeMonths: 11,
      currentHealthScore: 64, // Needs attention
      status: 'attention',
      lastInspectionDate: '2026-09-21',
      hasIoTUnit: true,
      iotDeviceId: 'IOT-ESP32-9901',
      batteryLevel: 94,
      totalHarvestsCount: 4,
      lifetimeHoneyYieldKg: 32.4,
    };

    const hiveH024: Hive = {
      id: 'HC-HIVE-MH-NAS-00124',
      apiaryId: apiary1.id,
      beekeeperId: beekeeperUser.beekeeperId,
      boxNumber: 'H024',
      beeSpecies: 'Apis cerana indica',
      installationDate: '2024-04-02',
      queenAgeMonths: 8,
      currentHealthScore: 92, // Healthy
      status: 'healthy',
      lastInspectionDate: '2026-09-24',
      hasIoTUnit: true,
      iotDeviceId: 'IOT-ESP32-9902',
      batteryLevel: 89,
      totalHarvestsCount: 5,
      lifetimeHoneyYieldKg: 44.8,
    };

    const hiveH025: Hive = {
      id: 'HC-HIVE-MH-NAS-00125',
      apiaryId: apiary1.id,
      beekeeperId: beekeeperUser.beekeeperId,
      boxNumber: 'H025',
      beeSpecies: 'Apis cerana indica',
      installationDate: '2024-05-18',
      queenAgeMonths: 14,
      currentHealthScore: 48, // Critical
      status: 'critical',
      lastInspectionDate: '2026-09-25',
      hasIoTUnit: true,
      iotDeviceId: 'IOT-ESP32-9903',
      batteryLevel: 91,
      totalHarvestsCount: 2,
      lifetimeHoneyYieldKg: 18.2,
    };

    const hiveH088: Hive = {
      id: 'HC-HIVE-MH-PUN-00088',
      apiaryId: apiary2.id,
      beekeeperId: beekeeperUser.beekeeperId,
      boxNumber: 'H088',
      beeSpecies: 'Apis mellifera',
      installationDate: '2024-08-10',
      queenAgeMonths: 6,
      currentHealthScore: 95,
      status: 'healthy',
      lastInspectionDate: '2026-09-22',
      hasIoTUnit: true,
      iotDeviceId: 'IOT-ESP32-9904',
      batteryLevel: 98,
      totalHarvestsCount: 6,
      lifetimeHoneyYieldKg: 58.0,
    };

    this.hives.set(hiveH023.id, hiveH023);
    this.hives.set(hiveH024.id, hiveH024);
    this.hives.set(hiveH025.id, hiveH025);
    this.hives.set(hiveH088.id, hiveH088);

    // 4. Alerts
    const alertH023: HiveAlert = {
      id: 'ALT-2026-09-001',
      hiveId: hiveH023.id,
      beekeeperId: beekeeperUser.beekeeperId,
      timestamp: '2026-09-26T09:15:00Z',
      severity: 'warning',
      parameter: 'temperature',
      title: 'High Brood Temperature Warning (38.6°C)',
      message: 'Brood temperature exceeded safety threshold of 35.5°C for 3 consecutive hours. Worker bees are actively fanning.',
      observedValue: '38.6°C',
      idealRange: '34.0°C - 35.5°C',
      recommendedAction: 'Provide additional canopy shade over Box H023 and ensure nearby freshwater trough is filled to prevent brood overheating.',
      isAcknowledged: false,
    };

    const alertH025: HiveAlert = {
      id: 'ALT-2026-09-002',
      hiveId: hiveH025.id,
      beekeeperId: beekeeperUser.beekeeperId,
      timestamp: '2026-09-25T14:40:00Z',
      severity: 'critical',
      parameter: 'weight',
      title: 'Abrupt Weight Loss Alert (-2.4 kg)',
      message: 'Sudden hive mass drop detected between 13:00 and 14:30. Acoustic sensors recorded swarming flight frequencies (>600 Hz).',
      observedValue: '35.8 kg (-2.4 kg)',
      idealRange: 'Stable or +0.2-0.5 kg/day',
      recommendedAction: 'Immediate field inspection needed: Check for departed swarm cluster on nearby tree branches to recapture queen.',
      isAcknowledged: true,
      linkedTicketId: 'HC-T-1022',
    };

    this.alerts.set(alertH023.id, alertH023);
    this.alerts.set(alertH025.id, alertH025);

    // 5. Harvests
    const harvest01: HarvestRecord = {
      id: 'HV-2026-0042',
      hiveId: hiveH024.id,
      apiaryId: apiary1.id,
      beekeeperId: beekeeperUser.beekeeperId,
      harvestDate: '2026-09-12',
      quantityKg: 8.7,
      floralSource: 'Multi-Floral Wild Forest & Mustard',
      moisturePercentage: 17.4,
      colorGrade: 'Extra Light Amber',
      notes: 'Super frames fully capped. High nectar purity, pristine aromatic bouquet.',
      batchId: 'HC-MH-NAS-2026-00047',
    };
    this.harvests.set(harvest01.id, harvest01);

    // 6. Batches & Blockchain Timeline
    const batch01Events = [
      {
        id: 'EVT-001',
        eventType: 'HIVE_REGISTERED' as const,
        title: 'Hive Digital Identity Minted',
        timestamp: '2024-04-02T10:00:00Z',
        actor: 'Ramesh Patil (KVIC Registered Beekeeper)',
        actorRole: 'Beekeeper',
        location: 'Sahyadri Flora Apiary, Dindori, Nashik',
        description: 'Hive HC-HIVE-MH-NAS-00124 (Box H024) inspected and assigned permanent digital identity with IoT sensor module #9902.',
        txHash: '0x8f2a149b8173491bc309e4f20819a3b7d159048381940176cdb2c91201',
        verified: true,
      },
      {
        id: 'EVT-002',
        eventType: 'HONEY_PRODUCED' as const,
        title: 'Continuous IoT Colony Production',
        timestamp: '2026-09-10T16:00:00Z',
        actor: 'Honey Chain IoT Telemetry Engine',
        actorRole: 'Automated Node #9902',
        location: 'Dindori Apiary Cluster',
        description: 'Colony maintained steady brood thermal equilibrium (34.7°C avg) across 45-day flowering cycle. Weight accumulated to 46.8 kg.',
        txHash: '0x3c99018247dfa19b02447990176cdb2c912028f2a149b8173491bc309e4',
        verified: true,
      },
      {
        id: 'EVT-003',
        eventType: 'HARVESTED' as const,
        title: 'Manual Comb Frame Extraction',
        timestamp: '2026-09-12T07:30:00Z',
        actor: 'Ramesh Patil',
        actorRole: 'Beekeeper',
        location: 'Sahyadri Apiary, Nashik',
        description: 'Harvested 8.7 kg of 100% capped multi-floral honeycomb using stainless steel KVIC-approved uncapping fork.',
        txHash: '0x71c0d21a282496291c2d34091afee0b1a7d9bfc4038f2a149b8173491bc',
        verified: true,
      },
      {
        id: 'EVT-004',
        eventType: 'EXTRACTED' as const,
        title: 'Cold Centrifugal Extraction',
        timestamp: '2026-09-13T11:00:00Z',
        actor: 'KVIC Honey Processing Common Facility Center',
        actorRole: 'Facility Operator',
        location: 'KVIC Nashik Rural Center',
        description: 'Honey extracted at ambient temperature without heat pasteurization, preserving natural enzymes, invertase, and pollen grains.',
        txHash: '0x10b7849e81726a45b1287948a30192e4bc8190248f2a149b8173491bc304',
        verified: true,
      },
      {
        id: 'EVT-005',
        eventType: 'QUALITY_TESTED' as const,
        title: 'FSSAI & KVIC Laboratory Analysis',
        timestamp: '2026-09-14T14:20:00Z',
        actor: 'National Honey Testing Laboratory (NABL Accredited)',
        actorRole: 'Quality Auditor',
        location: 'Regional Testing Lab, Nashik',
        description: 'Moisture content: 17.4% (Max 20% allowed). Sucrose: 2.8% (Max 5%). HMF: 14 mg/kg (Max 80). C4 sugar isotope test: NEGATIVE. Passed all purity norms.',
        txHash: '0x49c1829e018274619ba48910248f2a149b8173491bc309e4f20819a3b705',
        verified: true,
      },
      {
        id: 'EVT-006',
        eventType: 'PROCESSED_PACKAGED' as const,
        title: 'Batch Bottling & Batch Tagging',
        timestamp: '2026-09-16T10:15:00Z',
        actor: 'Sahyadri Honey Producer Co-Op',
        actorRole: 'Packaging Unit',
        location: 'Nashik Agro-Park',
        description: 'Sealed into 500g food-grade glass jars with tamper-evident seal. Batch Number HC-MH-NAS-2026-00047 printed on bottle neck.',
        txHash: '0x55d81729a48b1920e487192048f2a149b8173491bc309e4f20819a3b706',
        verified: true,
      },
      {
        id: 'EVT-007',
        eventType: 'DISTRIBUTED' as const,
        title: 'Dispatched to KVIC & Market Network',
        timestamp: '2026-09-18T09:00:00Z',
        actor: 'KVIC Khadi Bhavan Distribution',
        actorRole: 'Logistics Partner',
        location: 'Mumbai & Pune Retail Hubs',
        description: 'Dispatched 120 sealed jars to regional retail outlets and Honey Chain direct-to-consumer marketplace.',
        txHash: '0x99a81724018293748291048201948172901847192048172948192048107',
        verified: true,
      },
    ];

    const batch01: HoneyBatch = {
      id: 'HC-MH-NAS-2026-00047',
      productName: 'Pure Raw Multi-Floral Sahyadri Honey',
      beekeeperId: beekeeperUser.beekeeperId,
      beekeeperName: beekeeperUser.name,
      apiaryId: apiary1.id,
      apiaryName: apiary1.name,
      hiveIds: [hiveH024.id],
      harvestId: harvest01.id,
      harvestDate: '2026-09-12',
      packagingDate: '2026-09-16',
      bestBeforeDate: '2028-09-15',
      quantityBottles: 120,
      bottleVolumeMl: 500,
      floralSource: 'Wild Forest Flora, Mustard & Jamun',
      originDistrict: 'Nashik',
      originState: 'Maharashtra',
      fssaiNumber: '10022022000841',
      kvicCertificationId: 'KVIC-HM-CERT-2026-4401',
      moisturePercentage: 17.4,
      sucrosePercentage: 2.8,
      pollenAnalysis: 'Rich multi-floral diversity (48% Brassica, 32% Syzygium cumini, 20% wild forest herbs)',
      blockchainTxHash: '0x8f2a149b8173491bc309e4f20819a3b7d159048381940176cdb2c91201',
      blockNumber: 18492040,
      smartContractAddress: '0x71C0d21a282496291C2D34091AfeE0b1A7d9BfC4',
      verificationStatus: 'VERIFIED',
      qrCodeUrl: '/trace/HC-MH-NAS-2026-00047',
      traceabilityUrl: '/trace/HC-MH-NAS-2026-00047',
      scanCount: 14,
      events: batch01Events,
    };

    // Batches are loaded dynamically from Firestore (real producer records)

    // 7. Marketplace Products
    const product01: MarketplaceProduct = {
      id: 'MP-001',
      batchId: batch01.id,
      title: 'KVIC Certified Pure Raw Sahyadri Honey (500g)',
      beekeeperId: beekeeperUser.beekeeperId,
      beekeeperName: beekeeperUser.name,
      producerLocation: 'Dindori, Nashik (Maharashtra)',
      floralType: 'Multi-Floral Wild Forest & Mustard',
      priceInr: 350,
      weightGrams: 500,
      availableStockBottles: 86,
      verifiedBadge: true,
      harvestDate: '12 Sept 2026',
      description: 'Cold-extracted unpasteurized honey sourced directly from KVIC-assisted Apis cerana hives in the Western Ghats. Verified with blockchain traceability.',
      contactNumber: '+91 98234 56781',
    };

    this.marketplace.set(product01.id, product01);

    // 8. Support Tickets
    const ticket01: SupportTicket = {
      id: 'HC-T-1023',
      beekeeperId: beekeeperUser.beekeeperId,
      beekeeperName: beekeeperUser.name,
      hiveId: hiveH023.id,
      alertId: alertH023.id,
      title: 'High Brood Temperature (38.6°C) in Box H023',
      category: 'hive_health',
      status: 'OPEN',
      createdAt: '2026-09-26T09:30:00Z',
      updatedAt: '2026-09-26T09:30:00Z',
      prefilledTelemetry: {
        temperature: 38.6,
        humidity: 48,
        weight: 41.2,
        healthScore: 64,
      },
      messages: [
        {
          id: 'MSG-001',
          senderId: beekeeperUser.id,
          senderName: beekeeperUser.name,
          senderRole: 'beekeeper',
          timestamp: '2026-09-26T09:30:00Z',
          message: 'Hello, the IoT sensor on Box H023 triggered an alert showing 38.6°C. Bees are fanning vigorously at the entrance. Should I move the box under denser tree canopy or install a wet burlap cloth on top?',
        },
      ],
    };

    const ticket02: SupportTicket = {
      id: 'HC-T-1022',
      beekeeperId: beekeeperUser.beekeeperId,
      beekeeperName: beekeeperUser.name,
      hiveId: hiveH025.id,
      alertId: alertH025.id,
      title: 'Swarming / Mass Reduction in Box H025',
      category: 'hive_health',
      status: 'RESPONDED',
      createdAt: '2026-09-25T15:00:00Z',
      updatedAt: '2026-09-25T16:45:00Z',
      prefilledTelemetry: {
        temperature: 36.4,
        humidity: 54,
        weight: 35.8,
        healthScore: 48,
      },
      messages: [
        {
          id: 'MSG-002',
          senderId: beekeeperUser.id,
          senderName: beekeeperUser.name,
          senderRole: 'beekeeper',
          timestamp: '2026-09-25T15:00:00Z',
          message: 'Sudden weight drop of 2.4kg. I think a prime swarm has left the hive.',
        },
        {
          id: 'MSG-003',
          senderId: adminUser.id,
          senderName: 'Dr. Anil Joshi (KVIC Officer)',
          senderRole: 'admin',
          timestamp: '2026-09-25T16:45:00Z',
          message: 'Ramesh ji, please check the neem trees within 50 meters of the apiary immediately. Place an empty bait box with old wax foundation and lemon-grass scent nearby to attract the swarm. Inspect H025 for emergency queen cells.',
        },
      ],
    };

    this.tickets.set(ticket01.id, ticket01);
    this.tickets.set(ticket02.id, ticket02);

    // 9. Learning Content
    const learn01: LearningContent = {
      id: 'LRN-001',
      title: 'Modern Hive Monitoring & Temperature Equilibrium',
      description: 'Official KVIC Honey Mission guide on interpreting digital temperature/humidity sensor data and preventing summer thermal stress in Indian bee colonies.',
      category: 'hive_management',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 14,
      language: 'en',
      publishedDate: '2026-09-20',
      authorName: 'KVIC Central Bee Research Institute (CBRI), Pune',
      viewsCount: 1420,
    };

    const learn02: LearningContent = {
      id: 'LRN-002',
      title: 'Varroa Mite Detection & Organic Thymol Treatment',
      description: 'Step-by-step diagnostic techniques for inspecting brood comb frames and applying KVIC-approved herbal miticides without honey contamination.',
      category: 'disease_control',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 18,
      language: 'en',
      publishedDate: '2026-09-15',
      authorName: 'KVIC Bee Health Directorate',
      viewsCount: 2310,
    };

    const learn03: LearningContent = {
      id: 'LRN-003',
      title: 'KVIC Honey Mission Subsidy & Toolkits (मधुमक्खी पालन योजना)',
      description: 'Complete walkthrough of applying for 80% subsidized bee boxes, centrifugal extractors, and digital Honey Chain IoT monitoring starter kits.',
      category: 'kvic_schemes',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 22,
      language: 'hi',
      publishedDate: '2026-09-01',
      authorName: 'KVIC Directorate of Honey Mission',
      viewsCount: 4890,
    };

    this.learningContent.set(learn01.id, learn01);
    this.learningContent.set(learn02.id, learn02);
    this.learningContent.set(learn03.id, learn03);

    // 10. Notifications
    const notif1: AppNotification = {
      id: 'NTF-01',
      userId: beekeeperUser.id,
      title: 'Thermal Warning in Hive H023',
      message: 'Temperature reached 38.6°C. Tap to inspect readings and raise support ticket.',
      type: 'alert',
      timestamp: '2026-09-26T09:15:00Z',
      read: false,
      linkUrl: '#alerts',
    };

    const notif2: AppNotification = {
      id: 'NTF-02',
      userId: beekeeperUser.id,
      title: 'New Video Guide Published by KVIC',
      message: 'CBRI Pune added "Modern Hive Monitoring & Temperature Equilibrium".',
      type: 'learning',
      timestamp: '2026-09-20T10:00:00Z',
      read: true,
      linkUrl: '#learning',
    };

    this.notifications.set(notif1.id, notif1);
    this.notifications.set(notif2.id, notif2);

    // 11. Cluster Statistics
    const clusterNashik: ClusterStatistics = {
      clusterId: 'CLUSTER-MH-NAS',
      name: 'Nashik Tribal & Agro Honey Cluster',
      state: 'Maharashtra',
      district: 'Nashik',
      registeredBeekeepers: 126,
      registeredApiaries: 248,
      activeHives: 1840,
      healthyHives: 1612,
      warningHives: 186,
      criticalHives: 42,
      totalHoneyProducedKg: 24200,
      activeBatchesCount: 48,
      activeAlertsCount: 27,
      openTicketsCount: 8,
    };

    const clusterPune: ClusterStatistics = {
      clusterId: 'CLUSTER-MH-PUN',
      name: 'Western Ghats Bio-Diversity Cluster',
      state: 'Maharashtra',
      district: 'Pune',
      registeredBeekeepers: 94,
      registeredApiaries: 180,
      activeHives: 1420,
      healthyHives: 1280,
      warningHives: 110,
      criticalHives: 30,
      totalHoneyProducedKg: 19800,
      activeBatchesCount: 36,
      activeAlertsCount: 18,
      openTicketsCount: 5,
    };

    this.clusters.set(clusterNashik.clusterId, clusterNashik);
    this.clusters.set(clusterPune.clusterId, clusterPune);
  }
}

export const mockDb = new MockDatabase();

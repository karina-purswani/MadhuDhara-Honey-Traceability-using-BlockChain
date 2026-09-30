import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppNotification,
  BatchEvent,
  BeekeeperProfile,
  HarvestRecord,
  Hive,
  HiveAlert,
  HiveReading,
  HoneyBatch,
  LearningContent,
  MarketplaceProduct,
  OrderRequest,
  SupportTicket,
  TicketMessage,
} from '../../shared/types';
import { mockDb } from '../../backend/src/repositories/mock.db';
import { iotService } from '../../iot/services/iot.service';
import { SimulationScenario } from '../../iot/simulator/hive_simulator';
import { blockchainService } from '../../blockchain/services/blockchain.service';
import { aiService } from '../../ai-service/services/ai.service';
import { QrService } from '../services/qr.service';
import { useAuth } from './AuthContext';
import {
  firestoreIdentityService,
  firestoreHiveRepository,
  firestoreBatchRepository,
  firestorePublicBatchRepository,
} from '../services/firestore';
import {
  getAlerts,
  createAlert as apiCreateAlert,
  acknowledgeAlert as apiAcknowledgeAlert,
} from '../services/api/alerts.api';
import {
  getTickets,
  createTicket as apiCreateTicket,
  addTicketMessage as apiAddTicketMessage,
} from '../services/api/tickets.api';
import {
  getBatches,
  createBatch as apiCreateBatch,
} from '../services/api/batches.api';
import {
  getLearningContent,
  publishLearningContent as apiPublishLearningContent,
  getUserNotifications,
  markNotificationAsRead as apiMarkNotificationAsRead,
} from '../services/api/learning.api';
import {
  getMarketplaceProducts,
  createMarketplaceProduct as apiCreateMarketplaceProduct,
  deleteMarketplaceProduct as apiDeleteMarketplaceProduct,
} from '../services/api/marketplace.api';
import {
  getOrderRequests,
  createOrderRequest as apiCreateOrderRequest,
  updateOrderStatus as apiUpdateOrderStatus,
} from '../services/api/orders.api';

interface AppContextType {
  hives: Hive[];
  allHives: Hive[]; // Admin access
  selectedHiveId: string;
  setSelectedHiveId: (id: string) => void;
  selectedHive: Hive | undefined;
  liveReading: HiveReading | null;
  readingHistory: HiveReading[];
  simulationScenario: SimulationScenario;
  setSimulationScenario: (sc: SimulationScenario) => void;
  alerts: HiveAlert[];
  allAlerts: HiveAlert[];
  tickets: SupportTicket[];
  allTickets: SupportTicket[];
  acknowledgeAlert: (alertId: string) => Promise<void>;
  createSupportTicket: (data: {
    hiveId?: string;
    alertId?: string;
    title: string;
    message: string;
  }) => Promise<SupportTicket>;
  respondToTicket: (ticketId: string, message: string, newStatus?: SupportTicket['status']) => void;
  batches: HoneyBatch[];
  allBatches: HoneyBatch[];
  createHoneyBatch: (params: {
    productName: string;
    floralSource: string;
    quantityKg: number;
    hiveId: string;
  }) => Promise<HoneyBatch>;
  learningItems: LearningContent[];
  publishLearningContent: (item: Omit<LearningContent, 'id' | 'viewsCount' | 'publishedDate'>) => Promise<LearningContent>;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  marketplaceProducts: MarketplaceProduct[];
  addMarketplaceProduct: (product: Omit<MarketplaceProduct, 'id' | 'verifiedBadge'>) => Promise<MarketplaceProduct>;
  deleteMarketplaceProduct: (id: string) => Promise<boolean>;
  orderRequests: OrderRequest[];
  submitOrderRequest: (req: {
    productId: string;
    productName?: string;
    batchNumber: string;
    beekeeperUid: string;
    beekeeperId?: string;
    consumerName?: string;
    consumerContact?: string;
    consumerMessage?: string;
    requestedQuantity?: number;
  }) => Promise<OrderRequest>;
  updateOrderRequestStatus: (
    orderRequestId: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  ) => Promise<boolean>;
  refreshIoT: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isBeekeeper, isAdmin, userHives } = useAuth();

  const currentBeekeeperId = isBeekeeper && (currentUser as BeekeeperProfile)?.beekeeperId
    ? (currentUser as BeekeeperProfile).beekeeperId
    : null;

  // Master collections
  const [allHives, setAllHives] = useState<Hive[]>([]);

  // Synchronize Firestore hives into master allHives collection
  useEffect(() => {
    async function loadHivesFromFirestore() {
      if (currentUser?.firebaseUid) {
        try {
          let fsHives: any[] = [];
          if (isAdmin) {
            fsHives = await firestoreHiveRepository.getAllHives();
          } else if (currentUser?.firebaseUid) {
            fsHives = await firestoreHiveRepository.getHivesByBeekeeper(currentUser.firebaseUid);
          }
          if (fsHives && fsHives.length > 0) {
            setAllHives(fsHives as Hive[]);
            fsHives.forEach((h) => mockDb.hives.set(h.id, h));
            return;
          }
        } catch (e) {
          console.warn('Could not load hives from Firestore:', e);
        }
      }

      if (userHives && userHives.length > 0) {
        setAllHives((prev) => {
          const existingIds = new Set(prev.map((h) => h.id));
          const newOnes = userHives.filter((h) => !existingIds.has(h.id));
          if (newOnes.length === 0) return prev;
          return [...newOnes, ...prev];
        });
      } else if (!currentUser) {
        setAllHives(Array.from(mockDb.hives.values()));
      }
    }

    loadHivesFromFirestore();
  }, [currentUser, isBeekeeper, isAdmin, userHives]);
  const [allAlerts, setAllAlerts] = useState<HiveAlert[]>(Array.from(mockDb.alerts.values()));
  const [allTickets, setAllTickets] = useState<SupportTicket[]>(Array.from(mockDb.tickets.values()));
  const [allBatches, setAllBatches] = useState<HoneyBatch[]>([]);

  // Synchronize batches via backend REST API with Firestore fallback
  useEffect(() => {
    async function loadBatches() {
      if (currentUser?.firebaseUid) {
        try {
          const apiBatches = await getBatches();
          if (apiBatches && apiBatches.length > 0) {
            setAllBatches(apiBatches);
            return;
          }
        } catch (e) {
          console.warn('Could not load batches from API, trying direct Firestore fallback:', e);
        }

        // Direct Firestore fallback
        try {
          const { firestoreBatchRepository } = await import('../services/firestore/batch.repository');
          let fsBatches: any[] = [];
          if (isAdmin) {
            fsBatches = await firestoreBatchRepository.getAllBatches();
          } else if (currentUser?.firebaseUid) {
            fsBatches = await firestoreBatchRepository.getBatchesByBeekeeper(currentUser.firebaseUid);
          }
          if (fsBatches && fsBatches.length > 0) {
            setAllBatches(fsBatches as HoneyBatch[]);
          }
        } catch (fsErr) {
          console.warn('Could not load batches from direct Firestore fallback:', fsErr);
        }
      }
    }
    loadBatches();
  }, [currentUser, isBeekeeper, isAdmin]);

  // Synchronize alerts and tickets via backend REST API
  useEffect(() => {
    async function loadAlertsAndTickets() {
      if (currentUser?.firebaseUid) {
        try {
          const [apiAlerts, apiTickets] = await Promise.all([
            getAlerts(),
            getTickets(),
          ]);
          if (apiAlerts && apiAlerts.length > 0) {
            setAllAlerts(apiAlerts);
          }
          if (apiTickets && apiTickets.length > 0) {
            setAllTickets(apiTickets);
          }
        } catch (e) {
          console.warn('Could not load alerts/tickets from API:', e);
        }
      }
    }
    loadAlertsAndTickets();
  }, [currentUser, isBeekeeper, isAdmin]);

  // Synchronize Learning content and user notifications via backend REST API
  useEffect(() => {
    async function loadLearningAndNotifications() {
      // 1. Load published learning resources strictly from backend API (with Firestore fallback)
      try {
        const apiLearning = await getLearningContent();
        setLearningItems(apiLearning || []);
      } catch (err) {
        console.warn('Could not load learning content from API, falling back to Firestore:', err);
        try {
          const firestoreLearning = await firestoreIdentityService.loadPublishedLearningContent();
          setLearningItems(firestoreLearning || []);
        } catch (fbErr) {
          console.warn('Could not load learning content from Firestore fallback:', fbErr);
          setLearningItems([]);
        }
      }

      // 2. Load notifications for authenticated user via backend API
      if (currentUser?.firebaseUid) {
        try {
          const userNotifs = await getUserNotifications();
          if (userNotifs && userNotifs.length > 0) {
            setNotifications((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const newNotifs = userNotifs.filter((n) => !existingIds.has(n.id));
              const updated = prev.map((n) => {
                const match = userNotifs.find((un) => un.id === n.id);
                return match ? match : n;
              });
              return [...newNotifs, ...updated];
            });
          }
        } catch (err) {
          console.warn('Could not load user notifications from API, trying Firestore fallback:', err);
          try {
            const userNotifs = await firestoreIdentityService.loadUserNotifications(currentUser.firebaseUid);
            if (userNotifs && userNotifs.length > 0) {
              setNotifications((prev) => {
                const existingIds = new Set(prev.map((n) => n.id));
                const newNotifs = userNotifs.filter((n) => !existingIds.has(n.id));
                const updated = prev.map((n) => {
                  const match = userNotifs.find((un) => un.id === n.id);
                  return match ? match : n;
                });
                return [...newNotifs, ...updated];
              });
            }
          } catch (fbErr) {
            console.warn('Could not load user notifications from Firestore fallback:', fbErr);
          }
        }
      }
    }

    loadLearningAndNotifications();
  }, [currentUser]);

  const [learningItems, setLearningItems] = useState<LearningContent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(Array.from(mockDb.notifications.values()));
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>(
    Array.from(mockDb.marketplace.values())
  );
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);

  // Synchronize marketplace products and order requests via backend REST API
  useEffect(() => {
    async function loadMarketplaceData() {
      try {
        const prods = await getMarketplaceProducts();
        if (prods && prods.length > 0) {
          setMarketplaceProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newProds = prods.filter((p) => !existingIds.has(p.id));
            const updated = prev.map((p) => {
              const match = prods.find((mp) => mp.id === p.id);
              return match ? match : p;
            });
            return [...newProds, ...updated];
          });
        }
      } catch (err) {
        console.warn('Could not load marketplace products from API, falling back to Firestore:', err);
        try {
          await firestoreIdentityService.seedDemoMarketplaceProducts();
          const publicProducts = await firestoreIdentityService.loadPublicMarketplaceProducts();
          if (publicProducts && publicProducts.length > 0) {
            setMarketplaceProducts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newProds = publicProducts.filter((p) => !existingIds.has(p.id));
              const updated = prev.map((p) => {
                const match = publicProducts.find((mp) => mp.id === p.id);
                return match ? match : p;
              });
              return [...newProds, ...updated];
            });
          }
        } catch (fbErr) {
          console.warn('Could not load marketplace products from Firestore fallback:', fbErr);
        }
      }

      if (currentUser?.firebaseUid) {
        try {
          const reqs = await getOrderRequests();
          setOrderRequests(reqs);
        } catch (err) {
          console.warn('Could not load order requests from API, falling back to Firestore:', err);
          if (isBeekeeper && currentUser?.firebaseUid) {
            try {
              const reqs = await firestoreIdentityService.loadBeekeeperOrderRequests(currentUser.firebaseUid);
              setOrderRequests(reqs);
            } catch (fbErr) {
              console.warn('Could not load beekeeper order requests from Firestore:', fbErr);
            }
          } else if (isAdmin) {
            try {
              const reqs = await firestoreIdentityService.loadAllOrderRequests();
              setOrderRequests(reqs);
            } catch (fbErr) {
              console.warn('Could not load admin order requests from Firestore:', fbErr);
            }
          }
        }
      }
    }

    loadMarketplaceData();
  }, [currentUser, isBeekeeper, isAdmin]);

  // Scoped views based on authorization
  const hives = isBeekeeper && currentBeekeeperId
    ? allHives.filter((h) => h.beekeeperId === currentBeekeeperId)
    : allHives;

  const alerts = isBeekeeper && currentBeekeeperId
    ? allAlerts.filter((a) => a.beekeeperId === currentBeekeeperId)
    : allAlerts;

  const tickets = isBeekeeper && currentBeekeeperId
    ? allTickets.filter((t) => t.beekeeperId === currentBeekeeperId)
    : allTickets;

  const batches = isBeekeeper && currentBeekeeperId
    ? allBatches.filter((b) => b.beekeeperId === currentBeekeeperId)
    : allBatches;

  // Selected hive for IoT view (defaults to first genuine registered hive)
  const [selectedHiveId, setSelectedHiveId] = useState<string>('');

  // Update selected hive when user's hives change
  useEffect(() => {
    if (hives.length > 0 && (!selectedHiveId || !hives.some((h) => h.id === selectedHiveId))) {
      setSelectedHiveId(hives[0].id);
    }
  }, [currentBeekeeperId, allHives, hives, selectedHiveId]);

  const selectedHive = hives.find((h) => h.id === selectedHiveId) || hives[0];

  const [liveReading, setLiveReading] = useState<HiveReading | null>(null);
  const [readingHistory, setReadingHistory] = useState<HiveReading[]>([]);
  const [simulationScenario, setSimulationScenarioState] = useState<SimulationScenario>('HEAT_STRESS');

  // Refresh IoT readings
  const refreshIoT = async () => {
    if (!selectedHiveId) return;
    try {
      const reading = await iotService.getLatestReading(selectedHiveId);
      const history = await iotService.getReadingHistory(selectedHiveId, 24);
      setLiveReading(reading);
      setReadingHistory(history);

      // Dynamically recalculate health score for this hive
      const health = aiService.calculateHealthScore(reading);
      setAllHives((prev) =>
        prev.map((h) =>
          h.id === selectedHiveId
            ? {
                ...h,
                currentHealthScore: health.overallScore,
                status: health.status === 'warning' ? 'attention' : health.status,
              }
            : h
        )
      );

      // Evaluate anomaly alert condition with deduplication
      if (isBeekeeper && currentUser?.firebaseUid && reading) {
        let conditionAlert: {
          alertType: 'temperature' | 'humidity' | 'weight';
          severity: 'warning' | 'critical';
          title: string;
          message: string;
          observedValue: string;
          idealRange: string;
          recommendedAction: string;
        } | null = null;

        if (reading.temperature > 37.0) {
          conditionAlert = {
            alertType: 'temperature',
            severity: reading.temperature > 38.0 ? 'critical' : 'warning',
            title: `High Brood Temperature Warning (${reading.temperature}°C)`,
            message: `Brood temperature exceeded safety threshold of 35.5°C. Worker bees are actively fanning.`,
            observedValue: `${reading.temperature}°C`,
            idealRange: '34.0°C - 35.5°C',
            recommendedAction: `Provide additional canopy shade over Box ${selectedHive?.boxNumber || selectedHiveId.slice(-4)} and ensure nearby freshwater trough is filled.`,
          };
        } else if (reading.weight < 38 || (reading.acousticFrequencyHz && reading.acousticFrequencyHz > 600)) {
          conditionAlert = {
            alertType: 'weight',
            severity: 'critical',
            title: `Abrupt Weight Loss Alert (${reading.weight} kg)`,
            message: `Sudden hive mass drop detected. Acoustic sensors recorded swarming flight frequencies (${reading.acousticFrequencyHz || 610} Hz).`,
            observedValue: `${reading.weight} kg`,
            idealRange: 'Stable or +0.2-0.5 kg/day',
            recommendedAction: 'Immediate field inspection needed: Check for departed swarm cluster on nearby tree branches to recapture queen.',
          };
        } else if (reading.humidity > 70) {
          conditionAlert = {
            alertType: 'humidity',
            severity: 'warning',
            title: `High Internal Hive Humidity (${reading.humidity}% )`,
            message: `Relative humidity at ${reading.humidity}% warrants ventilation check to prevent damp brood.`,
            observedValue: `${reading.humidity}%`,
            idealRange: '50% - 65%',
            recommendedAction: 'Check bottom board ventilation and replace damp crown board cushions.',
          };
        }

        if (conditionAlert) {
          // Deduplication: check if active unacknowledged alert already exists for this hive and parameter
          const hasActiveAlert = allAlerts.some(
            (a) => a.hiveId === selectedHiveId && a.parameter === conditionAlert!.alertType && !a.isAcknowledged
          );

          if (!hasActiveAlert) {
            const beekeeperUid = currentUser.firebaseUid;
            const beekeeperId = currentBeekeeperId || 'BK-MH-NAS-0129';
            try {
              let newAlert: HiveAlert | null = null;
              try {
                newAlert = await apiCreateAlert({
                  hiveId: selectedHiveId,
                  alertType: conditionAlert.alertType,
                  severity: conditionAlert.severity,
                  title: conditionAlert.title,
                  message: conditionAlert.message,
                  observedValue: conditionAlert.observedValue,
                  idealRange: conditionAlert.idealRange,
                  recommendedAction: conditionAlert.recommendedAction,
                  healthScore: health.overallScore,
                });
              } catch (apiErr) {
                console.warn('Could not persist alert via API, trying Firestore fallback:', apiErr);
                newAlert = await firestoreIdentityService.recordIoTAlertInFirestore({
                  beekeeperUid,
                  beekeeperId,
                  hiveId: selectedHiveId,
                  alertType: conditionAlert.alertType,
                  severity: conditionAlert.severity,
                  title: conditionAlert.title,
                  message: conditionAlert.message,
                  observedValue: conditionAlert.observedValue,
                  idealRange: conditionAlert.idealRange,
                  recommendedAction: conditionAlert.recommendedAction,
                  healthScore: health.overallScore,
                });
              }

              if (newAlert) {
                setAllAlerts((prev) => [newAlert!, ...prev]);
                mockDb.alerts.set(newAlert.id, newAlert);
              }
            } catch (alertErr) {
              console.warn('Could not persist IoT alert to Firestore or API:', alertErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching IoT telemetry:', err);
    }
  };

  useEffect(() => {
    // Only poll IoT telemetry if an active beekeeper is logged in
    if (!isBeekeeper) return;

    refreshIoT();
    const interval = setInterval(refreshIoT, 8000);
    return () => clearInterval(interval);
  }, [selectedHiveId, isBeekeeper]);

  const setSimulationScenario = (scenario: SimulationScenario) => {
    setSimulationScenarioState(scenario);
    iotService.setSimulationScenario(selectedHiveId, scenario);
    refreshIoT();
  };

  // Acknowledge Alert via REST API
  const acknowledgeAlert = async (alertId: string): Promise<void> => {
    try {
      await apiAcknowledgeAlert(alertId);
    } catch (err) {
      console.warn('Could not persist alert acknowledgement to API, trying Firestore fallback:', err);
      try {
        await firestoreIdentityService.acknowledgeAlertInFirestore(alertId);
      } catch (fbErr) {
        console.warn('Could not persist alert acknowledgement to Firestore fallback:', fbErr);
      }
    }

    setAllAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isAcknowledged: true } : a))
    );

    const existing = mockDb.alerts.get(alertId);
    if (existing) {
      existing.isAcknowledged = true;
      mockDb.alerts.set(alertId, existing);
    }
  };

  // Create Support Ticket via REST API
  const createSupportTicket = async (data: {
    hiveId?: string;
    alertId?: string;
    title: string;
    message: string;
  }): Promise<SupportTicket> => {
    const beekeeperUid = currentUser?.firebaseUid || currentUser?.id || 'usr-beekeeper-01';
    const beekeeperId = currentBeekeeperId || 'BK-MH-NAS-0129';
    const beekeeperName = currentUser?.name || 'Ramesh Patil';
    const currentHealth = liveReading ? aiService.calculateHealthScore(liveReading).overallScore : 65;

    const sensorSnapshot = liveReading
      ? {
          temperature: liveReading.temperature,
          humidity: liveReading.humidity,
          weight: liveReading.weight,
          healthScore: currentHealth,
        }
      : undefined;

    let newTicket: SupportTicket;
    try {
      newTicket = await apiCreateTicket({
        hiveId: data.hiveId || selectedHiveId,
        alertId: data.alertId,
        title: data.title,
        message: data.message,
        category: 'hive_health',
        sensorSnapshot,
        healthScore: currentHealth,
      });
    } catch (err) {
      console.warn('Could not persist ticket to API, trying Firestore fallback:', err);
      try {
        newTicket = await firestoreIdentityService.createSupportTicketInFirestore({
          beekeeperUid,
          beekeeperId,
          beekeeperName,
          hiveId: data.hiveId || selectedHiveId,
          alertId: data.alertId,
          title: data.title,
          message: data.message,
          category: 'hive_health',
          sensorSnapshot,
          healthScore: currentHealth,
        });
      } catch (fbErr) {
        console.warn('Could not persist ticket to Firestore fallback, falling back locally:', fbErr);
        const newId = `HC-T-${Math.floor(1000 + Math.random() * 9000)}`;
        newTicket = {
          id: newId,
          beekeeperId,
          beekeeperName,
          hiveId: data.hiveId || selectedHiveId,
          alertId: data.alertId,
          title: data.title,
          category: 'hive_health',
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          prefilledTelemetry: sensorSnapshot,
          messages: [
            {
              id: `MSG-${Date.now().toString().slice(-4)}`,
              senderId: currentUser?.id || 'usr-beekeeper-01',
              senderName: beekeeperName,
              senderRole: 'beekeeper',
              timestamp: new Date().toISOString(),
              message: data.message,
            },
          ],
        };
      }
    }

    mockDb.tickets.set(newTicket.id, newTicket);
    setAllTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);

    // If linked to alert, update alert
    if (data.alertId) {
      setAllAlerts((prev) =>
        prev.map((alt) =>
          alt.id === data.alertId ? { ...alt, linkedTicketId: newTicket.id, isAcknowledged: true } : alt
        )
      );
      const existingAlert = mockDb.alerts.get(data.alertId);
      if (existingAlert) {
        existingAlert.linkedTicketId = newTicket.id;
        existingAlert.isAcknowledged = true;
        mockDb.alerts.set(data.alertId, existingAlert);
      }
    }

    // Add notification for admin
    const adminNotif: AppNotification = {
      id: `NTF-${Date.now()}`,
      userId: 'usr-admin-01',
      title: `New Ticket Raised: ${newTicket.title}`,
      message: `Beekeeper ${beekeeperName} submitted inquiry for Hive ${selectedHive?.boxNumber || 'H023'}.`,
      type: 'ticket',
      timestamp: new Date().toISOString(),
      read: false,
    };
    mockDb.notifications.set(adminNotif.id, adminNotif);
    setNotifications((prev) => [adminNotif, ...prev]);

    return newTicket;
  };

  const respondToTicket = async (
    ticketId: string,
    message: string,
    newStatus: SupportTicket['status'] = 'RESPONDED'
  ) => {
    const senderRole = isAdmin ? 'admin' : 'beekeeper';
    const senderUid = currentUser?.firebaseUid || currentUser?.id || (isAdmin ? 'usr-admin-01' : 'usr-beekeeper-01');
    const senderName = currentUser?.name || (isAdmin ? 'Dr. Anil Joshi (KVIC Officer)' : 'Ramesh Patil');

    let createdMsg: TicketMessage;
    try {
      createdMsg = await apiAddTicketMessage(ticketId, {
        message,
        newStatus,
      });
    } catch (err) {
      console.warn('Could not persist ticket response via API, trying Firestore fallback:', err);
      try {
        createdMsg = await firestoreIdentityService.respondToTicketInFirestore({
          ticketId,
          senderUid,
          senderName,
          senderRole,
          message,
          newStatus,
        });
      } catch (fbErr) {
        console.warn('Could not persist ticket response to Firestore, fallback local:', fbErr);
        createdMsg = {
          id: `MSG-${Date.now().toString().slice(-4)}`,
          senderId: senderUid,
          senderName,
          senderRole,
          timestamp: new Date().toISOString(),
          message,
        };
      }
    }

    setAllTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated: SupportTicket = {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            messages: [
              ...t.messages.filter((m) => m.id !== createdMsg.id),
              createdMsg,
            ],
          };
          mockDb.tickets.set(ticketId, updated);
          return updated;
        }
        return t;
      })
    );
  };

  // Create Honey Batch via REST API
  const createHoneyBatch = async (params: {
    productName: string;
    floralSource: string;
    quantityKg: number;
    hiveId: string;
  }): Promise<HoneyBatch> => {
    let newBatch: HoneyBatch;
    try {
      newBatch = await apiCreateBatch({
        productName: params.productName,
        floralSource: params.floralSource,
        quantityKg: params.quantityKg,
        hiveId: params.hiveId,
        hiveBoxNumber: selectedHive?.boxNumber,
        apiaryId: selectedHive?.apiaryId,
        apiaryName: `${currentUser?.name || 'Ramesh Patil'}'s Apiary`,
      });
    } catch (err) {
      console.warn('Could not create batch via API, falling back to direct Firestore:', err);
      const beekeeperProfile = currentUser as BeekeeperProfile;
      const beekeeperUid = currentUser?.firebaseUid || currentUser?.id || 'usr-beekeeper-01';

      newBatch = await firestoreIdentityService.createHoneyBatchInFirestore({
        beekeeperUid,
        beekeeperProfile: beekeeperProfile || {
          id: beekeeperUid,
          beekeeperId: currentBeekeeperId || 'BK-MH-NAS-0129',
          name: currentUser?.name || 'Ramesh Patil',
          email: currentUser?.email || 'beekeeper@example.com',
          phone: currentUser?.phone || '',
          role: 'beekeeper',
          preferredLanguage: 'en',
          kvicRegistrationNumber: 'KVIC-HM-2026-0001',
          village: 'Dindori',
          district: 'Nashik',
          state: 'Maharashtra',
          totalApiaries: 1,
          totalHives: 2,
          onboardingDate: new Date().toISOString().split('T')[0],
          experienceYears: 4,
        },
        productName: params.productName,
        floralSource: params.floralSource,
        quantityKg: params.quantityKg,
        hiveId: params.hiveId,
        hiveBoxNumber: selectedHive?.boxNumber,
        apiaryId: selectedHive?.apiaryId,
        apiaryName: `${currentUser?.name || 'Ramesh Patil'}'s Apiary`,
        existingBatchesCount: allBatches.length,
      });
    }

    mockDb.batches.set(newBatch.id, newBatch);
    setAllBatches((prev) => [newBatch, ...prev]);

    return newBatch;
  };

  const publishLearningContent = async (
    item: Omit<LearningContent, 'id' | 'viewsCount' | 'publishedDate'>
  ): Promise<LearningContent> => {
    let publishedItem: LearningContent;
    try {
      const res = await apiPublishLearningContent({
        title: item.title,
        description: item.description,
        category: item.category,
        youtubeUrl: item.youtubeUrl,
        durationMinutes: item.durationMinutes,
        language: item.language,
        authorName: item.authorName || 'KVIC Directorate of Honey Mission',
      });
      publishedItem = res;
    } catch (err) {
      console.warn('Could not publish learning content via API, fallback to Firestore:', err);
      try {
        const result = await firestoreIdentityService.publishLearningContentInFirestore({
          title: item.title,
          description: item.description,
          category: item.category,
          youtubeUrl: item.youtubeUrl,
          durationMinutes: item.durationMinutes,
          language: item.language,
          authorName: item.authorName || 'KVIC Directorate of Honey Mission',
          adminUid: currentUser?.firebaseUid,
        });
        publishedItem = result.content;
      } catch (fbErr) {
        console.warn('Could not publish learning content to Firestore, fallback local:', fbErr);
        publishedItem = {
          ...item,
          id: `LRN-${Date.now().toString().slice(-4)}`,
          viewsCount: 0,
          publishedDate: new Date().toISOString().split('T')[0],
        };
      }
    }

    setLearningItems((prev) => [publishedItem, ...prev.filter((i) => i.id !== publishedItem.id)]);

    // Push notification to state and mockDb for immediate reactive UI update
    const notif: AppNotification = {
      id: `NTF-PUB-${publishedItem.id}`,
      userId: currentUser?.firebaseUid || 'usr-beekeeper-01',
      title: `New Learning Guide: ${publishedItem.title}`,
      message: `${publishedItem.authorName} published new tutorial in ${publishedItem.language.toUpperCase()}.`,
      type: 'learning',
      timestamp: new Date().toISOString(),
      read: false,
      linkUrl: '#learning',
    };
    mockDb.notifications.set(notif.id, notif);
    setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);

    return publishedItem;
  };

  const markNotificationAsRead = async (id: string): Promise<void> => {
    try {
      await apiMarkNotificationAsRead(id);
    } catch (err) {
      console.warn('Could not update notification via API, trying Firestore fallback:', err);
      try {
        await firestoreIdentityService.markNotificationAsReadInFirestore(id);
      } catch (fbErr) {
        console.warn('Could not update notification in Firestore:', fbErr);
      }
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const existing = mockDb.notifications.get(id);
    if (existing) {
      existing.read = true;
      mockDb.notifications.set(id, existing);
    }
  };

  const addMarketplaceProduct = async (
    product: Omit<MarketplaceProduct, 'id' | 'verifiedBadge'>
  ): Promise<MarketplaceProduct> => {
    let newProduct: MarketplaceProduct;
    try {
      newProduct = await apiCreateMarketplaceProduct({
        batchId: product.batchId,
        title: product.title,
        floralType: product.floralType,
        priceInr: product.priceInr,
        weightGrams: product.weightGrams,
        availableStockBottles: product.availableStockBottles,
        description: product.description,
        contactNumber: product.contactNumber,
        harvestDate: product.harvestDate,
        imageUrl: product.imageUrl,
      });
    } catch (err) {
      console.warn('Could not persist marketplace product via API, trying Firestore fallback:', err);
      try {
        newProduct = await firestoreIdentityService.createMarketplaceListingInFirestore({
          batchNumber: product.batchId,
          title: product.title,
          beekeeperUid: currentUser?.firebaseUid || '',
          beekeeperId: product.beekeeperId,
          beekeeperName: product.beekeeperName,
          producerLocation: product.producerLocation,
          floralType: product.floralType,
          priceInr: product.priceInr,
          weightGrams: product.weightGrams,
          availableStockBottles: product.availableStockBottles,
          description: product.description,
          contactNumber: product.contactNumber,
          harvestDate: product.harvestDate,
          imageUrl: product.imageUrl,
          isAdmin,
        });
      } catch (fbErr) {
        console.warn('Could not persist marketplace product to Firestore, fallback local:', fbErr);
        newProduct = {
          ...product,
          id: `MP-${Date.now().toString().slice(-4)}`,
          verifiedBadge: true,
        };
      }
    }

    mockDb.marketplace.set(newProduct.id, newProduct);
    setMarketplaceProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    return newProduct;
  };

  const deleteMarketplaceProduct = async (id: string): Promise<boolean> => {
    try {
      await apiDeleteMarketplaceProduct(id);
    } catch (err) {
      console.warn('Could not delete marketplace product via API, trying Firestore fallback:', err);
      try {
        await firestoreIdentityService.deleteMarketplaceProductInFirestore(id);
      } catch (fbErr) {
        console.warn('Could not delete marketplace product from Firestore fallback:', fbErr);
      }
    }
    mockDb.marketplace.delete(id);
    setMarketplaceProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const submitOrderRequest = async (req: {
    productId: string;
    productName?: string;
    batchNumber: string;
    beekeeperUid: string;
    beekeeperId?: string;
    consumerName?: string;
    consumerContact?: string;
    consumerMessage?: string;
    requestedQuantity?: number;
  }): Promise<OrderRequest> => {
    let newReq: OrderRequest;
    try {
      newReq = await apiCreateOrderRequest({
        productId: req.productId,
        batchNumber: req.batchNumber,
        beekeeperUid: req.beekeeperUid,
        productName: req.productName,
        beekeeperId: req.beekeeperId,
        consumerName: req.consumerName,
        consumerContact: req.consumerContact,
        consumerMessage: req.consumerMessage,
        requestedQuantity: req.requestedQuantity,
      });
    } catch (err) {
      console.warn('Could not submit order request via API, trying Firestore fallback:', err);
      try {
        newReq = await firestoreIdentityService.submitOrderRequestInFirestore(req);
      } catch (fbErr) {
        console.warn('Could not submit order request to Firestore fallback, local fallback:', fbErr);
        newReq = {
          id: `ORD-${Date.now().toString().slice(-6)}`,
          orderRequestId: `ORD-${Date.now().toString().slice(-6)}`,
          productId: req.productId,
          productName: req.productName || 'Honey Batch Jar',
          batchNumber: req.batchNumber,
          beekeeperUid: req.beekeeperUid,
          beekeeperId: req.beekeeperId || 'BK-PRODUCER',
          consumerName: req.consumerName,
          consumerContact: req.consumerContact,
          consumerMessage: req.consumerMessage,
          requestedQuantity: req.requestedQuantity || 1,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    setOrderRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  const updateOrderRequestStatus = async (
    orderRequestId: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  ): Promise<boolean> => {
    try {
      await apiUpdateOrderStatus(orderRequestId, status);
    } catch (err) {
      console.warn('Could not update order status via API, trying Firestore fallback:', err);
      try {
        await firestoreIdentityService.updateOrderRequestStatusInFirestore(orderRequestId, status);
      } catch (fbErr) {
        console.warn('Could not update order status in Firestore:', fbErr);
      }
    }

    setOrderRequests((prev) =>
      prev.map((r) => (r.orderRequestId === orderRequestId || r.id === orderRequestId ? { ...r, status } : r))
    );
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        hives,
        allHives,
        selectedHiveId,
        setSelectedHiveId,
        selectedHive,
        liveReading,
        readingHistory,
        simulationScenario,
        setSimulationScenario,
        alerts,
        allAlerts,
        tickets,
        allTickets,
        acknowledgeAlert,
        createSupportTicket,
        respondToTicket,
        batches,
        allBatches,
        createHoneyBatch,
        learningItems,
        publishLearningContent,
        notifications,
        markNotificationAsRead,
        marketplaceProducts,
        addMarketplaceProduct,
        deleteMarketplaceProduct,
        orderRequests,
        submitOrderRequest,
        updateOrderRequestStatus,
        refreshIoT,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

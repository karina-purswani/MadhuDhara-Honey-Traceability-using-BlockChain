/**
 * IoT Service Abstraction
 * Manages sensor data streams, device registry, and anomaly alerts.
 */

import { HiveReading } from '../../shared/types';
import { HiveSimulator, SimulationScenario } from '../simulator/hive_simulator';

export interface IIoTService {
  getLatestReading(hiveId: string): Promise<HiveReading>;
  getReadingHistory(hiveId: string, limit?: number): Promise<HiveReading[]>;
  setSimulationScenario(hiveId: string, scenario: SimulationScenario): void;
  getSimulationScenario(hiveId: string): SimulationScenario;
}

export class MockIoTService implements IIoTService {
  private simulators: Map<string, HiveSimulator> = new Map();
  private histories: Map<string, HiveReading[]> = new Map();

  constructor() {
    // Seed simulators for key demo hives
    this.initHiveSimulator('HC-HIVE-MH-NAS-00123', 'HEAT_STRESS'); // H023 warning hive
    this.initHiveSimulator('HC-HIVE-MH-NAS-00124', 'OPTIMAL_FLOW'); // H024 healthy hive
    this.initHiveSimulator('HC-HIVE-MH-NAS-00125', 'SWARMING_WEIGHT_DROP'); // H025 critical hive
    this.initHiveSimulator('HC-HIVE-MH-PUN-00088', 'OPTIMAL_FLOW');
  }

  private initHiveSimulator(hiveId: string, scenario: SimulationScenario) {
    const sim = new HiveSimulator(hiveId, scenario);
    this.simulators.set(hiveId, sim);

    // Pre-populate 12 historical data points (last 12 hours)
    const history: HiveReading[] = [];
    const now = Date.now();
    for (let i = 12; i >= 1; i--) {
      const reading = sim.getCurrentReading();
      history.push({
        ...reading,
        id: `RD-HIST-${i}`,
        timestamp: new Date(now - i * 3600 * 1000).toISOString(),
        temperature: Math.round((reading.temperature - (i * 0.15)) * 10) / 10,
        humidity: Math.round(reading.humidity + (i % 2 === 0 ? 2 : -2)),
        weight: Math.round((reading.weight - (12 - i) * 0.08) * 10) / 10,
      });
    }
    this.histories.set(hiveId, history);
  }

  private getOrCreateSimulator(hiveId: string): HiveSimulator {
    if (!this.simulators.has(hiveId)) {
      this.initHiveSimulator(hiveId, 'OPTIMAL_FLOW');
    }
    return this.simulators.get(hiveId)!;
  }

  async getLatestReading(hiveId: string): Promise<HiveReading> {
    const sim = this.getOrCreateSimulator(hiveId);
    const reading = sim.step();

    // Append to in-memory history
    const history = this.histories.get(hiveId) || [];
    history.push(reading);
    if (history.length > 30) history.shift();
    this.histories.set(hiveId, history);

    return reading;
  }

  async getReadingHistory(hiveId: string, limit = 20): Promise<HiveReading[]> {
    this.getOrCreateSimulator(hiveId);
    const history = this.histories.get(hiveId) || [];
    return history.slice(-limit);
  }

  setSimulationScenario(hiveId: string, scenario: SimulationScenario): void {
    const sim = this.getOrCreateSimulator(hiveId);
    sim.setScenario(scenario);
  }

  getSimulationScenario(hiveId: string): SimulationScenario {
    const sim = this.getOrCreateSimulator(hiveId);
    return sim.getScenario();
  }
}

/**
 * RealIoTService Placeholder
 * Connects to future MQTT broker (e.g., EMQX / AWS IoT Core) or HTTP webhook ingestion.
 */
export class RealIoTService implements IIoTService {
  private apiEndpoint: string;

  constructor(apiEndpoint = process.env.IOT_GATEWAY_URL || '') {
    this.apiEndpoint = apiEndpoint;
  }

  async getLatestReading(_hiveId: string): Promise<HiveReading> {
    // TODO: Connect to MQTT client or GET /api/telemetry/latest?hiveId=...
    throw new Error('RealIoTService not configured. Please use MockIoTService in DEMO_MODE.');
  }

  async getReadingHistory(_hiveId: string, _limit = 20): Promise<HiveReading[]> {
    // TODO: Query time-series database (TimescaleDB / InfluxDB)
    throw new Error('RealIoTService not configured.');
  }

  setSimulationScenario(_hiveId: string, _scenario: SimulationScenario): void {
    // No-op in real hardware environment
  }

  getSimulationScenario(_hiveId: string): SimulationScenario {
    return 'OPTIMAL_FLOW';
  }
}

export const iotService: IIoTService = new MockIoTService();

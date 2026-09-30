/**
 * IoT Hive Simulator
 * Generates continuous synthetic telemetry and models real-world biological anomalies:
 * - Thermal spikes (summer heat stress, lack of water)
 * - Swarming weight drops (sudden 1.5 - 3.0 kg loss when swarm departs with old queen)
 * - Nectar surge (steady 0.4 - 0.9 kg/day weight gain during multi-floral bloom)
 * - Humidity elevation (monsoon moisture or insufficient ventilation)
 */

import { HiveReading } from '../../shared/types';

export type SimulationScenario =
  | 'OPTIMAL_FLOW'
  | 'HEAT_STRESS'
  | 'HUMIDITY_ALERT'
  | 'SWARMING_WEIGHT_DROP'
  | 'NIGHT_COOLING';

export interface HiveSimulatorState {
  hiveId: string;
  temperature: number;
  humidity: number;
  weight: number;
  activityLevel: 'low' | 'normal' | 'high' | 'agitated';
  acousticHz: number;
  scenario: SimulationScenario;
}

export class HiveSimulator {
  private state: HiveSimulatorState;

  constructor(hiveId: string, initialScenario: SimulationScenario = 'OPTIMAL_FLOW') {
    this.state = this.getInitialStateForScenario(hiveId, initialScenario);
  }

  private getInitialStateForScenario(hiveId: string, scenario: SimulationScenario): HiveSimulatorState {
    switch (scenario) {
      case 'HEAT_STRESS':
        return {
          hiveId,
          temperature: 38.6,
          humidity: 48,
          weight: 41.2,
          activityLevel: 'agitated',
          acousticHz: 520,
          scenario,
        };
      case 'HUMIDITY_ALERT':
        return {
          hiveId,
          temperature: 33.1,
          humidity: 78,
          weight: 43.5,
          activityLevel: 'normal',
          acousticHz: 440,
          scenario,
        };
      case 'SWARMING_WEIGHT_DROP':
        return {
          hiveId,
          temperature: 36.4,
          humidity: 54,
          weight: 35.8, // Dropped from 44kg
          activityLevel: 'agitated',
          acousticHz: 610,
          scenario,
        };
      case 'NIGHT_COOLING':
        return {
          hiveId,
          temperature: 32.8,
          humidity: 62,
          weight: 45.1,
          activityLevel: 'low',
          acousticHz: 390,
          scenario,
        };
      case 'OPTIMAL_FLOW':
      default:
        return {
          hiveId,
          temperature: 34.6,
          humidity: 57,
          weight: 46.8,
          activityLevel: 'normal',
          acousticHz: 450,
          scenario: 'OPTIMAL_FLOW',
        };
    }
  }

  public setScenario(scenario: SimulationScenario) {
    this.state = this.getInitialStateForScenario(this.state.hiveId, scenario);
  }

  public getScenario(): SimulationScenario {
    return this.state.scenario;
  }

  public step(): HiveReading {
    // Introduce micro-fluctuations (biological realism)
    const tempJitter = (Math.random() - 0.5) * 0.2;
    const humidityJitter = (Math.random() - 0.5) * 0.8;
    const weightJitter = (Math.random() - 0.5) * 0.05;

    this.state.temperature = Math.round((this.state.temperature + tempJitter) * 10) / 10;
    this.state.humidity = Math.max(20, Math.min(99, Math.round(this.state.humidity + humidityJitter)));
    this.state.weight = Math.round((this.state.weight + weightJitter) * 10) / 10;

    return {
      id: `RD-${Date.now().toString().slice(-6)}`,
      hiveId: this.state.hiveId,
      timestamp: new Date().toISOString(),
      temperature: this.state.temperature,
      humidity: this.state.humidity,
      weight: this.state.weight,
      activityLevel: this.state.activityLevel,
      acousticFrequencyHz: this.state.acousticHz,
      batteryVoltage: 4.12,
    };
  }

  public getCurrentReading(): HiveReading {
    return {
      id: `RD-${Date.now().toString().slice(-6)}`,
      hiveId: this.state.hiveId,
      timestamp: new Date().toISOString(),
      temperature: this.state.temperature,
      humidity: this.state.humidity,
      weight: this.state.weight,
      activityLevel: this.state.activityLevel,
      acousticFrequencyHz: this.state.acousticHz,
      batteryVoltage: 4.12,
    };
  }
}

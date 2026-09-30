/**
 * AI Service Abstraction Layer
 * Provides smart decision support for rural beekeepers:
 * 1. Multi-factor Hive Health Scoring
 * 2. AI-assisted Disease Risk Indicators (Varroa, Nosema, Foulbrood)
 * 3. Honey Yield / Productivity Forecast
 */

import { DiseaseAssessment, HealthScoreBreakdown, HiveReading, YieldPrediction } from '../../shared/types';

export interface IAIService {
  calculateHealthScore(reading: HiveReading): HealthScoreBreakdown;
  assessDiseaseRisk(
    hiveId: string,
    beekeeperId: string,
    imageSample?: string,
    notes?: string,
    currentReading?: HiveReading
  ): Promise<DiseaseAssessment>;
  predictYield(hiveId: string, currentWeight: number, historicalReadings?: HiveReading[]): Promise<YieldPrediction>;
}

export class MockAIService implements IAIService {
  /**
   * Transparent Multi-Parameter Hive Health Score Calculation
   * Temperature ideal: 34.0°C - 35.5°C
   * Humidity ideal: 50% - 65%
   * Weight: Stable / gradually increasing
   * Activity: Normal
   */
  calculateHealthScore(reading: HiveReading): HealthScoreBreakdown {
    // Temperature Score (ideal ~34.8°C)
    const tempDiff = Math.abs(reading.temperature - 34.8);
    let tempScore = Math.max(0, Math.min(100, Math.round(100 - tempDiff * 18)));

    // Humidity Score (ideal ~58%)
    const humidityDiff = Math.abs(reading.humidity - 58);
    let humidityScore = Math.max(0, Math.min(100, Math.round(100 - humidityDiff * 2.4)));

    // Weight Score
    let weightScore = 85;
    if (reading.weight < 35) weightScore = 55;
    else if (reading.weight > 44) weightScore = 95;

    // Activity Score
    let activityScore = 90;
    if (reading.activityLevel === 'low') activityScore = 65;
    if (reading.activityLevel === 'agitated') activityScore = 50;

    // Weighted Overall
    const overall = Math.round(
      tempScore * 0.35 +
      humidityScore * 0.25 +
      weightScore * 0.25 +
      activityScore * 0.15
    );

    const factors: string[] = [];
    if (tempDiff > 2.5) {
      factors.push(`Brood temperature ${reading.temperature}°C deviates from optimum (34-35.5°C)`);
    } else {
      factors.push(`Optimum brood thermal stability maintained (${reading.temperature}°C)`);
    }

    if (humidityDiff > 12) {
      factors.push(`Relative humidity at ${reading.humidity}% warrants ventilation check`);
    } else {
      factors.push(`Humidity within healthy evaporation boundary (${reading.humidity}%)`);
    }

    if (reading.weight > 42) {
      factors.push(`Strong nectar surplus weight (${reading.weight} kg)`);
    } else if (reading.weight < 36) {
      factors.push(`Light colony weight; check stores for winter/monsoon`);
    }

    const status: 'healthy' | 'warning' | 'critical' = 
      overall >= 80 ? 'healthy' : overall >= 60 ? 'warning' : 'critical';

    const trend: 'improving' | 'stable' | 'declining' =
      overall >= 78 ? 'stable' : overall >= 65 ? 'improving' : 'declining';

    return {
      overallScore: overall,
      temperatureScore: tempScore,
      humidityScore: humidityScore,
      weightTrendScore: weightScore,
      activityScore,
      status,
      trend,
      factors,
    };
  }

  async assessDiseaseRisk(
    hiveId: string,
    beekeeperId: string,
    imageSample?: string,
    notes?: string,
    currentReading?: HiveReading
  ): Promise<DiseaseAssessment> {
    // Provide realistic deterministic risk profiles based on hive status or query
    const isWarningHive = hiveId.includes('H023') || (currentReading && currentReading.temperature > 37.5);
    const isCriticalHive = hiveId.includes('H025') || (notes && notes.toLowerCase().includes('mite'));

    if (isCriticalHive) {
      return {
        id: `DA-${Date.now().toString().slice(-5)}`,
        hiveId,
        beekeeperId,
        timestamp: new Date().toISOString(),
        riskLevel: 'HIGH',
        suspectedCondition: 'Varroa Mite Infestation Indicators & Brood Stress',
        confidencePercentage: 88,
        supportingFactors: [
          'Acoustic frequencies elevated above 580 Hz, indicating worker agitation',
          'Weight stagnation observed across recent 5 days',
          'Visual comb analysis indicates partial drone cell perforation',
          'Thermal micro-fluctuations outside normal 34.5°C brood baseline'
        ],
        recommendedSteps: [
          'Perform immediate powdered sugar roll test or sticky bottom board inspection',
          'Inspect newly emerging worker bees for deformed wing virus (DWV) symptoms',
          'Isolate hive tools before inspecting neighboring colonies',
          'Contact KVIC cluster extension officer for approved organic thymol treatment'
        ],
        imageUrl: imageSample,
        beekeeperNotes: notes || 'Observed erratic bee movements at hive entrance.',
      };
    }

    if (isWarningHive) {
      return {
        id: `DA-${Date.now().toString().slice(-5)}`,
        hiveId,
        beekeeperId,
        timestamp: new Date().toISOString(),
        riskLevel: 'MODERATE',
        suspectedCondition: 'Mild Heat Stress & Humidity Elevation',
        confidencePercentage: 79,
        supportingFactors: [
          'High ambient temperature causing internal brood cluster heat build-up',
          'Elevated fanning activity noted at landing board',
          'Slight humidity condensation indicator near entrance'
        ],
        recommendedSteps: [
          'Provide shaded apiary mesh or whitewash hive top lid',
          'Ensure continuous clean water supply within 15 meters of apiary',
          'Increase upper entrance ventilation gap'
        ],
        imageUrl: imageSample,
        beekeeperNotes: notes || 'Brood box hot to touch during midday.',
      };
    }

    // Default Healthy Assessment
    return {
      id: `DA-${Date.now().toString().slice(-5)}`,
      hiveId,
      beekeeperId,
      timestamp: new Date().toISOString(),
      riskLevel: 'LOW',
      suspectedCondition: 'Colony Condition Normal / Minimal Risk Detected',
      confidencePercentage: 94,
      supportingFactors: [
        'Stable core brood temperature (34.8°C)',
        'Comb pattern uniform with healthy capped honey arc',
        'Normal foraging traffic and pollen basket intake'
      ],
      recommendedSteps: [
        'Continue routine fortnightly inspection protocol',
        'Ensure empty supers available as floral bloom peaks'
      ],
      imageUrl: imageSample,
      beekeeperNotes: notes,
    };
  }

  async predictYield(hiveId: string, currentWeight: number): Promise<YieldPrediction> {
    const netHoneyWeight = Math.max(2.0, (currentWeight - 33.5) * 0.72);
    const estimated = Math.round(netHoneyWeight * 10) / 10;

    return {
      hiveId,
      timestamp: new Date().toISOString(),
      estimatedYieldKg: estimated,
      confidenceRange: {
        min: Math.max(1.5, Math.round((estimated - 1.2) * 10) / 10),
        max: Math.round((estimated + 1.6) * 10) / 10,
      },
      trend: estimated > 7.0 ? 'Increasing' : estimated > 4.0 ? 'Stable' : 'Declining',
      daysToOptimalHarvest: estimated > 8.0 ? 5 : 14,
      factors: {
        weightAccumulationRate: estimated > 6.0 ? '+0.42 kg/day' : '+0.15 kg/day',
        floweringSeasonScore: 'High (Mustard / Jamun bloom window)',
        colonyStrength: estimated > 7.0 ? 'Strong (Est. 52,000 active bees)' : 'Moderate (Est. 36,000 bees)',
      },
    };
  }
}

/**
 * RealAIService Placeholder
 * Connects to future Python FastAPI / PyTorch / Gemini Vision endpoint.
 */
export class RealAIService implements IAIService {
  private endpointUrl: string;

  constructor(endpointUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000') {
    this.endpointUrl = endpointUrl;
  }

  calculateHealthScore(_reading: HiveReading): HealthScoreBreakdown {
    // Falls back to deterministic rule-based calculation
    return new MockAIService().calculateHealthScore(_reading);
  }

  async assessDiseaseRisk(
    hiveId: string,
    beekeeperId: string,
    imageSample?: string,
    notes?: string,
    currentReading?: HiveReading
  ): Promise<DiseaseAssessment> {
    // TODO: POST to this.endpointUrl + '/predict/disease-risk'
    // Fall back to Mock for prototype resilience
    return new MockAIService().assessDiseaseRisk(hiveId, beekeeperId, imageSample, notes, currentReading);
  }

  async predictYield(hiveId: string, currentWeight: number, historicalReadings?: HiveReading[]): Promise<YieldPrediction> {
    // TODO: POST to this.endpointUrl + '/predict/yield'
    return new MockAIService().predictYield(hiveId, currentWeight);
  }
}

export const aiService: IAIService = new MockAIService();

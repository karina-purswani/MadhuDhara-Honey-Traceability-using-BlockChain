/**
 * Hives Service
 * Business logic for hive passport retrieval and on-demand sensor readings.
 */

import { hivesRepository } from '../repositories/hives.repository';
import { HiveDetailResponse } from '../types/admin.types';
import { HiveReading } from '../../../shared/types';

export class HivesService {
  /**
   * Retrieves complete digital passport details for a selected hive.
   */
  public async getHiveDetail(hiveId: string): Promise<HiveDetailResponse | null> {
    return await hivesRepository.getHiveDetail(hiveId);
  }

  /**
   * Retrieves latest simulated IoT telemetry reading for a selected hive.
   */
  public async getLatestIoTReading(hiveId: string): Promise<HiveReading> {
    return await hivesRepository.getLatestIoTReading(hiveId);
  }
}

export const hivesService = new HivesService();

/**
 * Apiaries Service
 * Business logic for apiary management and associated hive queries.
 */

import { apiariesRepository } from '../repositories/apiaries.repository';
import { Hive } from '../../../shared/types';

export class ApiariesService {
  /**
   * Retrieves hives belonging to a specific apiary on-demand.
   */
  public async getHivesByApiary(apiaryId: string): Promise<Hive[]> {
    return await apiariesRepository.getHivesByApiary(apiaryId);
  }
}

export const apiariesService = new ApiariesService();

/**
 * Beekeepers Service
 * Business logic for beekeeper directory, profiles, and associated apiaries.
 */

import { beekeepersRepository } from '../repositories/beekeepers.repository';
import { apiariesRepository } from '../repositories/apiaries.repository';
import { LightweightBeekeeperSummary } from '../types/admin.types';
import { Apiary } from '../../../shared/types';

export class BeekeepersService {
  /**
   * Retrieves lightweight beekeeper directory records with optional filtering.
   */
  public async getDirectory(districtFilter?: string): Promise<LightweightBeekeeperSummary[]> {
    return await beekeepersRepository.getLightweightBeekeepers(districtFilter);
  }

  /**
   * Retrieves apiaries belonging to a specific beekeeper on demand.
   */
  public async getApiariesByBeekeeper(beekeeperId: string): Promise<Apiary[]> {
    return await apiariesRepository.getApiariesByBeekeeper(beekeeperId);
  }
}

export const beekeepersService = new BeekeepersService();

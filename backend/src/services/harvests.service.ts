/**
 * Harvests Service
 * Business logic and ownership authorization for honey harvests.
 */

import { harvestsRepository } from '../repositories/harvests.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { HarvestRecord } from '../../../shared/types';

export class HarvestsService {
  public async getHarvests(user: AuthenticatedUser): Promise<HarvestRecord[]> {
    if (user.role === 'KVIC_ADMIN') {
      return await harvestsRepository.getAllHarvests();
    }
    return await harvestsRepository.getHarvestsByBeekeeper(user.uid);
  }

  public async getHarvestById(
    harvestId: string,
    user: AuthenticatedUser
  ): Promise<{ harvest: HarvestRecord | null; unauthorized?: boolean }> {
    const harvest = await harvestsRepository.getHarvestById(harvestId);
    if (!harvest) {
      return { harvest: null };
    }

    if (user.role === 'KVIC_ADMIN') {
      return { harvest };
    }

    // Beekeeper ownership validation
    const ownsHarvest =
      harvest.beekeeperId === user.uid ||
      harvest.beekeeperId === user.beekeeperId ||
      (user.beekeeperId && harvest.beekeeperId.includes(user.beekeeperId));

    if (!ownsHarvest) {
      return { harvest: null, unauthorized: true };
    }

    return { harvest };
  }

  public async createHarvest(
    data: {
      harvestId?: string;
      hiveId: string;
      apiaryId: string;
      harvestDate?: string;
      quantityKg: number;
      floralSource: string;
      moisturePercentage?: number;
      colorGrade?: string;
      notes?: string;
      batchId?: string;
    },
    user: AuthenticatedUser
  ): Promise<HarvestRecord> {
    return await harvestsRepository.createHarvest({
      ...data,
      beekeeperUid: user.uid,
      beekeeperId: user.beekeeperId || user.uid,
      harvestDate: data.harvestDate || new Date().toISOString().split('T')[0],
      quantityKg: Number(data.quantityKg || 0),
      floralSource: data.floralSource,
    });
  }
}

export const harvestsService = new HarvestsService();

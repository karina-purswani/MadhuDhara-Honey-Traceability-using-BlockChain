/**
 * Alerts Service
 * Business logic and ownership verification for hive alerts.
 */

import { alertsRepository } from '../repositories/alerts.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { HiveAlert } from '../../../shared/types';

export class AlertsService {
  public async getAlerts(user: AuthenticatedUser): Promise<HiveAlert[]> {
    if (user.role === 'KVIC_ADMIN') {
      return await alertsRepository.getAllAlerts();
    }
    return await alertsRepository.getAlertsByBeekeeper(user.uid);
  }

  public async getAlertById(
    alertId: string,
    user: AuthenticatedUser
  ): Promise<{ alert: HiveAlert | null; unauthorized?: boolean }> {
    const alert = await alertsRepository.getAlertById(alertId);
    if (!alert) {
      return { alert: null };
    }

    if (user.role === 'KVIC_ADMIN') {
      return { alert };
    }

    const ownsAlert =
      alert.beekeeperId === user.uid ||
      alert.beekeeperId === user.beekeeperId ||
      (user.beekeeperId && alert.beekeeperId.includes(user.beekeeperId));

    if (!ownsAlert) {
      return { alert: null, unauthorized: true };
    }

    return { alert };
  }

  public async createAlert(
    data: {
      alertId?: string;
      hiveId: string;
      alertType: string;
      severity: string;
      title: string;
      description: string;
      observedValues?: string;
      idealRange?: string;
      recommendedAction?: string;
      healthScore?: number;
    },
    user: AuthenticatedUser
  ): Promise<HiveAlert> {
    return await alertsRepository.createAlert({
      ...data,
      beekeeperUid: user.uid,
      beekeeperId: user.beekeeperId || user.uid,
    });
  }

  public async acknowledgeAlert(
    alertId: string,
    user: AuthenticatedUser
  ): Promise<{ success: boolean; unauthorized?: boolean; notFound?: boolean }> {
    const check = await this.getAlertById(alertId, user);
    if (check.unauthorized) {
      return { success: false, unauthorized: true };
    }
    if (!check.alert) {
      return { success: false, notFound: true };
    }

    const ok = await alertsRepository.acknowledgeAlert(alertId);
    return { success: ok };
  }
}

export const alertsService = new AlertsService();

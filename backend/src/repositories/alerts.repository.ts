/**
 * Alerts Repository
 * Manages hive condition alerts in `alerts/{alertId}` using Firebase Admin SDK.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { HiveAlert } from '../../../shared/types';

export class AlertsRepository {
  private collectionName = 'alerts';

  public async getAlertsByBeekeeper(beekeeperUid: string): Promise<HiveAlert[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAlertsByBeekeeper(beekeeperUid);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('beekeeperUid', '==', beekeeperUid)
        .get();

      if (!snapshot.empty) {
        const alerts = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      return await this.getFallbackAlertsByBeekeeper(beekeeperUid);
    } catch (err: any) {
      console.warn(`[AlertsRepository] getAlertsByBeekeeper error for ${beekeeperUid}:`, err?.message || err);
      return await this.getFallbackAlertsByBeekeeper(beekeeperUid);
    }
  }

  public async getAllAlerts(): Promise<HiveAlert[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllAlerts();
    }

    try {
      const snapshot = await adminFirestore.collection(this.collectionName).get();
      if (!snapshot.empty) {
        const alerts = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      return await this.getFallbackAllAlerts();
    } catch (err: any) {
      console.warn('[AlertsRepository] getAllAlerts error:', err?.message || err);
      return await this.getFallbackAllAlerts();
    }
  }

  public async getAlertById(alertId: string): Promise<HiveAlert | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAlertById(alertId);
    }

    try {
      const docRef = await adminFirestore.collection(this.collectionName).doc(alertId).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      const qSnap = await adminFirestore
        .collection(this.collectionName)
        .where('alertId', '==', alertId)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        return this.mapDoc(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      return await this.getFallbackAlertById(alertId);
    } catch (err: any) {
      console.warn(`[AlertsRepository] getAlertById error for ${alertId}:`, err?.message || err);
      return await this.getFallbackAlertById(alertId);
    }
  }

  public async createAlert(alert: {
    alertId?: string;
    beekeeperUid: string;
    beekeeperId: string;
    hiveId: string;
    alertType: string;
    severity: string;
    title: string;
    description: string;
    observedValues?: string;
    idealRange?: string;
    recommendedAction?: string;
    healthScore?: number;
    timestamp?: string;
    isAcknowledged?: boolean;
    linkedTicketId?: string;
  }): Promise<HiveAlert> {
    const docId = alert.alertId || `ALT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const hiveAlert: HiveAlert = {
      id: docId,
      hiveId: alert.hiveId,
      beekeeperId: alert.beekeeperId,
      timestamp: alert.timestamp || now,
      severity: (alert.severity || 'info') as any,
      parameter: (alert.alertType || 'general') as any,
      title: alert.title,
      message: alert.description,
      observedValue: alert.observedValues || '',
      idealRange: alert.idealRange || '',
      recommendedAction: alert.recommendedAction || '',
      isAcknowledged: Boolean(alert.isAcknowledged),
      linkedTicketId: alert.linkedTicketId,
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(docId).set({
          id: docId,
          alertId: docId,
          beekeeperUid: alert.beekeeperUid,
          beekeeperId: alert.beekeeperId,
          hiveId: alert.hiveId,
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          observedValues: alert.observedValues || '',
          idealRange: alert.idealRange || '',
          recommendedAction: alert.recommendedAction || '',
          healthScore: Number(alert.healthScore || 0),
          timestamp: hiveAlert.timestamp,
          status: hiveAlert.isAcknowledged ? 'acknowledged' : 'active',
          isAcknowledged: hiveAlert.isAcknowledged,
          linkedTicketId: alert.linkedTicketId || null,
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[AlertsRepository] createAlert write error for ${docId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.alerts.set(docId, hiveAlert);
    } catch {
      // ignore
    }

    return hiveAlert;
  }

  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (hasAdminCredentials) {
      try {
        const docRef = adminFirestore.collection(this.collectionName).doc(alertId);
        await docRef.set({
          isAcknowledged: true,
          status: 'acknowledged',
          acknowledgedAt: now,
          updatedAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[AlertsRepository] acknowledgeAlert write error for ${alertId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      const existing = mockDb.alerts.get(alertId);
      if (existing) {
        existing.isAcknowledged = true;
        mockDb.alerts.set(alertId, existing);
      }
    } catch {
      // ignore
    }

    return true;
  }

  private mapDoc(id: string, data: any): HiveAlert {
    return {
      id: data.alertId || id,
      hiveId: data.hiveId || '',
      beekeeperId: data.beekeeperId || '',
      timestamp: data.timestamp || new Date().toISOString(),
      severity: data.severity || 'info',
      parameter: data.alertType || 'general',
      title: data.title || '',
      message: data.description || '',
      observedValue: data.observedValues || '',
      idealRange: data.idealRange || '',
      recommendedAction: data.recommendedAction || '',
      isAcknowledged: Boolean(data.isAcknowledged),
      linkedTicketId: data.linkedTicketId || undefined,
    };
  }

  private async getFallbackAlertsByBeekeeper(beekeeperUid: string): Promise<HiveAlert[]> {
    try {
      const { firestoreAlertRepository } = await import('../../../src/services/firestore/alert.repository');
      const docs = await firestoreAlertRepository.getAlertsByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) {
        return docs.map((d) => ({
          id: d.alertId,
          hiveId: d.hiveId,
          beekeeperId: d.beekeeperId,
          timestamp: d.timestamp,
          severity: d.severity,
          parameter: d.alertType as any,
          title: d.title,
          message: d.description,
          observedValue: d.observedValues,
          idealRange: d.idealRange,
          recommendedAction: d.recommendedAction,
          isAcknowledged: d.isAcknowledged,
          linkedTicketId: d.linkedTicketId,
        }));
      }
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.alerts.values()).filter(
      (a) => a.beekeeperId === beekeeperUid || a.beekeeperId.includes(beekeeperUid)
    );
  }

  private async getFallbackAllAlerts(): Promise<HiveAlert[]> {
    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.alerts.values());
  }

  private async getFallbackAlertById(alertId: string): Promise<HiveAlert | null> {
    const { mockDb } = await import('./mock.db');
    return mockDb.alerts.get(alertId) || null;
  }
}

export const alertsRepository = new AlertsRepository();

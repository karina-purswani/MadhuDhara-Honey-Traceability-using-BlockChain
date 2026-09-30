/**
 * Honey Chain - Firestore Alert Repository
 * Manages hive condition alerts in `alerts/{alertId}`
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreAlertDoc } from './types';

export class FirestoreAlertRepository {
  private collectionName = 'alerts';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getAlertsByBeekeeper(beekeeperUid: string): Promise<FirestoreAlertDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      // Sort newest first
      return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.warn('FirestoreAlertRepository.getAlertsByBeekeeper error:', error);
      return [];
    }
  }

  public async getAllAlerts(): Promise<FirestoreAlertDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      const alerts = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.warn('FirestoreAlertRepository.getAllAlerts error:', error);
      return [];
    }
  }

  public async getAlertById(alertId: string): Promise<FirestoreAlertDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, alertId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return this.mapDoc(snapshot.id, snapshot.data());
    } catch (error) {
      console.warn(`FirestoreAlertRepository.getAlertById error for ${alertId}:`, error);
      return null;
    }
  }

  public async getActiveAlert(hiveId: string, alertType: string): Promise<FirestoreAlertDoc | null> {
    if (!db) return null;
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hiveId', '==', hiveId),
        where('alertType', '==', alertType),
        where('isAcknowledged', '==', false)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return this.mapDoc(snapshot.docs[0].id, snapshot.docs[0].data());
    } catch (error) {
      console.warn('FirestoreAlertRepository.getActiveAlert error:', error);
      return null;
    }
  }

  public async createAlert(
    alert: Omit<FirestoreAlertDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreAlertDoc> {
    const now = new Date().toISOString();
    const docId = alert.alertId || alert.id;

    if (!db) {
      return {
        ...alert,
        id: docId,
        alertId: docId,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, docId);
    const docPayload = {
      id: docId,
      alertId: docId,
      beekeeperUid: alert.beekeeperUid,
      beekeeperId: alert.beekeeperId,
      hiveId: alert.hiveId,
      alertType: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      observedValues: alert.observedValues,
      idealRange: alert.idealRange,
      recommendedAction: alert.recommendedAction,
      healthScore: Number(alert.healthScore || 0),
      timestamp: alert.timestamp || now,
      status: alert.status || 'active',
      isAcknowledged: Boolean(alert.isAcknowledged),
      acknowledgedAt: alert.acknowledgedAt || null,
      linkedTicketId: alert.linkedTicketId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreAlertRepository.createAlert warning for ${docId}:`, writeErr);
    }

    return {
      ...alert,
      id: docId,
      alertId: docId,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, alertId);
      await updateDoc(ref, {
        isAcknowledged: true,
        status: 'acknowledged',
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreAlertRepository.acknowledgeAlert error for ${alertId}:`, error);
      return false;
    }
  }

  public async linkTicketToAlert(alertId: string, ticketId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, alertId);
      await updateDoc(ref, {
        linkedTicketId: ticketId,
        isAcknowledged: true,
        status: 'ticket_created',
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreAlertRepository.linkTicketToAlert error for ${alertId}:`, error);
      return false;
    }
  }

  private mapDoc(id: string, data: any): FirestoreAlertDoc {
    return {
      id,
      alertId: data.alertId || id,
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      hiveId: data.hiveId || '',
      alertType: data.alertType || 'general',
      severity: data.severity || 'info',
      title: data.title || '',
      description: data.description || '',
      observedValues: data.observedValues || '',
      idealRange: data.idealRange || '',
      recommendedAction: data.recommendedAction || '',
      healthScore: Number(data.healthScore || 0),
      timestamp: this.normalizeTimestamp(data.timestamp),
      status: data.status || 'active',
      isAcknowledged: Boolean(data.isAcknowledged),
      acknowledgedAt: data.acknowledgedAt ? this.normalizeTimestamp(data.acknowledgedAt) : undefined,
      linkedTicketId: data.linkedTicketId || undefined,
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreAlertRepository = new FirestoreAlertRepository();

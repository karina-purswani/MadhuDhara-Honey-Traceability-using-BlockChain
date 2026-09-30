/**
 * Honey Chain - Firestore Notification Repository
 * Manages notification delivery in `notifications/{notificationId}`
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
import { FirestoreNotificationDoc } from './types';

export class FirestoreNotificationRepository {
  private collectionName = 'notifications';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getNotificationsByUser(recipientUid: string): Promise<FirestoreNotificationDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('recipientUid', '==', recipientUid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn(`FirestoreNotificationRepository.getNotificationsByUser error for ${recipientUid}:`, error);
      return [];
    }
  }

  public async getAllNotifications(): Promise<FirestoreNotificationDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreNotificationRepository.getAllNotifications error:', error);
      return [];
    }
  }

  public async createNotification(
    notif: Omit<FirestoreNotificationDoc, 'createdAt'>
  ): Promise<FirestoreNotificationDoc> {
    const now = new Date().toISOString();
    const docId = notif.notificationId || notif.id;

    if (!db) {
      return {
        ...notif,
        id: docId,
        notificationId: docId,
        createdAt: now,
      };
    }

    const ref = doc(db, this.collectionName, docId);
    const docPayload = {
      id: docId,
      notificationId: docId,
      recipientUid: notif.recipientUid,
      userId: notif.recipientUid,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      relatedContentId: notif.relatedContentId || null,
      linkUrl: notif.linkUrl || '#learning',
      read: Boolean(notif.read),
      readAt: notif.readAt || null,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreNotificationRepository.createNotification warning for ${docId}:`, writeErr);
    }

    return {
      ...notif,
      id: docId,
      notificationId: docId,
      userId: notif.recipientUid,
      createdAt: now,
    };
  }

  /**
   * Broadcasts learning notification to target beekeeper UIDs.
   * Uses deterministic IDs (NTF-LRN-{contentId}-{uid}) to ensure idempotency and deduplication.
   */
  public async createLearningNotificationsForBeekeepers(params: {
    contentId: string;
    title: string;
    category: string;
    authorName: string;
    durationMinutes: number;
    recipientUids: string[];
  }): Promise<FirestoreNotificationDoc[]> {
    const created: FirestoreNotificationDoc[] = [];
    const formattedCategory = params.category.replace(/_/g, ' ');

    for (const uid of params.recipientUids) {
      const docId = `NTF-LRN-${params.contentId}-${uid}`;
      const notif = await this.createNotification({
        id: docId,
        notificationId: docId,
        recipientUid: uid,
        userId: uid,
        type: 'learning',
        title: `🔔 New Learning Guide: ${params.title}`,
        message: `${params.authorName} released a new ${params.durationMinutes}-min tutorial on ${formattedCategory}.`,
        relatedContentId: params.contentId,
        linkUrl: '#learning',
        read: false,
      });
      created.push(notif);
    }

    return created;
  }

  public async markAsRead(notificationId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, notificationId);
      await updateDoc(ref, {
        read: true,
        readAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreNotificationRepository.markAsRead error for ${notificationId}:`, error);
      return false;
    }
  }

  private mapDoc(id: string, data: any): FirestoreNotificationDoc {
    return {
      id,
      notificationId: data.notificationId || id,
      recipientUid: data.recipientUid || data.userId || '',
      userId: data.userId || data.recipientUid || '',
      type: data.type || 'system',
      title: data.title || '',
      message: data.message || '',
      relatedContentId: data.relatedContentId || undefined,
      linkUrl: data.linkUrl || '#learning',
      read: Boolean(data.read),
      createdAt: this.normalizeTimestamp(data.createdAt),
      readAt: data.readAt ? this.normalizeTimestamp(data.readAt) : undefined,
    };
  }
}

export const firestoreNotificationRepository = new FirestoreNotificationRepository();

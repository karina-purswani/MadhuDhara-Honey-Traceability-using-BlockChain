/**
 * Honey Chain - Firestore Order Request Repository
 * Manages direct consumer-to-beekeeper purchase and enquiry requests in `order_requests/{orderRequestId}`
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreOrderRequestDoc } from './types';

export class FirestoreOrderRequestRepository {
  private collectionName = 'order_requests';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  /**
   * Creates a consumer enquiry/order request for a beekeeper's marketplace product.
   */
  public async createOrderRequest(
    request: Omit<FirestoreOrderRequestDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreOrderRequestDoc> {
    const now = new Date().toISOString();
    const docId = request.orderRequestId || request.id || `ORD-REQ-${Date.now().toString().slice(-6)}`;

    if (!db) {
      return {
        ...request,
        id: docId,
        orderRequestId: docId,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, docId);
    const docPayload = {
      id: docId,
      orderRequestId: docId,
      productId: request.productId,
      batchNumber: request.batchNumber || request.batchId,
      batchId: request.batchId || request.batchNumber,
      beekeeperUid: request.beekeeperUid,
      beekeeperId: request.beekeeperId,
      productName: request.productName || 'Honey Batch Jar',
      consumerName: request.consumerName || 'Consumer (Walk-in)',
      consumerContact: request.consumerContact || '',
      consumerMessage: request.consumerMessage || '',
      requestedQuantity: Number(request.requestedQuantity || 1),
      status: request.status || 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreOrderRequestRepository.createOrderRequest warning for ${docId}:`, writeErr);
    }

    return {
      ...request,
      id: docId,
      orderRequestId: docId,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Fetches order requests addressed to a specific beekeeper UID.
   */
  public async getOrderRequestsByBeekeeper(beekeeperUid: string): Promise<FirestoreOrderRequestDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn(`FirestoreOrderRequestRepository.getOrderRequestsByBeekeeper error for ${beekeeperUid}:`, error);
      return [];
    }
  }

  /**
   * Fetches all order requests across all beekeepers (for KVIC Admin).
   */
  public async getAllOrderRequests(): Promise<FirestoreOrderRequestDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreOrderRequestRepository.getAllOrderRequests error:', error);
      return [];
    }
  }

  /**
   * Fetches a single order request by ID.
   */
  public async getOrderRequestById(orderRequestId: string): Promise<FirestoreOrderRequestDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, orderRequestId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return this.mapDoc(snapshot.id, snapshot.data());
    } catch (error) {
      console.warn(`FirestoreOrderRequestRepository.getOrderRequestById error for ${orderRequestId}:`, error);
      return null;
    }
  }

  /**
   * Updates the workflow status of an order request (PENDING -> ACCEPTED / REJECTED / COMPLETED).
   */
  public async updateOrderStatus(
    orderRequestId: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  ): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, orderRequestId);
      await updateDoc(ref, {
        status,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreOrderRequestRepository.updateOrderStatus error for ${orderRequestId}:`, error);
      return false;
    }
  }

  /**
   * Deletes an order request.
   */
  public async deleteOrderRequest(orderRequestId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, orderRequestId);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.warn(`FirestoreOrderRequestRepository.deleteOrderRequest error for ${orderRequestId}:`, error);
      return false;
    }
  }

  private mapDoc(id: string, data: any): FirestoreOrderRequestDoc {
    return {
      id,
      orderRequestId: data.orderRequestId || id,
      productId: data.productId || '',
      batchNumber: data.batchNumber || data.batchId || '',
      batchId: data.batchId || data.batchNumber || '',
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      productName: data.productName || 'Honey Batch Jar',
      consumerName: data.consumerName || 'Consumer (Walk-in)',
      consumerContact: data.consumerContact || undefined,
      consumerMessage: data.consumerMessage || undefined,
      requestedQuantity: Number(data.requestedQuantity || 1),
      status: data.status || 'PENDING',
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreOrderRequestRepository = new FirestoreOrderRequestRepository();

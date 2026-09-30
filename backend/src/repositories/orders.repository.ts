/**
 * Orders Repository
 * Manages direct consumer purchase enquiries in `order_requests/{orderRequestId}` using Firebase Admin SDK.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { OrderRequest } from '../../../shared/types';

export class OrdersRepository {
  private collectionName = 'order_requests';

  public async getOrderRequestsByBeekeeper(beekeeperUid: string): Promise<OrderRequest[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackOrdersByBeekeeper(beekeeperUid);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('beekeeperUid', '==', beekeeperUid)
        .get();

      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return await this.getFallbackOrdersByBeekeeper(beekeeperUid);
    } catch (err: any) {
      console.warn(`[OrdersRepository] getOrderRequestsByBeekeeper error for ${beekeeperUid}:`, err?.message || err);
      return await this.getFallbackOrdersByBeekeeper(beekeeperUid);
    }
  }

  public async getAllOrderRequests(): Promise<OrderRequest[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllOrders();
    }

    try {
      const snapshot = await adminFirestore.collection(this.collectionName).get();
      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return await this.getFallbackAllOrders();
    } catch (err: any) {
      console.warn('[OrdersRepository] getAllOrderRequests error:', err?.message || err);
      return await this.getFallbackAllOrders();
    }
  }

  public async getOrderRequestById(orderRequestId: string): Promise<OrderRequest | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackOrderById(orderRequestId);
    }

    try {
      const docRef = await adminFirestore.collection(this.collectionName).doc(orderRequestId).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      const qSnap = await adminFirestore
        .collection(this.collectionName)
        .where('orderRequestId', '==', orderRequestId)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        return this.mapDoc(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      return await this.getFallbackOrderById(orderRequestId);
    } catch (err: any) {
      console.warn(`[OrdersRepository] getOrderRequestById error for ${orderRequestId}:`, err?.message || err);
      return await this.getFallbackOrderById(orderRequestId);
    }
  }

  public async createOrderRequest(request: {
    orderRequestId?: string;
    productId: string;
    productName?: string;
    batchNumber: string;
    beekeeperUid: string;
    beekeeperId: string;
    beekeeperName?: string;
    consumerName?: string;
    consumerContact?: string;
    consumerMessage?: string;
    requestedQuantity?: number;
  }): Promise<OrderRequest> {
    const docId = request.orderRequestId || `ORD-REQ-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newOrder: OrderRequest = {
      id: docId,
      orderRequestId: docId,
      productId: request.productId,
      productName: request.productName || 'Honey Batch Jar',
      batchNumber: request.batchNumber,
      beekeeperUid: request.beekeeperUid,
      beekeeperId: request.beekeeperId,
      beekeeperName: request.beekeeperName,
      consumerName: request.consumerName || 'Consumer (Walk-in)',
      consumerContact: request.consumerContact,
      consumerMessage: request.consumerMessage,
      requestedQuantity: Number(request.requestedQuantity || 1),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(docId).set(newOrder, { merge: true });
      } catch (err: any) {
        console.warn(`[OrdersRepository] createOrderRequest write error for ${docId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      // mockDb has no dedicated orderRequests map yet, but can be added if needed
    } catch {
      // ignore
    }

    return newOrder;
  }

  public async updateOrderStatus(
    orderRequestId: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(orderRequestId).set({
          status,
          updatedAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[OrdersRepository] updateOrderStatus write error for ${orderRequestId}:`, err?.message || err);
      }
    }

    return true;
  }

  private mapDoc(id: string, data: any): OrderRequest {
    return {
      id: data.orderRequestId || id,
      orderRequestId: data.orderRequestId || id,
      productId: data.productId || '',
      productName: data.productName || 'Honey Batch Jar',
      batchNumber: data.batchNumber || data.batchId || '',
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || '',
      requestedQuantity: Number(data.requestedQuantity || 1),
      consumerName: data.consumerName,
      consumerContact: data.consumerContact,
      consumerMessage: data.consumerMessage,
      status: data.status || 'PENDING',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  private async getFallbackOrdersByBeekeeper(beekeeperUid: string): Promise<OrderRequest[]> {
    try {
      const { firestoreOrderRequestRepository } = await import(
        '../../../src/services/firestore/order-request.repository'
      );
      const docs = await firestoreOrderRequestRepository.getOrderRequestsByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) return docs.map((d) => this.mapDoc(d.orderRequestId, d));
    } catch {
      // ignore
    }
    return [];
  }

  private async getFallbackAllOrders(): Promise<OrderRequest[]> {
    try {
      const { firestoreOrderRequestRepository } = await import(
        '../../../src/services/firestore/order-request.repository'
      );
      const docs = await firestoreOrderRequestRepository.getAllOrderRequests();
      if (docs && docs.length > 0) return docs.map((d) => this.mapDoc(d.orderRequestId, d));
    } catch {
      // ignore
    }
    return [];
  }

  private async getFallbackOrderById(orderRequestId: string): Promise<OrderRequest | null> {
    try {
      const { firestoreOrderRequestRepository } = await import(
        '../../../src/services/firestore/order-request.repository'
      );
      const doc = await firestoreOrderRequestRepository.getOrderRequestById(orderRequestId);
      if (doc) return this.mapDoc(doc.orderRequestId, doc);
    } catch {
      // ignore
    }
    return null;
  }
}

export const ordersRepository = new OrdersRepository();

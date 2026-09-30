/**
 * Orders Service
 * Handles purchase enquiries, order submissions, and seller order triage.
 */

import { ordersRepository } from '../repositories/orders.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { OrderRequest } from '../../../shared/types';

export class OrdersService {
  public async createOrderRequest(data: {
    productId: string;
    productName?: string;
    batchNumber: string;
    beekeeperUid: string;
    beekeeperId?: string;
    beekeeperName?: string;
    consumerName?: string;
    consumerContact?: string;
    consumerMessage?: string;
    requestedQuantity?: number;
  }): Promise<OrderRequest> {
    return await ordersRepository.createOrderRequest({
      ...data,
      beekeeperId: data.beekeeperId || 'BK-PRODUCER',
    });
  }

  public async getOrderRequests(user: AuthenticatedUser): Promise<OrderRequest[]> {
    if (user.role === 'KVIC_ADMIN') {
      return await ordersRepository.getAllOrderRequests();
    }
    return await ordersRepository.getOrderRequestsByBeekeeper(user.uid);
  }

  public async getOrderRequestById(
    orderRequestId: string,
    user: AuthenticatedUser
  ): Promise<{ order: OrderRequest | null; unauthorized?: boolean }> {
    const order = await ordersRepository.getOrderRequestById(orderRequestId);
    if (!order) {
      return { order: null };
    }

    if (user.role === 'KVIC_ADMIN') {
      return { order };
    }

    const ownsOrder =
      order.beekeeperUid === user.uid ||
      order.beekeeperId === user.uid ||
      order.beekeeperId === user.beekeeperId ||
      (user.beekeeperId && order.beekeeperId.includes(user.beekeeperId));

    if (!ownsOrder) {
      return { order: null, unauthorized: true };
    }

    return { order };
  }

  public async updateOrderStatus(
    orderRequestId: string,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED',
    user: AuthenticatedUser
  ): Promise<{ success: boolean; unauthorized?: boolean; notFound?: boolean }> {
    const check = await this.getOrderRequestById(orderRequestId, user);
    if (check.unauthorized) {
      return { success: false, unauthorized: true };
    }
    if (!check.order) {
      return { success: false, notFound: true };
    }

    const ok = await ordersRepository.updateOrderStatus(orderRequestId, status);
    return { success: ok };
  }
}

export const ordersService = new OrdersService();

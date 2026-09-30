/**
 * Orders Controller
 * Handles HTTP requests for consumer order requests and purchase enquiries.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ordersService } from '../services/orders.service';

export class OrdersController {
  public static async createOrderRequest(req: Request, res: Response): Promise<void> {
    try {
      const { productId, batchNumber, beekeeperUid, productName, beekeeperId, beekeeperName, consumerName, consumerContact, consumerMessage, requestedQuantity } = req.body;

      if (!productId || !batchNumber || !beekeeperUid) {
        ApiResponseUtil.badRequest(res, 'Missing required fields: productId, batchNumber, beekeeperUid');
        return;
      }

      const order = await ordersService.createOrderRequest({
        productId,
        batchNumber,
        beekeeperUid,
        productName,
        beekeeperId,
        beekeeperName,
        consumerName,
        consumerContact,
        consumerMessage,
        requestedQuantity: requestedQuantity ? Number(requestedQuantity) : 1,
      });

      ApiResponseUtil.created(res, order, 'Order request submitted successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to submit order request');
    }
  }

  public static async getOrderRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const orders = await ordersService.getOrderRequests(req.user);
      ApiResponseUtil.success(res, orders, 'Order requests retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve order requests');
    }
  }

  public static async getOrderRequestById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { orderId } = req.params;
      const { order, unauthorized } = await ordersService.getOrderRequestById(orderId, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this order request.', 403);
        return;
      }

      if (!order) {
        ApiResponseUtil.notFound(res, 'Order request not found');
        return;
      }

      ApiResponseUtil.success(res, order, 'Order request retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve order request');
    }
  }

  public static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { orderId } = req.params;
      const { status } = req.body;

      if (!status || !['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
        ApiResponseUtil.badRequest(res, 'Valid status required (PENDING, ACCEPTED, REJECTED, COMPLETED)');
        return;
      }

      const result = await ordersService.updateOrderStatus(orderId, status, req.user);

      if (result.unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this order request.', 403);
        return;
      }

      if (result.notFound) {
        ApiResponseUtil.notFound(res, 'Order request not found');
        return;
      }

      ApiResponseUtil.success(res, { status }, 'Order request status updated');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to update order status');
    }
  }
}

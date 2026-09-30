/**
 * Marketplace Controller
 * Handles HTTP requests for marketplace product listings.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { marketplaceService } from '../services/marketplace.service';

export class MarketplaceController {
  public static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const isMy = req.query.my === 'true';
      const products = await marketplaceService.getProducts(isMy, req.user);
      ApiResponseUtil.success(res, products, 'Marketplace products retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve marketplace products');
    }
  }

  public static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const product = await marketplaceService.getProductById(productId);

      if (!product) {
        ApiResponseUtil.notFound(res, 'Marketplace product not found');
        return;
      }

      ApiResponseUtil.success(res, product, 'Product retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve product');
    }
  }

  public static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { batchNumber, title, priceInr, availableStockBottles, description, producerLocation, floralType, weightGrams, contactNumber, harvestDate, imageUrl } = req.body;

      if (!batchNumber || !title || priceInr === undefined || availableStockBottles === undefined) {
        ApiResponseUtil.badRequest(res, 'Missing required fields: batchNumber, title, priceInr, availableStockBottles');
        return;
      }

      const product = await marketplaceService.createProduct(
        {
          batchNumber,
          title,
          priceInr: Number(priceInr),
          availableStockBottles: Number(availableStockBottles),
          description: description || '',
          producerLocation,
          floralType,
          weightGrams: weightGrams ? Number(weightGrams) : undefined,
          contactNumber,
          harvestDate,
          imageUrl,
        },
        req.user
      );

      ApiResponseUtil.created(res, product, 'Marketplace listing created successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to create marketplace listing');
    }
  }

  public static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { productId } = req.params;
      const result = await marketplaceService.deleteProduct(productId, req.user);

      if (result.unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this marketplace listing.', 403);
        return;
      }

      if (result.notFound) {
        ApiResponseUtil.notFound(res, 'Marketplace product not found');
        return;
      }

      ApiResponseUtil.success(res, { deleted: true }, 'Marketplace listing deleted successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to delete product');
    }
  }
}

/**
 * Marketplace Service
 * Business logic and producer ownership enforcement for marketplace listings.
 */

import { marketplaceRepository } from '../repositories/marketplace.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { MarketplaceProduct } from '../../../shared/types';

export class MarketplaceService {
  public async getProducts(isMy: boolean, user?: AuthenticatedUser): Promise<MarketplaceProduct[]> {
    if (isMy && user) {
      return await marketplaceRepository.getProductsByBeekeeper(user.uid);
    }
    if (user?.role === 'KVIC_ADMIN') {
      return await marketplaceRepository.getAllProducts();
    }
    return await marketplaceRepository.getAllPublicProducts();
  }

  public async getProductById(productId: string): Promise<MarketplaceProduct | null> {
    return await marketplaceRepository.getProductById(productId);
  }

  public async createProduct(
    data: {
      productId?: string;
      batchNumber: string;
      title: string;
      producerLocation?: string;
      floralType?: string;
      priceInr: number;
      weightGrams?: number;
      availableStockBottles: number;
      description: string;
      contactNumber?: string;
      harvestDate?: string;
      imageUrl?: string;
    },
    user: AuthenticatedUser
  ): Promise<MarketplaceProduct> {
    const beekeeperName = user.name || 'Ramesh Patil';

    return await marketplaceRepository.createProduct({
      ...data,
      beekeeperUid: user.uid,
      beekeeperId: user.beekeeperId || user.uid,
      beekeeperName,
      priceInr: Number(data.priceInr),
      availableStockBottles: Number(data.availableStockBottles),
    });
  }

  public async deleteProduct(
    productId: string,
    user: AuthenticatedUser
  ): Promise<{ success: boolean; unauthorized?: boolean; notFound?: boolean }> {
    const product = await marketplaceRepository.getProductById(productId);
    if (!product) {
      return { success: false, notFound: true };
    }

    if (user.role !== 'KVIC_ADMIN') {
      const ownsProduct =
        product.beekeeperUid === user.uid ||
        product.beekeeperId === user.uid ||
        product.beekeeperId === user.beekeeperId ||
        (user.beekeeperId && product.beekeeperId.includes(user.beekeeperId));

      if (!ownsProduct) {
        return { success: false, unauthorized: true };
      }
    }

    const ok = await marketplaceRepository.deleteProduct(productId);
    return { success: ok };
  }
}

export const marketplaceService = new MarketplaceService();

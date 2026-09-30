/**
 * Marketplace Repository
 * Manages honey listings in `marketplace_products/{productId}` using Firebase Admin SDK.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { MarketplaceProduct } from '../../../shared/types';

export class MarketplaceRepository {
  private collectionName = 'marketplace_products';

  public async getAllPublicProducts(): Promise<MarketplaceProduct[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackPublicProducts();
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('status', '==', 'active')
        .get();

      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      }

      return await this.getFallbackPublicProducts();
    } catch (err: any) {
      console.warn('[MarketplaceRepository] getAllPublicProducts error:', err?.message || err);
      return await this.getFallbackPublicProducts();
    }
  }

  public async getAllProducts(): Promise<MarketplaceProduct[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllProducts();
    }

    try {
      const snapshot = await adminFirestore.collection(this.collectionName).get();
      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      }

      return await this.getFallbackAllProducts();
    } catch (err: any) {
      console.warn('[MarketplaceRepository] getAllProducts error:', err?.message || err);
      return await this.getFallbackAllProducts();
    }
  }

  public async getProductsByBeekeeper(beekeeperUid: string): Promise<MarketplaceProduct[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackProductsByBeekeeper(beekeeperUid);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('beekeeperUid', '==', beekeeperUid)
        .get();

      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      }

      return await this.getFallbackProductsByBeekeeper(beekeeperUid);
    } catch (err: any) {
      console.warn(`[MarketplaceRepository] getProductsByBeekeeper error for ${beekeeperUid}:`, err?.message || err);
      return await this.getFallbackProductsByBeekeeper(beekeeperUid);
    }
  }

  public async getProductById(productId: string): Promise<MarketplaceProduct | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackProductById(productId);
    }

    try {
      const docRef = await adminFirestore.collection(this.collectionName).doc(productId).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      const qSnap = await adminFirestore
        .collection(this.collectionName)
        .where('productId', '==', productId)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        return this.mapDoc(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      return await this.getFallbackProductById(productId);
    } catch (err: any) {
      console.warn(`[MarketplaceRepository] getProductById error for ${productId}:`, err?.message || err);
      return await this.getFallbackProductById(productId);
    }
  }

  public async createProduct(product: {
    productId?: string;
    batchNumber: string;
    title: string;
    beekeeperUid: string;
    beekeeperId: string;
    beekeeperName: string;
    producerLocation?: string;
    floralType?: string;
    priceInr: number;
    weightGrams?: number;
    availableStockBottles: number;
    description: string;
    contactNumber?: string;
    harvestDate?: string;
    imageUrl?: string;
  }): Promise<MarketplaceProduct> {
    const docId = product.productId || `MP-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const newProduct: MarketplaceProduct = {
      id: docId,
      productId: docId,
      batchId: product.batchNumber,
      batchNumber: product.batchNumber,
      title: product.title,
      productName: product.title,
      beekeeperUid: product.beekeeperUid,
      beekeeperId: product.beekeeperId,
      beekeeperName: product.beekeeperName,
      producerLocation: product.producerLocation || 'Nashik, Maharashtra',
      floralType: product.floralType || 'Multi-Floral Wild Bloom',
      priceInr: Number(product.priceInr || 350),
      weightGrams: Number(product.weightGrams || 500),
      availableStockBottles: Number(product.availableStockBottles || 10),
      quantityAvailable: Number(product.availableStockBottles || 10),
      verifiedBadge: true,
      verificationStatus: 'VERIFIED',
      batchVerificationReference: product.batchNumber,
      harvestDate: product.harvestDate || now.split('T')[0],
      description: product.description,
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
      contactNumber: product.contactNumber || '+91 98234 56781',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(docId).set(newProduct, { merge: true });
      } catch (err: any) {
        console.warn(`[MarketplaceRepository] createProduct write error for ${docId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.marketplace.set(docId, newProduct);
    } catch {
      // ignore
    }

    return newProduct;
  }

  public async deleteProduct(productId: string): Promise<boolean> {
    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(productId).delete();
      } catch (err: any) {
        console.warn(`[MarketplaceRepository] deleteProduct error for ${productId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.marketplace.delete(productId);
    } catch {
      // ignore
    }

    return true;
  }

  private mapDoc(id: string, data: any): MarketplaceProduct {
    return {
      id: data.productId || id,
      productId: data.productId || id,
      batchId: data.batchNumber || data.batchId || '',
      batchNumber: data.batchNumber || data.batchId || '',
      title: data.title || '',
      productName: data.productName || data.title || '',
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || '',
      producerLocation: data.producerLocation || '',
      floralType: data.floralType || '',
      priceInr: Number(data.priceInr || 0),
      weightGrams: Number(data.weightGrams || 500),
      availableStockBottles: Number(data.availableStockBottles || data.quantityAvailable || 0),
      quantityAvailable: Number(data.quantityAvailable || data.availableStockBottles || 0),
      verifiedBadge: Boolean(data.verifiedBadge ?? true),
      verificationStatus: data.verificationStatus || 'VERIFIED',
      batchVerificationReference: data.batchVerificationReference || data.batchNumber || data.batchId || '',
      harvestDate: data.harvestDate || '',
      description: data.description || '',
      imageUrl: data.imageUrl,
      contactNumber: data.contactNumber || '',
      status: data.status || 'active',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  private async getFallbackPublicProducts(): Promise<MarketplaceProduct[]> {
    try {
      const { firestoreMarketplaceRepository } = await import(
        '../../../src/services/firestore/marketplace.repository'
      );
      const docs = await firestoreMarketplaceRepository.getAllPublicProducts();
      if (docs && docs.length > 0) return docs.map((d) => this.mapDoc(d.productId, d));
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.marketplace.values()).filter((p) => p.status === 'active' || !p.status);
  }

  private async getFallbackAllProducts(): Promise<MarketplaceProduct[]> {
    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.marketplace.values());
  }

  private async getFallbackProductsByBeekeeper(beekeeperUid: string): Promise<MarketplaceProduct[]> {
    try {
      const { firestoreMarketplaceRepository } = await import(
        '../../../src/services/firestore/marketplace.repository'
      );
      const docs = await firestoreMarketplaceRepository.getProductsByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) return docs.map((d) => this.mapDoc(d.productId, d));
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.marketplace.values()).filter(
      (p) => p.beekeeperId === beekeeperUid || p.beekeeperUid === beekeeperUid || p.beekeeperId.includes(beekeeperUid)
    );
  }

  private async getFallbackProductById(productId: string): Promise<MarketplaceProduct | null> {
    const { mockDb } = await import('./mock.db');
    return mockDb.marketplace.get(productId) || null;
  }
}

export const marketplaceRepository = new MarketplaceRepository();

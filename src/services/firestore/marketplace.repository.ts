/**
 * Honey Chain - Firestore Marketplace Repository
 * Manages marketplace product listings in `marketplace_products/{productId}`
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
import { FirestoreMarketplaceProductDoc } from './types';

export class FirestoreMarketplaceRepository {
  private collectionName = 'marketplace_products';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  /**
   * Fetches all active/published marketplace products for public browsing.
   */
  public async getAllPublicProducts(): Promise<FirestoreMarketplaceProductDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreMarketplaceRepository.getAllPublicProducts error:', error);
      return [];
    }
  }

  /**
   * Fetches all marketplace products across beekeepers (for KVIC Admin).
   */
  public async getAllProducts(): Promise<FirestoreMarketplaceProductDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreMarketplaceRepository.getAllProducts error:', error);
      return [];
    }
  }

  /**
   * Fetches all marketplace products owned by a specific beekeeper UID.
   */
  public async getProductsByBeekeeper(beekeeperUid: string): Promise<FirestoreMarketplaceProductDoc[]> {
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
      console.warn(`FirestoreMarketplaceRepository.getProductsByBeekeeper error for ${beekeeperUid}:`, error);
      return [];
    }
  }

  /**
   * Fetches a single marketplace product by productId.
   */
  public async getProductById(productId: string): Promise<FirestoreMarketplaceProductDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, productId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return this.mapDoc(snapshot.id, snapshot.data());
    } catch (error) {
      console.warn(`FirestoreMarketplaceRepository.getProductById error for ${productId}:`, error);
      return null;
    }
  }

  /**
   * Creates or overwrites a marketplace product document.
   */
  public async createProduct(
    product: Omit<FirestoreMarketplaceProductDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreMarketplaceProductDoc> {
    const now = new Date().toISOString();
    const docId = product.productId || product.id;

    if (!db) {
      return {
        ...product,
        id: docId,
        productId: docId,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, docId);
    const docPayload = {
      id: docId,
      productId: docId,
      beekeeperUid: product.beekeeperUid,
      beekeeperId: product.beekeeperId,
      beekeeperName: product.beekeeperName,
      batchNumber: product.batchNumber || product.batchId,
      batchId: product.batchId || product.batchNumber,
      productName: product.productName || product.title,
      title: product.title || product.productName,
      productType: product.productType || product.floralType,
      floralType: product.floralType || product.productType,
      description: product.description,
      price: Number(product.price || product.priceInr || 0),
      priceInr: Number(product.priceInr || product.price || 0),
      quantityAvailable: Number(product.quantityAvailable ?? product.availableStockBottles ?? 0),
      availableStockBottles: Number(product.availableStockBottles ?? product.quantityAvailable ?? 0),
      unit: product.unit || '500g Jar',
      weightGrams: Number(product.weightGrams || 500),
      imageUrl: product.imageUrl || null,
      location: product.location || product.producerLocation,
      producerLocation: product.producerLocation || product.location,
      verificationStatus: product.verificationStatus || 'VERIFIED',
      verifiedBadge: Boolean(product.verifiedBadge ?? true),
      batchVerificationReference: product.batchVerificationReference || product.batchNumber || product.batchId,
      harvestDate: product.harvestDate || now.split('T')[0],
      contactNumber: product.contactNumber || '',
      status: product.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreMarketplaceRepository.createProduct warning for ${docId}:`, writeErr);
    }

    return {
      ...product,
      id: docId,
      productId: docId,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Updates an existing marketplace product document.
   */
  public async updateProduct(
    productId: string,
    updates: Partial<FirestoreMarketplaceProductDoc>
  ): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, productId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreMarketplaceRepository.updateProduct error for ${productId}:`, error);
      return false;
    }
  }

  /**
   * Deletes a marketplace product listing.
   */
  public async deleteProduct(productId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, productId);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.warn(`FirestoreMarketplaceRepository.deleteProduct error for ${productId}:`, error);
      return false;
    }
  }

  private mapDoc(id: string, data: any): FirestoreMarketplaceProductDoc {
    const price = Number(data.price || data.priceInr || 0);
    const stock = Number(data.quantityAvailable ?? data.availableStockBottles ?? 0);
    const batchId = data.batchNumber || data.batchId || '';
    const title = data.title || data.productName || 'Pure Raw Honey';
    const floralType = data.floralType || data.productType || 'Multi-Floral Wild Forest';
    const location = data.producerLocation || data.location || 'India';

    return {
      id,
      productId: data.productId || id,
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || 'Registered Beekeeper',
      batchNumber: batchId,
      batchId,
      productName: title,
      title,
      productType: floralType,
      floralType,
      description: data.description || '',
      price,
      priceInr: price,
      quantityAvailable: stock,
      availableStockBottles: stock,
      unit: data.unit || '500g Jar',
      weightGrams: Number(data.weightGrams || 500),
      imageUrl: data.imageUrl || undefined,
      location,
      producerLocation: location,
      verificationStatus: data.verificationStatus || 'VERIFIED',
      verifiedBadge: data.verifiedBadge !== false,
      batchVerificationReference: data.batchVerificationReference || batchId,
      harvestDate: data.harvestDate || '',
      contactNumber: data.contactNumber || '',
      status: data.status || 'active',
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreMarketplaceRepository = new FirestoreMarketplaceRepository();

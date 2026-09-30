/**
 * Honey Chain - Firestore Learning Repository
 * Manages official educational and training resources in `learning_content/{contentId}`
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
import { FirestoreLearningContentDoc } from './types';

export class FirestoreLearningRepository {
  private collectionName = 'learning_content';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getAllPublishedLearningContent(): Promise<FirestoreLearningContentDoc[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'published')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreLearningRepository.getAllPublishedLearningContent error:', error);
      return [];
    }
  }

  public async getAllLearningContent(): Promise<FirestoreLearningContentDoc[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
      return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreLearningRepository.getAllLearningContent error:', error);
      return [];
    }
  }

  public async getLearningContentById(contentId: string): Promise<FirestoreLearningContentDoc | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.collectionName, contentId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      return this.mapDoc(snapshot.id, snapshot.data());
    } catch (error) {
      console.warn(`FirestoreLearningRepository.getLearningContentById error for ${contentId}:`, error);
      return null;
    }
  }

  public async createLearningContent(
    content: Omit<FirestoreLearningContentDoc, 'createdAt' | 'updatedAt'>
  ): Promise<FirestoreLearningContentDoc> {
    const now = new Date().toISOString();
    const docId = content.contentId || content.id;

    if (!db) {
      return {
        ...content,
        id: docId,
        contentId: docId,
        createdAt: now,
        updatedAt: now,
      };
    }

    const ref = doc(db, this.collectionName, docId);
    const duration = Number(content.duration || content.durationMinutes || 15);
    const docPayload = {
      id: docId,
      contentId: docId,
      title: content.title,
      description: content.description,
      category: content.category,
      youtubeUrl: content.youtubeUrl,
      thumbnailUrl: content.thumbnailUrl || null,
      duration,
      durationMinutes: duration,
      language: content.language || 'en',
      targetLanguage: content.targetLanguage || content.language || 'en',
      publishedBy: content.publishedBy || 'KVIC Directorate of Honey Mission',
      publishedAt: content.publishedAt || now,
      viewsCount: Number(content.viewsCount || 0),
      status: content.status || 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ref, docPayload, { merge: true });
    } catch (writeErr) {
      console.warn(`FirestoreLearningRepository.createLearningContent warning for ${docId}:`, writeErr);
    }

    return {
      ...content,
      id: docId,
      contentId: docId,
      duration,
      durationMinutes: duration,
      createdAt: now,
      updatedAt: now,
    };
  }

  public async updateLearningContent(
    contentId: string,
    updates: Partial<FirestoreLearningContentDoc>
  ): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, contentId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreLearningRepository.updateLearningContent error for ${contentId}:`, error);
      return false;
    }
  }

  public async deleteLearningContent(contentId: string): Promise<boolean> {
    if (!db) return true;
    try {
      const ref = doc(db, this.collectionName, contentId);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.warn(`FirestoreLearningRepository.deleteLearningContent error for ${contentId}:`, error);
      return false;
    }
  }

  private mapDoc(id: string, data: any): FirestoreLearningContentDoc {
    const duration = Number(data.duration || data.durationMinutes || 15);
    return {
      id,
      contentId: data.contentId || id,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'hive_management',
      youtubeUrl: data.youtubeUrl || '',
      thumbnailUrl: data.thumbnailUrl || undefined,
      duration,
      durationMinutes: duration,
      language: data.language || 'en',
      targetLanguage: data.targetLanguage || data.language || 'en',
      publishedBy: data.publishedBy || 'KVIC Directorate of Honey Mission',
      publishedAt: data.publishedAt || this.normalizeTimestamp(data.createdAt),
      viewsCount: Number(data.viewsCount || 0),
      status: data.status || 'published',
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }
}

export const firestoreLearningRepository = new FirestoreLearningRepository();

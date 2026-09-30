/**
 * Learning Repository
 * Manages educational material in `learning_content` and notifications in `notifications`.
 * Strictly respects Firestore as source of truth without resurrecting deleted content.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { LearningContent, AppNotification } from '../../../shared/types';

export class LearningRepository {
  private collectionName = 'learning_content';
  private notifCollection = 'notifications';

  public async getAllPublishedLearningContent(): Promise<LearningContent[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackPublishedContent();
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.collectionName)
        .where('status', '==', 'published')
        .get();

      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      }

      // If empty in Firestore, do NOT resurrect deleted content from mockDb!
      return [];
    } catch (err: any) {
      console.warn('[LearningRepository] getAllPublishedLearningContent error:', err?.message || err);
      return await this.getFallbackPublishedContent();
    }
  }

  public async getAllLearningContent(): Promise<LearningContent[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllContent();
    }

    try {
      const snapshot = await adminFirestore.collection(this.collectionName).get();
      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => this.mapDoc(d.id, d.data()));
        return docs.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
      }
      return [];
    } catch (err: any) {
      console.warn('[LearningRepository] getAllLearningContent error:', err?.message || err);
      return await this.getFallbackAllContent();
    }
  }

  public async getLearningContentById(contentId: string): Promise<LearningContent | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackContentById(contentId);
    }

    try {
      const docRef = await adminFirestore.collection(this.collectionName).doc(contentId).get();
      if (docRef.exists) {
        return this.mapDoc(docRef.id, docRef.data());
      }

      const qSnap = await adminFirestore
        .collection(this.collectionName)
        .where('contentId', '==', contentId)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        return this.mapDoc(qSnap.docs[0].id, qSnap.docs[0].data());
      }

      return null;
    } catch (err: any) {
      console.warn(`[LearningRepository] getLearningContentById error for ${contentId}:`, err?.message || err);
      return await this.getFallbackContentById(contentId);
    }
  }

  public async createLearningContent(content: {
    contentId?: string;
    title: string;
    description: string;
    category?: string;
    youtubeUrl: string;
    thumbnailUrl?: string;
    durationMinutes?: number;
    language?: string;
    authorName?: string;
    status?: 'published' | 'draft';
  }): Promise<LearningContent> {
    const docId = content.contentId || `LRN-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const duration = Number(content.durationMinutes || 15);
    const publishedDate = now.split('T')[0];

    const learningItem: LearningContent = {
      id: docId,
      title: content.title,
      description: content.description,
      category: (content.category || 'hive_management') as any,
      youtubeUrl: content.youtubeUrl,
      thumbnailUrl: content.thumbnailUrl,
      durationMinutes: duration,
      language: (content.language || 'en') as any,
      publishedDate,
      authorName: content.authorName || 'KVIC Directorate of Honey Mission',
      viewsCount: 0,
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(docId).set({
          id: docId,
          contentId: docId,
          title: content.title,
          description: content.description,
          category: learningItem.category,
          youtubeUrl: content.youtubeUrl,
          thumbnailUrl: content.thumbnailUrl || null,
          duration,
          durationMinutes: duration,
          language: learningItem.language,
          authorName: learningItem.authorName,
          publishedDate,
          publishedAt: now,
          viewsCount: 0,
          status: content.status || 'published',
          createdAt: now,
          updatedAt: now,
        }, { merge: true });

        // Create learning broadcast notification in notifications collection
        const notifId = `NTF-PUB-${docId}`;
        await adminFirestore.collection(this.notifCollection).doc(notifId).set({
          id: notifId,
          userId: 'all',
          title: `🔔 New Learning Guide: ${content.title}`,
          message: `${learningItem.authorName} published a new tutorial in ${learningItem.language.toUpperCase()}.`,
          type: 'learning',
          timestamp: now,
          read: false,
          linkUrl: '#learning',
          relatedContentId: docId,
          createdAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[LearningRepository] createLearningContent write error for ${docId}:`, err?.message || err);
      }
    } else {
      try {
        const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
        await ensureSystemAdminAuth();
        const { firestoreLearningRepository } = await import(
          '../../../src/services/firestore/learning.repository'
        );
        await firestoreLearningRepository.createLearningContent({
          id: docId,
          contentId: docId,
          title: content.title,
          description: content.description,
          category: learningItem.category,
          youtubeUrl: content.youtubeUrl,
          thumbnailUrl: content.thumbnailUrl || undefined,
          duration: duration,
          durationMinutes: duration,
          language: learningItem.language,
          publishedBy: learningItem.authorName,
          publishedAt: now,
          viewsCount: 0,
          status: content.status || 'published',
        });
      } catch (fbErr) {
        console.warn(`[LearningRepository] Fallback createLearningContent error:`, fbErr);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.learningContent.set(docId, learningItem);
    } catch {
      // ignore
    }

    return learningItem;
  }

  public async updateLearningContent(
    contentId: string,
    updates: Partial<LearningContent & { status?: string }>
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(contentId).set({
          ...updates,
          updatedAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[LearningRepository] updateLearningContent error for ${contentId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      const item = mockDb.learningContent.get(contentId);
      if (item) {
        Object.assign(item, updates);
        mockDb.learningContent.set(contentId, item);
      }
    } catch {
      // ignore
    }

    return true;
  }

  public async deleteLearningContent(contentId: string): Promise<boolean> {
    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.collectionName).doc(contentId).delete();
      } catch (err: any) {
        console.warn(`[LearningRepository] deleteLearningContent error for ${contentId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.learningContent.delete(contentId);
    } catch {
      // ignore
    }

    return true;
  }

  public async getUserNotifications(userId: string): Promise<AppNotification[]> {
    if (hasAdminCredentials) {
      try {
        const snapshot = await adminFirestore.collection(this.notifCollection).get();
        if (!snapshot.empty) {
          const list = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: data.id || d.id,
                userId: data.userId || 'all',
                title: data.title || '',
                message: data.message || '',
                type: data.type || 'learning',
                timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
                read: Boolean(data.read),
                linkUrl: data.linkUrl,
                relatedContentId: data.relatedContentId,
              } as AppNotification;
            })
            .filter((n) => n.userId === 'all' || n.userId === userId);
          return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (err: any) {
        console.warn(`[LearningRepository] getUserNotifications error:`, err?.message || err);
      }
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.notifications.values()).filter(
      (n) => n.userId === 'all' || n.userId === userId
    );
  }

  public async markNotificationAsRead(notifId: string): Promise<boolean> {
    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.notifCollection).doc(notifId).set({
          read: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[LearningRepository] markNotificationAsRead error:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      const notif = mockDb.notifications.get(notifId);
      if (notif) {
        notif.read = true;
        mockDb.notifications.set(notifId, notif);
      }
    } catch {
      // ignore
    }

    return true;
  }

  private mapDoc(id: string, data: any): LearningContent {
    let publishedDate = '2026-03-01';
    if (typeof data.publishedDate === 'string' && data.publishedDate) {
      publishedDate = data.publishedDate;
    } else if (typeof data.publishedAt === 'string' && data.publishedAt) {
      publishedDate = data.publishedAt.split('T')[0];
    } else if (typeof data.createdAt === 'string') {
      publishedDate = data.createdAt.split('T')[0];
    } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      publishedDate = data.createdAt.toDate().toISOString().split('T')[0];
    } else if (data.publishedAt && typeof data.publishedAt.toDate === 'function') {
      publishedDate = data.publishedAt.toDate().toISOString().split('T')[0];
    }

    return {
      id: data.contentId || id,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'hive_management',
      youtubeUrl: data.youtubeUrl || '',
      thumbnailUrl: data.thumbnailUrl || undefined,
      durationMinutes: Number(data.durationMinutes || data.duration || 15),
      language: data.language || 'en',
      publishedDate,
      authorName: data.authorName || data.publishedBy || 'KVIC Directorate of Honey Mission',
      viewsCount: Number(data.viewsCount || 0),
    };
  }

  private async getFallbackPublishedContent(): Promise<LearningContent[]> {
    try {
      const { firestoreLearningRepository } = await import(
        '../../../src/services/firestore/learning.repository'
      );
      const docs = await firestoreLearningRepository.getAllPublishedLearningContent();
      if (docs && docs.length > 0) {
        return docs.map((d) => this.mapDoc(d.contentId, d));
      }
    } catch {
      // ignore
    }
    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.learningContent.values());
  }

  private async getFallbackAllContent(): Promise<LearningContent[]> {
    try {
      const { firestoreLearningRepository } = await import(
        '../../../src/services/firestore/learning.repository'
      );
      const docs = await firestoreLearningRepository.getAllLearningContent();
      if (docs && docs.length > 0) {
        return docs.map((d) => this.mapDoc(d.contentId, d));
      }
    } catch {
      // ignore
    }
    return [];
  }

  private async getFallbackContentById(contentId: string): Promise<LearningContent | null> {
    try {
      const { firestoreLearningRepository } = await import(
        '../../../src/services/firestore/learning.repository'
      );
      const doc = await firestoreLearningRepository.getLearningContentById(contentId);
      if (doc) return this.mapDoc(doc.contentId, doc);
    } catch {
      // ignore
    }
    return null;
  }
}

export const learningRepository = new LearningRepository();

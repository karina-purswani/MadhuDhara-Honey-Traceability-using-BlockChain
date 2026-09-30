/**
 * Learning Service
 * Business logic for educational resources and broadcast notifications.
 */

import { learningRepository } from '../repositories/learning.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { LearningContent, AppNotification } from '../../../shared/types';

export class LearningService {
  public async getLearningContent(user?: AuthenticatedUser): Promise<LearningContent[]> {
    if (user?.role === 'KVIC_ADMIN') {
      return await learningRepository.getAllLearningContent();
    }
    return await learningRepository.getAllPublishedLearningContent();
  }

  public async getLearningContentById(
    contentId: string,
    user?: AuthenticatedUser
  ): Promise<{ content: LearningContent | null; forbidden?: boolean }> {
    const item = await learningRepository.getLearningContentById(contentId);
    if (!item) {
      return { content: null };
    }
    return { content: item };
  }

  public async createLearningContent(
    data: {
      title: string;
      description: string;
      category?: string;
      youtubeUrl: string;
      thumbnailUrl?: string;
      durationMinutes?: number;
      language?: string;
      authorName?: string;
      status?: 'published' | 'draft';
    },
    user: AuthenticatedUser
  ): Promise<LearningContent> {
    const authorName = data.authorName || user.name || 'KVIC Directorate of Honey Mission';
    return await learningRepository.createLearningContent({
      ...data,
      authorName,
    });
  }

  public async updateLearningContent(
    contentId: string,
    updates: Partial<LearningContent & { status?: string }>,
    _user: AuthenticatedUser
  ): Promise<boolean> {
    return await learningRepository.updateLearningContent(contentId, updates);
  }

  public async deleteLearningContent(
    contentId: string,
    _user: AuthenticatedUser
  ): Promise<boolean> {
    return await learningRepository.deleteLearningContent(contentId);
  }

  public async getUserNotifications(user: AuthenticatedUser): Promise<AppNotification[]> {
    return await learningRepository.getUserNotifications(user.uid);
  }

  public async markNotificationAsRead(
    notifId: string,
    _user: AuthenticatedUser
  ): Promise<boolean> {
    return await learningRepository.markNotificationAsRead(notifId);
  }
}

export const learningService = new LearningService();

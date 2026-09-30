/**
 * Learning API Service
 * Interacts with backend /api/learning endpoints.
 */

import { apiClient } from './apiClient';
import { LearningContent, AppNotification } from '../../../shared/types';

export async function getLearningContent(): Promise<LearningContent[]> {
  const res = await apiClient.get<LearningContent[]>('/learning');
  return res.data || [];
}

export async function getLearningContentById(contentId: string): Promise<LearningContent | null> {
  try {
    const res = await apiClient.get<LearningContent>(`/learning/${encodeURIComponent(contentId)}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function publishLearningContent(data: {
  title: string;
  description: string;
  category?: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  language?: string;
  authorName?: string;
}): Promise<LearningContent> {
  const res = await apiClient.post<LearningContent>('/learning', data);
  if (!res.data) {
    throw new Error(res.message || 'Failed to publish learning content');
  }
  return res.data;
}

export async function updateLearningContent(
  contentId: string,
  updates: Partial<LearningContent>
): Promise<boolean> {
  try {
    await apiClient.put(`/learning/${encodeURIComponent(contentId)}`, updates);
    return true;
  } catch {
    return false;
  }
}

export async function deleteLearningContent(contentId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/learning/${encodeURIComponent(contentId)}`);
    return true;
  } catch {
    return false;
  }
}

export async function getUserNotifications(): Promise<AppNotification[]> {
  try {
    const res = await apiClient.get<AppNotification[]>('/learning/notifications/my');
    return res.data || [];
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    await apiClient.patch(`/learning/notifications/${encodeURIComponent(notificationId)}/read`);
    return true;
  } catch {
    return false;
  }
}

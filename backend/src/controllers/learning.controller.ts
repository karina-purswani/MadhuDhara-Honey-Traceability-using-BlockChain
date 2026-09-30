/**
 * Learning Controller
 * Handles HTTP requests for learning modules and user notifications.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { learningService } from '../services/learning.service';

export class LearningController {
  public static async getLearningContent(req: Request, res: Response): Promise<void> {
    try {
      const items = await learningService.getLearningContent(req.user);
      ApiResponseUtil.success(res, items, 'Learning content retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve learning content');
    }
  }

  public static async getLearningContentById(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const { content, forbidden } = await learningService.getLearningContentById(contentId, req.user);

      if (forbidden) {
        ApiResponseUtil.error(res, 'Access denied to unpublished learning content', 403);
        return;
      }

      if (!content) {
        ApiResponseUtil.notFound(res, 'Learning content not found');
        return;
      }

      ApiResponseUtil.success(res, content, 'Learning content retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve learning item');
    }
  }

  public static async createLearningContent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { title, description, category, youtubeUrl, thumbnailUrl, durationMinutes, language, authorName, status } = req.body;

      if (!title || !description || !youtubeUrl) {
        ApiResponseUtil.badRequest(res, 'Title, description, and youtubeUrl are required');
        return;
      }

      const content = await learningService.createLearningContent(
        {
          title,
          description,
          category,
          youtubeUrl,
          thumbnailUrl,
          durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
          language,
          authorName,
          status,
        },
        req.user
      );

      ApiResponseUtil.created(res, content, 'Learning content published successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to publish learning content');
    }
  }

  public static async updateLearningContent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { contentId } = req.params;
      const ok = await learningService.updateLearningContent(contentId, req.body, req.user);

      if (!ok) {
        ApiResponseUtil.notFound(res, 'Learning content not found');
        return;
      }

      ApiResponseUtil.success(res, { updated: true }, 'Learning content updated successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to update learning content');
    }
  }

  public static async deleteLearningContent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { contentId } = req.params;
      await learningService.deleteLearningContent(contentId, req.user);

      ApiResponseUtil.success(res, { deleted: true }, 'Learning content deleted successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to delete learning content');
    }
  }

  public static async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const notifs = await learningService.getUserNotifications(req.user);
      ApiResponseUtil.success(res, notifs, 'Notifications retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve notifications');
    }
  }

  public static async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { notificationId } = req.params;
      await learningService.markNotificationAsRead(notificationId, req.user);

      ApiResponseUtil.success(res, { read: true }, 'Notification marked as read');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to mark notification as read');
    }
  }
}

/**
 * Alerts Controller
 * Handles HTTP requests for hive condition alerts.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { alertsService } from '../services/alerts.service';

export class AlertsController {
  public static async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const alerts = await alertsService.getAlerts(req.user);
      ApiResponseUtil.success(res, alerts, 'Alerts retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve alerts');
    }
  }

  public static async getAlertById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { alertId } = req.params;
      const { alert, unauthorized } = await alertsService.getAlertById(alertId, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this alert.', 403);
        return;
      }

      if (!alert) {
        ApiResponseUtil.notFound(res, 'Alert not found');
        return;
      }

      ApiResponseUtil.success(res, alert, 'Alert retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve alert');
    }
  }

  public static async createAlert(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { hiveId, alertType, severity, title, description, observedValues, idealRange, recommendedAction, healthScore } = req.body;

      if (!hiveId || !alertType || !title || !description) {
        ApiResponseUtil.badRequest(res, 'Missing required fields: hiveId, alertType, title, description');
        return;
      }

      const alert = await alertsService.createAlert(
        {
          hiveId,
          alertType,
          severity: severity || 'info',
          title,
          description,
          observedValues,
          idealRange,
          recommendedAction,
          healthScore: healthScore ? Number(healthScore) : undefined,
        },
        req.user
      );

      ApiResponseUtil.created(res, alert, 'Alert created successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to create alert');
    }
  }

  public static async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { alertId } = req.params;
      const result = await alertsService.acknowledgeAlert(alertId, req.user);

      if (result.unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this alert.', 403);
        return;
      }

      if (result.notFound) {
        ApiResponseUtil.notFound(res, 'Alert not found');
        return;
      }

      ApiResponseUtil.success(res, { acknowledged: true }, 'Alert acknowledged successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to acknowledge alert');
    }
  }
}

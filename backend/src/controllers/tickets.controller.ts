/**
 * Tickets Controller
 * Handles HTTP requests for support tickets and secure ticket messages.
 */

import { Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { ticketsService } from '../services/tickets.service';

export class TicketsController {
  public static async getTickets(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const tickets = await ticketsService.getTickets(req.user);
      ApiResponseUtil.success(res, tickets, 'Tickets retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve tickets');
    }
  }

  public static async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { ticketId } = req.params;
      const { ticket, unauthorized } = await ticketsService.getTicketById(ticketId, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this ticket.', 403);
        return;
      }

      if (!ticket) {
        ApiResponseUtil.notFound(res, 'Ticket not found');
        return;
      }

      ApiResponseUtil.success(res, ticket, 'Ticket retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve ticket');
    }
  }

  public static async getTicketMessages(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { ticketId } = req.params;
      const { messages, unauthorized, notFound } = await ticketsService.getTicketMessages(ticketId, req.user);

      if (unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this ticket.', 403);
        return;
      }

      if (notFound) {
        ApiResponseUtil.notFound(res, 'Ticket not found');
        return;
      }

      ApiResponseUtil.success(res, messages, 'Ticket messages retrieved successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to retrieve ticket messages');
    }
  }

  public static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { title, description, message, hiveId, alertId, category, sensorSnapshot, healthScore } = req.body;

      if (!title || (!description && !message)) {
        ApiResponseUtil.badRequest(res, 'Title and description or message are required');
        return;
      }

      const ticket = await ticketsService.createTicket(
        {
          title,
          description,
          message,
          hiveId,
          alertId,
          category,
          sensorSnapshot,
          healthScore,
        },
        req.user
      );

      ApiResponseUtil.created(res, ticket, 'Support ticket created successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to create support ticket');
    }
  }

  public static async addTicketMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { ticketId } = req.params;
      const { message, newStatus } = req.body;

      if (!message || !message.trim()) {
        ApiResponseUtil.badRequest(res, 'Message text is required');
        return;
      }

      const result = await ticketsService.addTicketMessage(ticketId, message.trim(), newStatus, req.user);

      if (result.unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this ticket.', 403);
        return;
      }

      if (result.notFound) {
        ApiResponseUtil.notFound(res, 'Ticket not found');
        return;
      }

      ApiResponseUtil.created(res, result.message, 'Message posted successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to post ticket message');
    }
  }

  public static async updateTicketStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseUtil.error(res, 'Authentication required.', 401);
        return;
      }

      const { ticketId } = req.params;
      const { status } = req.body;

      if (!status) {
        ApiResponseUtil.badRequest(res, 'Status is required');
        return;
      }

      const result = await ticketsService.updateTicketStatus(ticketId, status, req.user);

      if (result.unauthorized) {
        ApiResponseUtil.error(res, 'Access denied. You do not own this ticket.', 403);
        return;
      }

      if (result.notFound) {
        ApiResponseUtil.notFound(res, 'Ticket not found');
        return;
      }

      ApiResponseUtil.success(res, { status }, 'Ticket status updated successfully');
    } catch (err: any) {
      ApiResponseUtil.serverError(res, err, 'Failed to update ticket status');
    }
  }
}

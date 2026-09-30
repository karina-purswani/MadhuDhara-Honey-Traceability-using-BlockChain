/**
 * Tickets Service
 * Manages support ticket workflows, messaging, status changes, and participant authorization.
 */

import { ticketsRepository } from '../repositories/tickets.repository';
import { AuthenticatedUser } from '../middleware/auth.middleware';
import { SupportTicket, TicketMessage } from '../../../shared/types';

export class TicketsService {
  public async getTickets(user: AuthenticatedUser): Promise<SupportTicket[]> {
    if (user.role === 'KVIC_ADMIN') {
      return await ticketsRepository.getAllTickets();
    }
    return await ticketsRepository.getTicketsByBeekeeper(user.uid);
  }

  public async getTicketById(
    ticketId: string,
    user: AuthenticatedUser
  ): Promise<{ ticket: SupportTicket | null; unauthorized?: boolean }> {
    const ticket = await ticketsRepository.getTicketById(ticketId);
    if (!ticket) {
      return { ticket: null };
    }

    if (user.role === 'KVIC_ADMIN') {
      return { ticket };
    }

    const ownsTicket =
      ticket.beekeeperId === user.uid ||
      ticket.beekeeperId === user.beekeeperId ||
      (user.beekeeperId && ticket.beekeeperId.includes(user.beekeeperId));

    if (!ownsTicket) {
      return { ticket: null, unauthorized: true };
    }

    return { ticket };
  }

  public async getTicketMessages(
    ticketId: string,
    user: AuthenticatedUser
  ): Promise<{ messages: TicketMessage[]; unauthorized?: boolean; notFound?: boolean }> {
    const check = await this.getTicketById(ticketId, user);
    if (check.unauthorized) {
      return { messages: [], unauthorized: true };
    }
    if (!check.ticket) {
      return { messages: [], notFound: true };
    }

    const messages = await ticketsRepository.getMessagesForTicket(ticketId);
    return { messages };
  }

  public async createTicket(
    data: {
      ticketId?: string;
      hiveId?: string;
      alertId?: string;
      title: string;
      description?: string;
      message?: string;
      category?: string;
      sensorSnapshot?: any;
      healthScore?: number;
    },
    user: AuthenticatedUser
  ): Promise<SupportTicket> {
    const beekeeperName = user.name || (user.role === 'KVIC_ADMIN' ? 'KVIC Officer' : 'Ramesh Patil');
    const desc = data.description || data.message || data.title;

    return await ticketsRepository.createTicket({
      ticketId: data.ticketId,
      beekeeperUid: user.uid,
      beekeeperId: user.beekeeperId || user.uid,
      beekeeperName,
      hiveId: data.hiveId,
      alertId: data.alertId,
      title: data.title,
      description: desc,
      category: data.category,
      sensorSnapshot: data.sensorSnapshot,
      healthScore: data.healthScore,
      initialMessage: data.message || desc,
    });
  }

  public async addTicketMessage(
    ticketId: string,
    message: string,
    newStatus: SupportTicket['status'] | undefined,
    user: AuthenticatedUser
  ): Promise<{ message: TicketMessage | null; unauthorized?: boolean; notFound?: boolean }> {
    const check = await this.getTicketById(ticketId, user);
    if (check.unauthorized) {
      return { message: null, unauthorized: true };
    }
    if (!check.ticket) {
      return { message: null, notFound: true };
    }

    const senderRole = user.role === 'KVIC_ADMIN' ? 'admin' : 'beekeeper';
    const senderName = user.name || (user.role === 'KVIC_ADMIN' ? 'Dr. Anil Joshi (KVIC Officer)' : 'Ramesh Patil');

    const msg = await ticketsRepository.addTicketMessage({
      ticketId,
      senderUid: user.uid,
      senderName,
      senderRole,
      message,
      newStatus,
    });

    return { message: msg };
  }

  public async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status'],
    user: AuthenticatedUser
  ): Promise<{ success: boolean; unauthorized?: boolean; notFound?: boolean }> {
    const check = await this.getTicketById(ticketId, user);
    if (check.unauthorized) {
      return { success: false, unauthorized: true };
    }
    if (!check.ticket) {
      return { success: false, notFound: true };
    }

    const ok = await ticketsRepository.updateTicketStatus(ticketId, status);
    return { success: ok };
  }
}

export const ticketsService = new TicketsService();

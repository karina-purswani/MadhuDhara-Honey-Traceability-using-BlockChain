/**
 * Tickets API Service
 * Interacts with backend /api/tickets endpoints.
 */

import { apiClient } from './apiClient';
import { SupportTicket, TicketMessage } from '../../../shared/types';

export async function getTickets(): Promise<SupportTicket[]> {
  const res = await apiClient.get<SupportTicket[]>('/tickets');
  return res.data || [];
}

export async function getTicketById(ticketId: string): Promise<SupportTicket | null> {
  try {
    const res = await apiClient.get<SupportTicket>(`/tickets/${encodeURIComponent(ticketId)}`);
    return res.data || null;
  } catch {
    return null;
  }
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  try {
    const res = await apiClient.get<TicketMessage[]>(`/tickets/${encodeURIComponent(ticketId)}/messages`);
    return res.data || [];
  } catch {
    return [];
  }
}

export async function createTicket(data: {
  title: string;
  description?: string;
  message?: string;
  hiveId?: string;
  alertId?: string;
  category?: string;
  sensorSnapshot?: any;
  healthScore?: number;
}): Promise<SupportTicket> {
  const res = await apiClient.post<SupportTicket>('/tickets', data);
  if (!res.data) {
    throw new Error(res.message || 'Failed to create support ticket');
  }
  return res.data;
}

export async function addTicketMessage(
  ticketId: string,
  messageOrObj: string | { message: string; newStatus?: SupportTicket['status'] },
  newStatusParam?: SupportTicket['status']
): Promise<TicketMessage> {
  const message = typeof messageOrObj === 'string' ? messageOrObj : messageOrObj.message;
  const newStatus = typeof messageOrObj === 'object' ? (messageOrObj.newStatus || newStatusParam) : newStatusParam;

  const res = await apiClient.post<TicketMessage>(`/tickets/${encodeURIComponent(ticketId)}/messages`, {
    message,
    newStatus,
  });
  if (!res.data) {
    throw new Error(res.message || 'Failed to post ticket message');
  }
  return res.data;
}

export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicket['status']
): Promise<boolean> {
  try {
    await apiClient.patch(`/tickets/${encodeURIComponent(ticketId)}/status`, { status });
    return true;
  } catch {
    return false;
  }
}

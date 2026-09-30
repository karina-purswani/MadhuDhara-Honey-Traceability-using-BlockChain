/**
 * Tickets Repository
 * Manages tickets in `tickets/{ticketId}` and conversation messages in `ticket_messages/{messageId}`.
 */

import { adminFirestore, hasAdminCredentials } from '../config/firebase-admin.config';
import { SupportTicket, TicketMessage } from '../../../shared/types';

export class TicketsRepository {
  private ticketsCollection = 'tickets';
  private messagesCollection = 'ticket_messages';

  public async getTicketsByBeekeeper(beekeeperUid: string): Promise<SupportTicket[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackTicketsByBeekeeper(beekeeperUid);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.ticketsCollection)
        .where('beekeeperUid', '==', beekeeperUid)
        .get();

      if (!snapshot.empty) {
        const ticketDocs = snapshot.docs.map((d) => this.mapTicketDoc(d.id, d.data()));
        const tickets = await Promise.all(
          ticketDocs.map(async (t) => {
            const messages = await this.getMessagesForTicket(t.id);
            return {
              ...t,
              messages: messages.length > 0 ? messages : t.messages,
            };
          })
        );
        return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return await this.getFallbackTicketsByBeekeeper(beekeeperUid);
    } catch (err: any) {
      console.warn(`[TicketsRepository] getTicketsByBeekeeper error for ${beekeeperUid}:`, err?.message || err);
      return await this.getFallbackTicketsByBeekeeper(beekeeperUid);
    }
  }

  public async getAllTickets(): Promise<SupportTicket[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackAllTickets();
    }

    try {
      const snapshot = await adminFirestore.collection(this.ticketsCollection).get();
      if (!snapshot.empty) {
        const ticketDocs = snapshot.docs.map((d) => this.mapTicketDoc(d.id, d.data()));
        const tickets = await Promise.all(
          ticketDocs.map(async (t) => {
            const messages = await this.getMessagesForTicket(t.id);
            return {
              ...t,
              messages: messages.length > 0 ? messages : t.messages,
            };
          })
        );
        return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return await this.getFallbackAllTickets();
    } catch (err: any) {
      console.warn('[TicketsRepository] getAllTickets error:', err?.message || err);
      return await this.getFallbackAllTickets();
    }
  }

  public async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    if (!hasAdminCredentials) {
      return await this.getFallbackTicketById(ticketId);
    }

    try {
      const docRef = await adminFirestore.collection(this.ticketsCollection).doc(ticketId).get();
      if (docRef.exists) {
        const t = this.mapTicketDoc(docRef.id, docRef.data());
        const messages = await this.getMessagesForTicket(ticketId);
        return {
          ...t,
          messages: messages.length > 0 ? messages : t.messages,
        };
      }

      const qSnap = await adminFirestore
        .collection(this.ticketsCollection)
        .where('ticketId', '==', ticketId)
        .limit(1)
        .get();

      if (!qSnap.empty) {
        const t = this.mapTicketDoc(qSnap.docs[0].id, qSnap.docs[0].data());
        const messages = await this.getMessagesForTicket(ticketId);
        return {
          ...t,
          messages: messages.length > 0 ? messages : t.messages,
        };
      }

      return await this.getFallbackTicketById(ticketId);
    } catch (err: any) {
      console.warn(`[TicketsRepository] getTicketById error for ${ticketId}:`, err?.message || err);
      return await this.getFallbackTicketById(ticketId);
    }
  }

  public async getMessagesForTicket(ticketId: string): Promise<TicketMessage[]> {
    if (!hasAdminCredentials) {
      return await this.getFallbackMessages(ticketId);
    }

    try {
      const snapshot = await adminFirestore
        .collection(this.messagesCollection)
        .where('ticketId', '==', ticketId)
        .get();

      if (!snapshot.empty) {
        const messages = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.messageId || d.id,
            senderId: data.senderUid || '',
            senderName: data.senderName || '',
            senderRole: (data.senderRole || 'beekeeper') as 'beekeeper' | 'admin',
            timestamp: data.createdAt || new Date().toISOString(),
            message: data.message || '',
          };
        });
        return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }

      return await this.getFallbackMessages(ticketId);
    } catch (err: any) {
      console.warn(`[TicketsRepository] getMessagesForTicket error for ${ticketId}:`, err?.message || err);
      return await this.getFallbackMessages(ticketId);
    }
  }

  public async createTicket(params: {
    ticketId?: string;
    beekeeperUid: string;
    beekeeperId: string;
    beekeeperName: string;
    hiveId?: string;
    alertId?: string;
    title: string;
    description: string;
    category?: string;
    sensorSnapshot?: any;
    healthScore?: number;
    initialMessage?: string;
  }): Promise<SupportTicket> {
    const docId = params.ticketId || `HC-T-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const initialMsg: TicketMessage = {
      id: `MSG-${docId.slice(-4)}-01`,
      senderId: params.beekeeperUid,
      senderName: params.beekeeperName,
      senderRole: 'beekeeper',
      timestamp: now,
      message: params.initialMessage || params.description,
    };

    const newTicket: SupportTicket = {
      id: docId,
      beekeeperId: params.beekeeperId,
      beekeeperName: params.beekeeperName,
      hiveId: params.hiveId,
      alertId: params.alertId,
      title: params.title,
      category: (params.category || 'hive_health') as any,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      prefilledTelemetry: params.sensorSnapshot,
      messages: [initialMsg],
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.ticketsCollection).doc(docId).set({
          id: docId,
          ticketId: docId,
          beekeeperUid: params.beekeeperUid,
          beekeeperId: params.beekeeperId,
          beekeeperName: params.beekeeperName,
          hiveId: params.hiveId || null,
          alertId: params.alertId || null,
          title: params.title,
          description: params.description,
          category: newTicket.category,
          status: newTicket.status,
          sensorSnapshot: params.sensorSnapshot || null,
          healthScore: Number(params.healthScore || 0),
          createdAt: now,
          updatedAt: now,
        }, { merge: true });

        await adminFirestore.collection(this.messagesCollection).doc(initialMsg.id).set({
          id: initialMsg.id,
          messageId: initialMsg.id,
          ticketId: docId,
          senderUid: params.beekeeperUid,
          senderName: params.beekeeperName,
          senderRole: 'beekeeper',
          message: initialMsg.message,
          createdAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[TicketsRepository] createTicket write error for ${docId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      mockDb.tickets.set(docId, newTicket);
    } catch {
      // ignore
    }

    return newTicket;
  }

  public async addTicketMessage(params: {
    ticketId: string;
    senderUid: string;
    senderName: string;
    senderRole: 'beekeeper' | 'admin';
    message: string;
    newStatus?: SupportTicket['status'];
  }): Promise<TicketMessage> {
    const now = new Date().toISOString();
    const messageId = `MSG-${Date.now().toString().slice(-4)}`;

    const newMsg: TicketMessage = {
      id: messageId,
      senderId: params.senderUid,
      senderName: params.senderName,
      senderRole: params.senderRole,
      timestamp: now,
      message: params.message,
    };

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.messagesCollection).doc(messageId).set({
          id: messageId,
          messageId,
          ticketId: params.ticketId,
          senderUid: params.senderUid,
          senderName: params.senderName,
          senderRole: params.senderRole,
          message: params.message,
          createdAt: now,
        }, { merge: true });

        const updateData: Record<string, any> = { updatedAt: now };
        if (params.newStatus) {
          updateData.status = params.newStatus;
        }
        await adminFirestore.collection(this.ticketsCollection).doc(params.ticketId).set(updateData, { merge: true });
      } catch (err: any) {
        console.warn(`[TicketsRepository] addTicketMessage write error:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      const ticket = mockDb.tickets.get(params.ticketId);
      if (ticket) {
        ticket.messages.push(newMsg);
        if (params.newStatus) ticket.status = params.newStatus;
        ticket.updatedAt = now;
        mockDb.tickets.set(params.ticketId, ticket);
      }
    } catch {
      // ignore
    }

    return newMsg;
  }

  public async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (hasAdminCredentials) {
      try {
        await adminFirestore.collection(this.ticketsCollection).doc(ticketId).set({
          status,
          updatedAt: now,
        }, { merge: true });
      } catch (err: any) {
        console.warn(`[TicketsRepository] updateTicketStatus write error for ${ticketId}:`, err?.message || err);
      }
    }

    try {
      const { mockDb } = await import('./mock.db');
      const ticket = mockDb.tickets.get(ticketId);
      if (ticket) {
        ticket.status = status;
        ticket.updatedAt = now;
        mockDb.tickets.set(ticketId, ticket);
      }
    } catch {
      // ignore
    }

    return true;
  }

  private mapTicketDoc(id: string, data: any): SupportTicket {
    return {
      id: data.ticketId || id,
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || '',
      hiveId: data.hiveId || undefined,
      alertId: data.alertId || undefined,
      title: data.title || '',
      category: data.category || 'hive_health',
      status: data.status || 'OPEN',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      prefilledTelemetry: data.sensorSnapshot || undefined,
      messages: [],
    };
  }

  private async getFallbackTicketsByBeekeeper(beekeeperUid: string): Promise<SupportTicket[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreTicketRepository } = await import('../../../src/services/firestore/ticket.repository');
      const docs = await firestoreTicketRepository.getTicketsByBeekeeper(beekeeperUid);
      if (docs && docs.length > 0) return docs;
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.tickets.values()).filter(
      (t) => t.beekeeperId === beekeeperUid || t.beekeeperId.includes(beekeeperUid)
    );
  }

  private async getFallbackAllTickets(): Promise<SupportTicket[]> {
    try {
      const { ensureSystemAdminAuth } = await import('../services/system-auth.service');
      await ensureSystemAdminAuth();
      const { firestoreTicketRepository } = await import('../../../src/services/firestore/ticket.repository');
      const docs = await firestoreTicketRepository.getAllTickets();
      if (docs && docs.length > 0) return docs;
    } catch {
      // ignore
    }

    const { mockDb } = await import('./mock.db');
    return Array.from(mockDb.tickets.values());
  }

  private async getFallbackTicketById(ticketId: string): Promise<SupportTicket | null> {
    const { mockDb } = await import('./mock.db');
    return mockDb.tickets.get(ticketId) || null;
  }

  private async getFallbackMessages(ticketId: string): Promise<TicketMessage[]> {
    const { mockDb } = await import('./mock.db');
    const ticket = mockDb.tickets.get(ticketId);
    return ticket?.messages || [];
  }
}

export const ticketsRepository = new TicketsRepository();

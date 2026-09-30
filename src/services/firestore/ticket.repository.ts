/**
 * Honey Chain - Firestore Support Ticket Repository
 * Manages tickets in `tickets/{ticketId}` and messages in `ticket_messages/{messageId}`
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase.service';
import { FirestoreTicketDoc, FirestoreTicketMessageDoc } from './types';
import { SupportTicket, TicketMessage } from '../../../shared/types';

export class FirestoreTicketRepository {
  private ticketsCollectionName = 'tickets';
  private messagesCollectionName = 'ticket_messages';

  private normalizeTimestamp(val: any): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  public async getTicketsByBeekeeper(beekeeperUid: string): Promise<SupportTicket[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.ticketsCollectionName),
        where('beekeeperUid', '==', beekeeperUid)
      );
      const snapshot = await getDocs(q);
      const ticketDocs = snapshot.docs.map((d) => this.mapTicketDoc(d.id, d.data()));

      // Load messages for each ticket
      const tickets: SupportTicket[] = await Promise.all(
        ticketDocs.map(async (t) => {
          const messages = await this.getMessagesForTicket(t.ticketId);
          return this.toSupportTicket(t, messages);
        })
      );

      return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreTicketRepository.getTicketsByBeekeeper error:', error);
      return [];
    }
  }

  public async getAllTickets(): Promise<SupportTicket[]> {
    if (!db) return [];
    try {
      const snapshot = await getDocs(collection(db, this.ticketsCollectionName));
      const ticketDocs = snapshot.docs.map((d) => this.mapTicketDoc(d.id, d.data()));

      const tickets: SupportTicket[] = await Promise.all(
        ticketDocs.map(async (t) => {
          const messages = await this.getMessagesForTicket(t.ticketId);
          return this.toSupportTicket(t, messages);
        })
      );

      return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('FirestoreTicketRepository.getAllTickets error:', error);
      return [];
    }
  }

  public async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    if (!db) return null;
    try {
      const ref = doc(db, this.ticketsCollectionName, ticketId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;
      const t = this.mapTicketDoc(snapshot.id, snapshot.data());
      const messages = await this.getMessagesForTicket(ticketId);
      return this.toSupportTicket(t, messages);
    } catch (error) {
      console.warn(`FirestoreTicketRepository.getTicketById error for ${ticketId}:`, error);
      return null;
    }
  }

  public async getMessagesForTicket(ticketId: string): Promise<TicketMessage[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, this.messagesCollectionName),
        where('ticketId', '==', ticketId)
      );
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.messageId || d.id,
          senderId: data.senderUid || '',
          senderName: data.senderName || '',
          senderRole: (data.senderRole || 'beekeeper') as 'beekeeper' | 'admin',
          timestamp: this.normalizeTimestamp(data.createdAt),
          message: data.message || '',
        };
      });

      return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.warn(`FirestoreTicketRepository.getMessagesForTicket error for ${ticketId}:`, error);
      return [];
    }
  }

  public async createTicket(params: {
    ticket: Omit<FirestoreTicketDoc, 'createdAt' | 'updatedAt'>;
    initialMessage?: string;
    senderUid: string;
    senderName: string;
    senderRole?: 'beekeeper' | 'admin';
  }): Promise<SupportTicket> {
    const now = new Date().toISOString();
    const ticketId = params.ticket.ticketId || params.ticket.id;

    if (!db) {
      const initialMsg: TicketMessage = {
        id: `MSG-${Date.now().toString().slice(-4)}`,
        senderId: params.senderUid,
        senderName: params.senderName,
        senderRole: params.senderRole || 'beekeeper',
        timestamp: now,
        message: params.initialMessage || params.ticket.description,
      };

      return {
        id: ticketId,
        beekeeperId: params.ticket.beekeeperId,
        beekeeperName: params.ticket.beekeeperName,
        hiveId: params.ticket.hiveId,
        alertId: params.ticket.alertId,
        title: params.ticket.title,
        category: params.ticket.category,
        status: params.ticket.status,
        createdAt: now,
        updatedAt: now,
        prefilledTelemetry: params.ticket.sensorSnapshot,
        messages: [initialMsg],
      };
    }

    // 1. Create Ticket Doc
    const ticketRef = doc(db, this.ticketsCollectionName, ticketId);
    const ticketPayload = {
      id: ticketId,
      ticketId,
      beekeeperUid: params.ticket.beekeeperUid,
      beekeeperId: params.ticket.beekeeperId,
      beekeeperName: params.ticket.beekeeperName,
      hiveId: params.ticket.hiveId || null,
      alertId: params.ticket.alertId || null,
      title: params.ticket.title,
      description: params.ticket.description,
      category: params.ticket.category,
      status: params.ticket.status,
      sensorSnapshot: params.ticket.sensorSnapshot || null,
      healthScore: Number(params.ticket.healthScore || 0),
      timestamp: params.ticket.timestamp || now,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(ticketRef, ticketPayload, { merge: true });
    } catch (ticketErr) {
      console.warn(`FirestoreTicketRepository.createTicket error for ${ticketId}:`, ticketErr);
    }

    // 2. Create Initial Message in ticket_messages
    const messageId = `MSG-${ticketId.slice(-4)}-01`;
    const messageRef = doc(db, this.messagesCollectionName, messageId);
    const msgText = params.initialMessage || params.ticket.description;
    const messagePayload = {
      id: messageId,
      messageId,
      ticketId,
      senderUid: params.senderUid,
      senderName: params.senderName,
      senderRole: params.senderRole || 'beekeeper',
      message: msgText,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(messageRef, messagePayload, { merge: true });
    } catch (msgErr) {
      console.warn(`FirestoreTicketRepository initial message error for ${messageId}:`, msgErr);
    }

    const createdMsg: TicketMessage = {
      id: messageId,
      senderId: params.senderUid,
      senderName: params.senderName,
      senderRole: params.senderRole || 'beekeeper',
      timestamp: now,
      message: msgText,
    };

    return {
      id: ticketId,
      beekeeperId: params.ticket.beekeeperId,
      beekeeperName: params.ticket.beekeeperName,
      hiveId: params.ticket.hiveId,
      alertId: params.ticket.alertId,
      title: params.ticket.title,
      category: params.ticket.category,
      status: params.ticket.status,
      createdAt: now,
      updatedAt: now,
      prefilledTelemetry: params.ticket.sensorSnapshot,
      messages: [createdMsg],
    };
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

    if (!db) return newMsg;

    // 1. Write message to ticket_messages/{messageId}
    const messageRef = doc(db, this.messagesCollectionName, messageId);
    const messagePayload = {
      id: messageId,
      messageId,
      ticketId: params.ticketId,
      senderUid: params.senderUid,
      senderName: params.senderName,
      senderRole: params.senderRole,
      message: params.message,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(messageRef, messagePayload);
    } catch (err) {
      console.warn(`FirestoreTicketRepository.addTicketMessage write error:`, err);
    }

    // 2. Update ticket document
    try {
      const ticketRef = doc(db, this.ticketsCollectionName, params.ticketId);
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      if (params.newStatus) {
        updateData.status = params.newStatus;
      }
      await updateDoc(ticketRef, updateData);
    } catch (err) {
      console.warn(`FirestoreTicketRepository.addTicketMessage ticket update error:`, err);
    }

    return newMsg;
  }

  public async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<boolean> {
    if (!db) return true;
    try {
      const ticketRef = doc(db, this.ticketsCollectionName, ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.warn(`FirestoreTicketRepository.updateTicketStatus error for ${ticketId}:`, error);
      return false;
    }
  }

  private mapTicketDoc(id: string, data: any): FirestoreTicketDoc {
    return {
      id,
      ticketId: data.ticketId || id,
      beekeeperUid: data.beekeeperUid || '',
      beekeeperId: data.beekeeperId || '',
      beekeeperName: data.beekeeperName || '',
      hiveId: data.hiveId || undefined,
      alertId: data.alertId || undefined,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'hive_health',
      status: data.status || 'OPEN',
      sensorSnapshot: data.sensorSnapshot || undefined,
      healthScore: Number(data.healthScore || 0),
      timestamp: this.normalizeTimestamp(data.timestamp),
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
    };
  }

  private toSupportTicket(doc: FirestoreTicketDoc, messages: TicketMessage[]): SupportTicket {
    return {
      id: doc.ticketId,
      beekeeperId: doc.beekeeperId,
      beekeeperName: doc.beekeeperName,
      hiveId: doc.hiveId,
      alertId: doc.alertId,
      title: doc.title,
      category: doc.category,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      prefilledTelemetry: doc.sensorSnapshot,
      messages: messages.length > 0 ? messages : [
        {
          id: `MSG-${doc.ticketId.slice(-4)}-01`,
          senderId: doc.beekeeperUid,
          senderName: doc.beekeeperName,
          senderRole: 'beekeeper',
          timestamp: doc.createdAt,
          message: doc.description,
        },
      ],
    };
  }
}

export const firestoreTicketRepository = new FirestoreTicketRepository();

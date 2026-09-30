/**
 * Firestore Repository Adapter (Future Production Target)
 * 
 * In Demo Mode (DEMO_MODE=true), the system uses MockDatabase from './mock.db'.
 * When Antigravity provisions Firestore credentials, implement these repository methods
 * using @google-cloud/firestore or firebase/firestore.
 */

import { HoneyBatch, Hive, SupportTicket, LearningContent, BeekeeperProfile } from '../../../shared/types';

export interface IFirestoreRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, any>): Promise<T[]>;
  create(data: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export class FirestoreBatchRepository implements IFirestoreRepository<HoneyBatch> {
  // TODO: Initialize Firestore collection reference:
  // private collection = getFirestore().collection('honey_batches');

  async findById(_id: string): Promise<HoneyBatch | null> {
    // TODO: const doc = await this.collection.doc(_id).get(); return doc.data() as HoneyBatch;
    throw new Error('Firestore not initialized. Enable DEMO_MODE=true to run prototype.');
  }

  async findAll(_filter?: Record<string, any>): Promise<HoneyBatch[]> {
    throw new Error('Firestore not initialized.');
  }

  async create(_data: HoneyBatch): Promise<HoneyBatch> {
    throw new Error('Firestore not initialized.');
  }

  async update(_id: string, _data: Partial<HoneyBatch>): Promise<HoneyBatch> {
    throw new Error('Firestore not initialized.');
  }

  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore not initialized.');
  }
}

export class FirestoreHiveRepository implements IFirestoreRepository<Hive> {
  async findById(_id: string): Promise<Hive | null> { throw new Error('Firestore not initialized.'); }
  async findAll(_filter?: Record<string, any>): Promise<Hive[]> { throw new Error('Firestore not initialized.'); }
  async create(_data: Hive): Promise<Hive> { throw new Error('Firestore not initialized.'); }
  async update(_id: string, _data: Partial<Hive>): Promise<Hive> { throw new Error('Firestore not initialized.'); }
  async delete(_id: string): Promise<boolean> { throw new Error('Firestore not initialized.'); }
}

export class FirestoreTicketRepository implements IFirestoreRepository<SupportTicket> {
  async findById(_id: string): Promise<SupportTicket | null> { throw new Error('Firestore not initialized.'); }
  async findAll(_filter?: Record<string, any>): Promise<SupportTicket[]> { throw new Error('Firestore not initialized.'); }
  async create(_data: SupportTicket): Promise<SupportTicket> { throw new Error('Firestore not initialized.'); }
  async update(_id: string, _data: Partial<SupportTicket>): Promise<SupportTicket> { throw new Error('Firestore not initialized.'); }
  async delete(_id: string): Promise<boolean> { throw new Error('Firestore not initialized.'); }
}

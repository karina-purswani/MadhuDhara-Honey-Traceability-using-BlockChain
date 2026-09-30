/**
 * Admin Service
 * Business logic for institutional admin operations and system oversight.
 */

import { adminRepository } from '../repositories/admin.repository';
import { AdminSystemStats } from '../types/admin.types';

export class AdminService {
  /**
   * Retrieves aggregate system statistics for the Admin dashboard.
   */
  public async getSystemStats(): Promise<AdminSystemStats> {
    return await adminRepository.getSystemStats();
  }
}

export const adminService = new AdminService();

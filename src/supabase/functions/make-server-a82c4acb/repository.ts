// Database Repository Layer
// Handles all data access operations using the KV store

import * as kv from './kv_store.ts';
import { 
  Project, 
  MRVData, 
  MLVerification, 
  CreditRetirement, 
  PublicStats,
  User,
  CarbonCredit,
  CreditTransaction
} from './models.ts';

export class DatabaseRepository {
  // Project operations
  static async createProject(project: Project): Promise<void> {
    await kv.set(project.id, project);
  }

  static async getProject(projectId: string): Promise<Project | null> {
    const result = await kv.get(projectId);
    return result?.value || null;
  }

  static async getProjectsByManager(managerId: string): Promise<Project[]> {
    const allProjects = await kv.getByPrefix('project_');
    return allProjects
      .filter(p => p.value && p.value.managerId === managerId)
      .map(p => p.value);
  }

  static async getAllProjects(): Promise<Project[]> {
    const allProjects = await kv.getByPrefix('project_');
    return allProjects.map(p => p.value);
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const existing = await this.getProject(projectId);
    if (existing) {
      await kv.set(projectId, { ...existing, ...updates });
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    await kv.del(projectId);
  }

  // MRV operations
  static async createMRVData(mrvData: MRVData): Promise<void> {
    await kv.set(mrvData.id, mrvData);
  }

  static async getMRVData(mrvId: string): Promise<MRVData | null> {
    const result = await kv.get(mrvId);
    return result?.value || null;
  }

  static async getPendingMRV(): Promise<MRVData[]> {
    const allMrv = await kv.getByPrefix('mrv_');
    return allMrv
      .map(m => m.value)
      .filter(mrv => mrv.status === 'pending_ml_processing' || mrv.status === 'pending_verification');
  }

  static async getApprovedMRV(): Promise<MRVData[]> {
    const allMrv = await kv.getByPrefix('mrv_');
    return allMrv
      .map(m => m.value)
      .filter(mrv => mrv.status === 'approved');
  }

  static async updateMRVData(mrvId: string, updates: Partial<MRVData>): Promise<void> {
    const existing = await this.getMRVData(mrvId);
    if (existing) {
      await kv.set(mrvId, { ...existing, ...updates });
    }
  }

  // Carbon Credit operations
  static async createCarbonCredit(credit: CarbonCredit): Promise<void> {
    await kv.set(`credit_${credit.id}`, credit);
  }

  static async getCarbonCredit(creditId: string): Promise<CarbonCredit | null> {
    const result = await kv.get(`credit_${creditId}`);
    return result?.value || null;
  }

  static async updateCarbonCredit(creditId: string, updates: Partial<CarbonCredit>): Promise<void> {
    const existing = await this.getCarbonCredit(creditId);
    if (existing) {
      await kv.set(`credit_${creditId}`, { ...existing, ...updates });
    }
  }

  static async getAvailableCredits(): Promise<CarbonCredit[]> {
    const allCredits = await kv.getByPrefix('credit_');
    return allCredits
      .map(c => c.value)
      .filter(credit => !credit.isRetired && !credit.ownerId);
  }

  static async getBuyerCredits(buyerId: string): Promise<CarbonCredit[]> {
    const allCredits = await kv.getByPrefix('credit_');
    return allCredits
      .map(c => c.value)
      .filter(credit => credit.ownerId === buyerId && !credit.isRetired);
  }

  static async retireCredit(creditId: string, buyerId: string, reason: string): Promise<void> {
    const credit = await this.getCarbonCredit(creditId);
    if (!credit) {
      throw new Error('Credit not found');
    }
    
    if (credit.ownerId !== buyerId) {
      throw new Error('Access denied: You can only retire credits you own');
    }
    
    if (credit.isRetired) {
      throw new Error('Credit has already been retired');
    }
    
    await this.updateCarbonCredit(creditId, {
      isRetired: true,
      retiredBy: buyerId,
      retiredAt: new Date().toISOString(),
      retirementReason: reason
    });
  }

  static async purchaseCredit(creditId: string, buyerId: string, paymentId: string): Promise<void> {
    const credit = await this.getCarbonCredit(creditId);
    if (!credit) {
      throw new Error('Credit not found');
    }
    
    if (credit.ownerId) {
      throw new Error('Credit has already been purchased');
    }
    
    if (credit.isRetired) {
      throw new Error('Credit has been retired and is no longer available');
    }
    
    // Update credit ownership
    await this.updateCarbonCredit(creditId, {
      ownerId: buyerId,
      paymentConfirmationId: paymentId
    });
    
    const transaction: CreditTransaction = {
      id: this.generateId('tx'),
      creditId,
      userId: buyerId,
      paymentId,
      quantity: credit.amount,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    await this.createCreditTransaction(transaction);
  }

  static async getCreditById(creditId: string): Promise<CarbonCredit | null> {
    // Implement logic to retrieve a single credit by ID
    const result = await kv.get(`credit_${creditId}`);
    return result?.value || null;
  }

  static async createCreditTransaction(transaction: CreditTransaction): Promise<void> {
    await kv.set(transaction.id, transaction);
  }

  // ML Verification operations
  static async createMLVerification(verification: MLVerification): Promise<void> {
    await kv.set(`ml_verification_${verification.projectId}`, verification);
  }

  static async getMLVerification(projectId: string): Promise<MLVerification | null> {
    const result = await kv.get(`ml_verification_${projectId}`);
    return result?.value || null;
  }

  // Credit retirement operations
  static async createRetirement(retirement: CreditRetirement): Promise<void> {
    await kv.set(retirement.id, retirement);
  }

  // Stats operations
  static async getTotalCreditsIssued(): Promise<number> {
    const result = await kv.get('total_credits_issued');
    return result?.value || 0;
  }

  static async setTotalCreditsIssued(total: number): Promise<void> {
    await kv.set('total_credits_issued', total);
  }

  static async incrementCreditsIssued(amount: number): Promise<void> {
    const current = await this.getTotalCreditsIssued();
    await this.setTotalCreditsIssued(current + amount);
  }

  static async getTotalCreditsRetired(): Promise<number> {
    const result = await kv.get('total_credits_retired');
    return result?.value || 0;
  }

  static async setTotalCreditsRetired(total: number): Promise<void> {
    await kv.set('total_credits_retired', total);
  }

  static async incrementCreditsRetired(amount: number): Promise<void> {
    const current = await this.getTotalCreditsRetired();
    await this.setTotalCreditsRetired(current + amount);
  }

  static async getPublicStats(): Promise<PublicStats> {
    const [totalCreditsIssued, totalCreditsRetired, projects] = await Promise.all([
      this.getTotalCreditsIssued(),
      this.getTotalCreditsRetired(),
      this.getAllProjects()
    ]);

    return {
      totalCreditsIssued,
      totalCreditsRetired,
      totalProjects: projects.length,
      projects
    };
  }

  // Utility methods
  static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateTxHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }
}
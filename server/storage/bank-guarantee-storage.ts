import { BaseStorage } from './base-storage';
import type { BankGuarantee, InsertBankGuarantee } from '@shared/schema';

/**
 * Storage для работы с банковскими гарантиями
 */
export class BankGuaranteeStorage extends BaseStorage {

  async getBankGuarantees(filters?: {
    status?: string;
    customerId?: number;
    contractorId?: number;
    tenderId?: number;
  }): Promise<BankGuarantee[]> {
    let query = `SELECT * FROM bank_guarantees WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.customerId) {
      query += ` AND customer_id = ?`;
      params.push(filters.customerId);
    }

    if (filters?.contractorId) {
      query += ` AND contractor_id = ?`;
      params.push(filters.contractorId);
    }

    if (filters?.tenderId) {
      query += ` AND tender_id = ?`;
      params.push(filters.tenderId);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = this.getMany<any>(query, params);
    return rows.map(row => this.transformFromDb(row));
  }

  async getBankGuarantee(id: number): Promise<BankGuarantee | undefined> {
    const query = `SELECT * FROM bank_guarantees WHERE id = ?`;
    const row = this.getOne<any>(query, [id]);
    return row ? this.transformFromDb(row) : undefined;
  }

  async createBankGuarantee(guarantee: InsertBankGuarantee): Promise<BankGuarantee> {
    const now = this.now();
    
    const query = `
      INSERT INTO bank_guarantees (
        customer_id, contractor_id, tender_id, amount, start_date, 
        end_date, status, bank_name, guarantee_number, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = this.executeQuery(query, [
      guarantee.customerId,
      guarantee.contractorId,
      guarantee.tenderId || null,
      guarantee.amount,
      guarantee.startDate,
      guarantee.endDate,
      guarantee.status || 'pending',
      guarantee.bankName,
      guarantee.guaranteeNumber,
      now,
      now
    ]);

    const newGuarantee = this.getOne<any>(
      `SELECT * FROM bank_guarantees WHERE id = ?`, 
      [Number(result.lastInsertRowid)]
    );
    
    if (!newGuarantee) {
      throw new Error('Failed to retrieve created bank guarantee');
    }
    
    return this.transformFromDb(newGuarantee);
  }

  async updateBankGuaranteeStatus(id: number, status: string): Promise<BankGuarantee | undefined> {
    const query = `
      UPDATE bank_guarantees 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `;
    
    this.executeQuery(query, [status, this.now(), id]);

    const updatedGuarantee = this.getOne<any>(`SELECT * FROM bank_guarantees WHERE id = ?`, [id]);
    return updatedGuarantee ? this.transformFromDb(updatedGuarantee) : undefined;
  }

  async getGuaranteesByCustomer(customerId: number): Promise<BankGuarantee[]> {
    const query = `
      SELECT * FROM bank_guarantees 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `;
    
    const rows = this.getMany<any>(query, [customerId]);
    return rows.map(row => this.transformFromDb(row));
  }

  async getGuaranteesByContractor(contractorId: number): Promise<BankGuarantee[]> {
    const query = `
      SELECT * FROM bank_guarantees 
      WHERE contractor_id = ? 
      ORDER BY created_at DESC
    `;
    
    const rows = this.getMany<any>(query, [contractorId]);
    return rows.map(row => this.transformFromDb(row));
  }

  async getActiveGuarantees(): Promise<BankGuarantee[]> {
    const query = `
      SELECT * FROM bank_guarantees 
      WHERE status = 'active' 
        AND end_date > datetime('now')
      ORDER BY end_date ASC
    `;
    
    const rows = this.getMany<any>(query);
    return rows.map(row => this.transformFromDb(row));
  }

  async getExpiringGuarantees(daysAhead: number = 30): Promise<BankGuarantee[]> {
    const query = `
      SELECT * FROM bank_guarantees 
      WHERE status = 'active' 
        AND end_date <= datetime('now', '+' || ? || ' days')
        AND end_date > datetime('now')
      ORDER BY end_date ASC
    `;
    
    const rows = this.getMany<any>(query, [daysAhead]);
    return rows.map(row => this.transformFromDb(row));
  }

  /**
   * Преобразование записи из базы данных в объект BankGuarantee
   */
  private transformFromDb(row: any): BankGuarantee {
    return {
      id: row.id,
      customerId: row.customer_id,
      contractorId: row.contractor_id,
      tenderId: row.tender_id,
      amount: row.amount,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      bankName: row.bank_name,
      guaranteeNumber: row.guarantee_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Автоматическое истечение гарантий
   */
  async expireOverdueGuarantees(): Promise<number> {
    const query = `
      UPDATE bank_guarantees 
      SET status = 'expired', updated_at = ?
      WHERE status = 'active' 
        AND end_date < datetime('now')
    `;
    
    const result = this.executeQuery(query, [this.now()]);
    return result.changes || 0;
  }

  /**
   * Проверка существования активной гарантии для тендера
   */
  async hasActiveGuaranteeForTender(tenderId: number, contractorId: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM bank_guarantees 
      WHERE tender_id = ? 
        AND contractor_id = ? 
        AND status = 'active'
        AND end_date > datetime('now')
      LIMIT 1
    `;
    
    return this.exists('bank_guarantees', 'tender_id = ? AND contractor_id = ? AND status = \'active\' AND end_date > datetime(\'now\')', [tenderId, contractorId]);
  }
}
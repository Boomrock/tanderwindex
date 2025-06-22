import { sqliteDb } from '../db-sqlite';
import type { RunResult } from 'better-sqlite3';

/**
 * Базовый класс для всех storage операций
 * Предоставляет общие утилиты для работы с SQLite
 */
export abstract class BaseStorage {
  protected db = sqliteDb;

  /**
   * Утилиты для работы с JSON данными
   */
  protected parseJsonArray(json: string | null): string[] {
    if (!json) return [];
    
    try {
      if (Array.isArray(json)) return json;
      
      if (typeof json === 'string') {
        const trimmed = json.trim();
        
        if (trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }
        
        if (this.isUrl(trimmed)) {
          return [trimmed];
        }
        
        return JSON.parse(trimmed);
      }
      
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      
      if (typeof json === 'string' && this.isUrl(json)) {
        return [json];
      }
      
      return [];
    }
  }

  private isUrl(str: string): boolean {
    return str.includes('http') || str.includes('www');
  }

  protected stringifyJson(data: unknown): string {
    return JSON.stringify(data || []);
  }

  /**
   * Утилиты для работы с временными метками
   */
  protected now(): string {
    return new Date().toISOString();
  }

  /**
   * Утилиты для работы с базой данных
   */
  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Построение UPDATE запроса с правильной обработкой полей
   */
  protected buildUpdateQuery(tableName: string, data: Record<string, unknown>): { 
    query: string; 
    values: unknown[] 
  } {
    const fields = Object.keys(data);
    const setClause = fields.map(key => `${this.camelToSnake(key)} = ?`).join(', ');
    const query = `UPDATE ${tableName} SET ${setClause}, updated_at = ? WHERE id = ?`;
    const values = [...Object.values(data), this.now()];
    return { query, values };
  }

  /**
   * Выполнение подготовленного запроса с обработкой ошибок
   */
  protected executeQuery(query: string, params: unknown[] = []): RunResult {
    try {
      const stmt = this.db.prepare(query);
      return stmt.run(...params);
    } catch (error) {
      console.error('Query execution error:', { query, params, error });
      throw error;
    }
  }

  /**
   * Получение одной записи
   */
  protected getOne<T>(query: string, params: unknown[] = []): T | undefined {
    try {
      const stmt = this.db.prepare(query);
      return stmt.get(...params) as T;
    } catch (error) {
      console.error('Get one query error:', { query, params, error });
      throw error;
    }
  }

  /**
   * Получение множества записей
   */
  protected getMany<T>(query: string, params: unknown[] = []): T[] {
    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params) as T[];
    } catch (error) {
      console.error('Get many query error:', { query, params, error });
      throw error;
    }
  }

  /**
   * Проверка существования записи
   */
  protected exists(table: string, condition: string, params: unknown[] = []): boolean {
    const query = `SELECT 1 FROM ${table} WHERE ${condition} LIMIT 1`;
    const result = this.getOne(query, params);
    return !!result;
  }

  /**
   * Преобразование полей из snake_case в camelCase
   */
  protected transformFields<T>(obj: Record<string, unknown>): T {
    const transformed: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.snakeToCamel(key);
      transformed[camelKey] = value;
    }
    
    return transformed as T;
  }

  /**
   * Обработка массивов JSON для возврата
   */
  protected processJsonFields<T extends Record<string, unknown>>(
    obj: T,
    jsonFields: string[]
  ): T {
    const processed = { ...obj };
    
    for (const field of jsonFields) {
      if (processed[field]) {
        processed[field] = this.parseJsonArray(processed[field] as string) as unknown as T[string];
      }
    }
    
    return processed;
  }
}
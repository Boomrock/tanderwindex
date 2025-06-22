import { db } from '../db-simple';
import { sqliteDb } from '../db-simple';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import { join } from 'path';

export async function addAdminField() {
  console.log('Checking if is_admin column exists in users table...');
  
  try {
    // Проверяем, существует ли уже колонка is_admin
    const tableInfo = sqliteDb.prepare('PRAGMA table_info(users)').all();
    
    const columnExists = tableInfo.some((column: any) => column.name === 'is_admin');
    
    if (!columnExists) {
      // Добавляем колонку is_admin, если она не существует
      sqliteDb.prepare('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0').run();
      console.log('Column is_admin added successfully');
    } else {
      console.log('Column is_admin already exists');
    }
    
  } catch (error) {
    console.error('Error adding is_admin column:', error);
    throw error;
  }
}
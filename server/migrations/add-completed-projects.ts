import { db } from '../db-simple';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import { join } from 'path';

export async function addCompletedProjectsColumn() {
  console.log('Adding completed_projects column to users table...');
  
  try {
    // Получаем прямой доступ к SQLite для выполнения SQL-запросов
    // Лучше получить его из db-simple.ts, но для простоты создаем новое подключение
    const dataDir = join(process.cwd(), 'data');
    const sqlite = new Database(join(dataDir, 'construction-platform.db'));
    
    // Проверяем, существует ли уже колонка completed_projects
    const tableInfo = sqlite.prepare('PRAGMA table_info(users)').all();
    
    const columnExists = tableInfo.some((column: any) => column.name === 'completed_projects');
    
    if (!columnExists) {
      // Добавляем колонку completed_projects, если она не существует
      sqlite.prepare('ALTER TABLE users ADD COLUMN completed_projects INTEGER DEFAULT 0').run();
      console.log('Column completed_projects added successfully');
    } else {
      console.log('Column completed_projects already exists');
    }
    
    // Закрываем подключение
    sqlite.close();
  } catch (error) {
    console.error('Error adding completed_projects column:', error);
    throw error;
  }
}
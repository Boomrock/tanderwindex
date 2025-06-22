import { sqliteDb } from '../db-simple';

export async function addDocumentsField() {
  console.log('Checking if documents column exists in tender_bids table...');
  
  try {
    // Проверяем, существует ли уже колонка documents
    const tableInfo = sqliteDb.prepare('PRAGMA table_info(tender_bids)').all();
    
    const columnExists = tableInfo.some((column: any) => column.name === 'documents');
    
    if (!columnExists) {
      // Добавляем колонку documents, если она не существует
      sqliteDb.prepare('ALTER TABLE tender_bids ADD COLUMN documents TEXT').run();
      console.log('Column documents added successfully');
    } else {
      console.log('Column documents already exists');
    }
    
  } catch (error) {
    console.error('Error adding documents column:', error);
    throw error;
  }
}
import { sqliteDb } from './db-simple';

// Скрипт для исправления прав администратора
function fixAdminRights() {
  console.log('Обновление прав администратора...');
  
  try {
    const updateStmt = sqliteDb.prepare('UPDATE users SET is_admin = 1 WHERE username = ?');
    const result = updateStmt.run('admin');
    
    if (result.changes > 0) {
      console.log('Права администратора успешно обновлены');
    } else {
      console.log('Пользователь admin не найден');
    }
  } catch (error) {
    console.error('Ошибка при обновлении прав администратора:', error);
  }
}

fixAdminRights();
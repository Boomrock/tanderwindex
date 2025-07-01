import { simpleSqliteStorage } from './sqlite-storage-simple';
import { sqliteDb } from './db-simple';

/**
 * Скрипт для пересчета всех пользовательских рейтингов на основе отзывов
 */
async function recalculateAllRatings() {
  console.log('Начинаем пересчет всех рейтингов пользователей...');
  
  try {
    // Получаем всех пользователей
    const stmt = sqliteDb.prepare('SELECT id FROM users');
    const users = stmt.all();
    
    let updatedCount = 0;
    
    for (const user of users as any[]) {
      const userId = user.id;
      
      // Пересчитываем рейтинг для каждого пользователя
      const newRating = await simpleSqliteStorage.updateUserRating(userId);
      console.log(`Пользователь ${userId}: новый рейтинг ${newRating}`);
      updatedCount++;
    }
    
    console.log(`✅ Успешно обновлены рейтинги для ${updatedCount} пользователей`);
  } catch (error) {
    console.error('❌ Ошибка при пересчете рейтингов:', error);
  }
}

// Запускаем скрипт
recalculateAllRatings();
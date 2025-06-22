import { sqliteDb } from "./db-simple";
import bcrypt from 'bcryptjs';

/**
 * Скрипт для создания администратора в системе
 * Запускается через: npx tsx server/create-admin.ts
 */
async function createAdmin() {
  const username = 'admin';
  const password = 'admin123'; // В реальном проекте использовать сильный пароль
  const email = 'admin@stroytender.ru';
  const fullName = 'Администратор';
  
  try {
    // Проверяем, существует ли пользователь
    const checkUserStmt = sqliteDb.prepare(
      `SELECT * FROM users WHERE username = ?`
    );
    const existingUser = checkUserStmt.get(username);
    
    if (existingUser) {
      console.log('Пользователь admin уже существует');
      
      // Проверяем, является ли пользователь администратором
      if (existingUser.isAdmin) {
        console.log('Пользователь admin уже имеет права администратора');
      } else {
        // Обновляем права до администратора
        const updateStmt = sqliteDb.prepare(
          `UPDATE users SET isAdmin = 1 WHERE id = ?`
        );
        updateStmt.run(existingUser.id);
        console.log('Права администратора успешно добавлены пользователю admin');
      }
      
      return;
    }
    
    // Хешируем пароль
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    // Создаем пользователя
    const now = new Date().toISOString();
    const insertUserStmt = sqliteDb.prepare(`
      INSERT INTO users (
        username, password, email, firstName, user_type, isVerified, isAdmin,
        rating, completedProjects, walletBalance, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const userId = insertUserStmt.run(
      username,
      hashedPassword,
      email, 
      fullName,
      'individual',  // тип пользователя
      1,             // is_verified (верифицирован)
      1,             // is_admin (администратор)
      5,             // рейтинг
      0,             // завершенных проектов
      0,             // баланс кошелька
      now,           // created_at
      now            // updated_at
    ).lastInsertRowid;
    
    console.log(`Администратор создан успешно с ID: ${userId}`);
    console.log('Логин: admin');
    console.log('Пароль: admin123');
    
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  }
}

createAdmin().catch(console.error);
import { sqliteDb } from './db-simple';
import bcrypt from 'bcryptjs';

// Функция для хэширования пароля
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function seedTopSpecialists() {
  console.log('Seeding top specialists...');
  
  try {
    // Проверяем, не добавлены ли уже тестовые пользователи
    const existingUsers = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (existingUsers.count > 10) {
      console.log('Top specialists data already exists');
      return;
    }
    
    // Подготавливаем запрос на вставку пользователя
    const insertUserStmt = sqliteDb.prepare(`
      INSERT INTO users (
        username, password, email, firstName, lastName, user_type, rating, 
        completedProjects, isVerified, inn, website, walletBalance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Тестовые данные для физических лиц - мастеров
    const individuals = [
      {
        username: 'master_ivan',
        password: await hashPassword('password123'),
        email: 'ivan@example.com',
        firstName: 'Иван',
        lastName: 'Иванов',
        userType: 'individual',
        rating: 5,
        completedProjects: 48,
        isVerified: 1, // для SQLite используем 1 вместо true
        inn: '123456789012',
        website: null,
        walletBalance: 0
      },
      {
        username: 'master_elena',
        password: await hashPassword('password123'),
        email: 'elena@example.com',
        firstName: 'Елена',
        lastName: 'Смирнова',
        userType: 'individual',
        rating: 5,
        completedProjects: 52,
        isVerified: 1,
        inn: '123456789013',
        website: null,
        walletBalance: 0
      },
      {
        username: 'master_sergey',
        password: await hashPassword('password123'),
        email: 'sergey@example.com',
        firstName: 'Сергей',
        lastName: 'Петров',
        userType: 'individual',
        rating: 4,
        completedProjects: 37,
        isVerified: 1,
        inn: '123456789014',
        website: null,
        walletBalance: 0
      },
      {
        username: 'master_olga',
        password: await hashPassword('password123'),
        email: 'olga@example.com',
        firstName: 'Ольга',
        lastName: 'Николаева',
        userType: 'individual',
        rating: 4,
        completedProjects: 28,
        isVerified: 1,
        inn: '123456789015',
        website: null,
        walletBalance: 0
      },
      {
        username: 'master_dmitry',
        password: await hashPassword('password123'),
        email: 'dmitry@example.com',
        firstName: 'Дмитрий',
        lastName: 'Кузнецов',
        userType: 'individual',
        rating: 5,
        completedProjects: 42,
        isVerified: 1,
        inn: '123456789016',
        website: null,
        walletBalance: 0
      }
    ];
    
    // Тестовые данные для юридических лиц - компаний
    const companies = [
      {
        username: 'stroybest',
        password: await hashPassword('password123'),
        email: 'info@stroybest.ru',
        firstName: 'ООО',
        lastName: 'СтройБест',
        userType: 'company',
        rating: 5,
        completedProjects: 123,
        isVerified: 1,
        inn: '7701234567',
        website: 'https://stroybest.ru',
        walletBalance: 0
      },
      {
        username: 'designpro',
        password: await hashPassword('password123'),
        email: 'info@designpro.ru',
        firstName: 'ООО',
        lastName: 'ДизайнПро',
        userType: 'company',
        rating: 5,
        completedProjects: 87,
        isVerified: 1,
        inn: '7701234568',
        website: 'https://designpro.ru',
        walletBalance: 0
      },
      {
        username: 'remstroi',
        password: await hashPassword('password123'),
        email: 'info@remstroi.ru',
        firstName: 'ООО',
        lastName: 'РемСтрой',
        userType: 'company',
        rating: 4,
        completedProjects: 56,
        isVerified: 1,
        inn: '7701234569',
        website: 'https://remstroi.ru',
        walletBalance: 0
      },
      {
        username: 'architekton',
        password: await hashPassword('password123'),
        email: 'info@architekton.ru',
        firstName: 'ООО',
        lastName: 'Архитектон',
        userType: 'company',
        rating: 5,
        completedProjects: 34,
        isVerified: 1,
        inn: '7701234570',
        website: 'https://architekton.ru',
        walletBalance: 0
      },
      {
        username: 'stroigrad',
        password: await hashPassword('password123'),
        email: 'info@stroigrad.ru',
        firstName: 'ООО',
        lastName: 'СтройГрад',
        userType: 'company',
        rating: 4,
        completedProjects: 29,
        isVerified: 1,
        inn: '7701234571',
        website: 'https://stroigrad.ru',
        walletBalance: 0
      }
    ];
    
    // Добавляем физических лиц
    for (const individual of individuals) {
      try {
        insertUserStmt.run(
          individual.username,
          individual.password,
          individual.email,
          individual.firstName,
          individual.lastName,
          individual.userType,
          individual.rating,
          individual.completedProjects,
          individual.isVerified,
          individual.inn,
          individual.website,
          individual.walletBalance
        );
        console.log(`Добавлен специалист: ${individual.firstName} ${individual.lastName}`);
      } catch (error) {
        console.error(`Ошибка при добавлении специалиста ${individual.firstName} ${individual.lastName}:`, error);
      }
    }
    
    // Добавляем юридические лица
    for (const company of companies) {
      try {
        insertUserStmt.run(
          company.username,
          company.password,
          company.email,
          company.firstName,
          company.lastName,
          company.userType,
          company.rating,
          company.completedProjects,
          company.isVerified,
          company.inn,
          company.website,
          company.walletBalance
        );
        console.log(`Добавлена компания: ${company.firstName} ${company.lastName}`);
      } catch (error) {
        console.error(`Ошибка при добавлении компании ${company.firstName} ${company.lastName}:`, error);
      }
    }
    
    console.log('Top specialists seeded successfully');
  } catch (error) {
    console.error('Error seeding top specialists:', error);
  }
}
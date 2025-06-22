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
        username, password, email, full_name, user_type, location, bio,
        rating, completed_projects, is_verified, inn, website, wallet_balance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Тестовые данные для физических лиц - мастеров
    const individuals = [
      {
        username: 'master_ivan',
        password: await hashPassword('password123'),
        email: 'ivan@example.com',
        fullName: 'Иванов Иван',
        userType: 'individual',
        location: 'Москва',
        bio: 'Опытный мастер-отделочник с 15-летним стажем работы',
        rating: 5,
        completedProjects: 48,
        isVerified: 1 // для SQLite используем 1 вместо true
      },
      {
        username: 'master_elena',
        password: await hashPassword('password123'),
        email: 'elena@example.com',
        fullName: 'Елена Смирнова',
        userType: 'individual',
        location: 'Санкт-Петербург',
        bio: 'Дизайнер интерьеров с портфолио более 50 проектов',
        rating: 5,
        completedProjects: 52,
        isVerified: 1
      },
      {
        username: 'master_sergey',
        password: await hashPassword('password123'),
        email: 'sergey@example.com',
        fullName: 'Сергей Петров',
        userType: 'individual',
        location: 'Казань',
        bio: 'Электрик-профессионал, работаю с любыми объектами',
        rating: 4,
        completedProjects: 37,
        isVerified: 1
      },
      {
        username: 'master_olga',
        password: await hashPassword('password123'),
        email: 'olga@example.com',
        fullName: 'Ольга Николаева',
        userType: 'individual',
        location: 'Новосибирск',
        bio: 'Специалист по ландшафтному дизайну и озеленению',
        rating: 4,
        completedProjects: 28,
        isVerified: 1
      },
      {
        username: 'master_dmitry',
        password: await hashPassword('password123'),
        email: 'dmitry@example.com',
        fullName: 'Дмитрий Кузнецов',
        userType: 'individual',
        location: 'Екатеринбург',
        bio: 'Мастер по укладке плитки и сантехническим работам',
        rating: 5,
        completedProjects: 42,
        isVerified: 1
      }
    ];
    
    // Тестовые данные для юридических лиц - компаний
    const companies = [
      {
        username: 'stroybest',
        password: await hashPassword('password123'),
        email: 'info@stroybest.ru',
        fullName: 'ООО "СтройБест"',
        userType: 'company',
        location: 'Москва',
        bio: 'Строительная компания полного цикла, работаем с 2005 года',
        rating: 5,
        completedProjects: 123,
        isVerified: 1
      },
      {
        username: 'designpro',
        password: await hashPassword('password123'),
        email: 'info@designpro.ru',
        fullName: 'ООО "ДизайнПро"',
        userType: 'company',
        location: 'Санкт-Петербург',
        bio: 'Проектируем и реализуем дизайнерские решения для жилых и коммерческих помещений',
        rating: 5,
        completedProjects: 87,
        isVerified: 1
      },
      {
        username: 'remstroi',
        password: await hashPassword('password123'),
        email: 'info@remstroi.ru',
        fullName: 'ООО "РемСтрой"',
        userType: 'company',
        location: 'Нижний Новгород',
        bio: 'Качественный ремонт квартир, офисов и других помещений',
        rating: 4,
        completedProjects: 56,
        isVerified: 1
      },
      {
        username: 'architekton',
        password: await hashPassword('password123'),
        email: 'info@architekton.ru',
        fullName: 'ООО "Архитектон"',
        userType: 'company',
        location: 'Казань',
        bio: 'Архитектурное проектирование и строительство',
        rating: 5,
        completedProjects: 34,
        isVerified: 1
      },
      {
        username: 'stroigrad',
        password: await hashPassword('password123'),
        email: 'info@stroigrad.ru',
        fullName: 'ООО "СтройГрад"',
        userType: 'company',
        location: 'Ростов-на-Дону',
        bio: 'Строительство малоэтажных жилых домов и коттеджей',
        rating: 4,
        completedProjects: 29,
        isVerified: 1
      }
    ];
    
    // Добавляем физических лиц
    for (const individual of individuals) {
      try {
        insertUserStmt.run(
          individual.username,
          individual.password,
          individual.email,
          individual.fullName,
          individual.userType,
          individual.location,
          individual.bio,
          individual.rating,
          individual.completedProjects,
          individual.isVerified,
          null, // inn
          null, // website
          0     // wallet_balance
        );
        console.log(`Добавлен специалист: ${individual.fullName}`);
      } catch (error) {
        console.error(`Ошибка при добавлении специалиста ${individual.fullName}:`, error);
      }
    }
    
    // Добавляем юридические лица
    for (const company of companies) {
      try {
        const inn = '7701234567'; // ИНН для примера
        const website = `https://www.${company.username}.ru`;
        const walletBalance = 10000; // Начальный баланс для примера
        
        insertUserStmt.run(
          company.username,
          company.password,
          company.email,
          company.fullName,
          company.userType,
          company.location,
          company.bio,
          company.rating,
          company.completedProjects,
          company.isVerified,
          inn,
          website,
          walletBalance
        );
        console.log(`Добавлена компания: ${company.fullName}`);
      } catch (error) {
        console.error(`Ошибка при добавлении компании ${company.fullName}:`, error);
      }
    }
    
    console.log('Top specialists seeded successfully');
  } catch (error) {
    console.error('Error seeding top specialists:', error);
  }
}
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/sqlite-schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Создаем папку data, если она не существует
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

// Подключаемся к SQLite базе данных
const sqlite = new Database(join(dataDir, 'construction-platform.db'));

// Настройка базы данных для лучшей производительности
sqlite.pragma('journal_mode = WAL');

// Экспортируем прямой экземпляр SQLite для использования в запросах напрямую
export const sqliteDb = sqlite;

// Создаем экземпляр Drizzle ORM
export const db = drizzle(sqlite, { schema });

// Инициализация схемы базы данных
export function initializeDatabase() {
  try {
    // Проверяем, существуют ли уже таблицы
    const tableExists = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get();
    
    // Добавляем миграцию для пользователей - добавление поля updated_at
    try {
      console.log('Checking if updated_at column exists in users table...');
      sqlite.prepare('SELECT updated_at FROM users LIMIT 1').get();
      console.log('Column updated_at already exists');
    } catch (error) {
      console.log('Adding updated_at column to users table...');
      // SQLite не поддерживает DEFAULT CURRENT_TIMESTAMP при добавлении колонки
      sqlite.exec('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP');
      
      // Обновляем все существующие записи, устанавливая текущее время
      sqlite.exec('UPDATE users SET updated_at = CURRENT_TIMESTAMP');
      console.log('Column updated_at added successfully');
    }
    
    // Проверяем наличие таблицы банковских гарантий
    try {
      console.log('Checking if bank_guarantees table exists...');
      sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bank_guarantees'").get();
      console.log('Table bank_guarantees already exists');
    } catch (error) {
      console.log('Creating bank_guarantees table...');
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS bank_guarantees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount INTEGER NOT NULL,
          status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'canceled')) NOT NULL DEFAULT 'pending',
          customer_id INTEGER NOT NULL,
          contractor_id INTEGER NOT NULL,
          tender_id INTEGER,
          terms TEXT NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES users(id),
          FOREIGN KEY (contractor_id) REFERENCES users(id),
          FOREIGN KEY (tender_id) REFERENCES tenders(id)
        )
      `);
      console.log('Table bank_guarantees created successfully');
    }
    
    if (!tableExists) {
      console.log('Initializing database schema...');
      
      // Создаем все таблицы на основе схемы
      const createTablesSQL = [`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          full_name TEXT NOT NULL,
          user_type TEXT CHECK (user_type IN ('individual', 'contractor', 'company')) NOT NULL DEFAULT 'individual',
          location TEXT,
          bio TEXT,
          avatar TEXT,
          rating INTEGER DEFAULT 0,
          is_verified INTEGER DEFAULT 0,
          completed_projects INTEGER DEFAULT 0,
          inn TEXT,
          website TEXT,
          wallet_balance INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, `
        CREATE TABLE IF NOT EXISTS tenders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT CHECK (category IN ('equipment', 'materials', 'tools', 'services', 'property', 'transport')) NOT NULL,
          subcategory TEXT,
          budget INTEGER,
          location TEXT NOT NULL,
          deadline TIMESTAMP NOT NULL,
          status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'canceled')) NOT NULL DEFAULT 'open',
          user_id INTEGER NOT NULL,
          images TEXT DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          view_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS tender_bids (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tender_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          amount INTEGER NOT NULL,
          description TEXT NOT NULL,
          timeframe INTEGER,
          is_accepted INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tender_id) REFERENCES tenders(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS marketplace_listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          price INTEGER NOT NULL,
          listing_type TEXT CHECK (listing_type IN ('sell', 'rent', 'buy')) NOT NULL,
          category TEXT CHECK (category IN ('equipment', 'materials', 'tools', 'services', 'property', 'transport')) NOT NULL,
          subcategory TEXT,
          condition TEXT,
          location TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          images TEXT DEFAULT '[]',
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          view_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id),
          FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reviewer_id INTEGER NOT NULL,
          recipient_id INTEGER NOT NULL,
          tender_id INTEGER,
          listing_id INTEGER,
          rating INTEGER NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reviewer_id) REFERENCES users(id),
          FOREIGN KEY (recipient_id) REFERENCES users(id),
          FOREIGN KEY (tender_id) REFERENCES tenders(id),
          FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS user_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          document_type TEXT NOT NULL,
          document_number TEXT,
          issue_date TIMESTAMP,
          expiry_date TIMESTAMP,
          document_url TEXT,
          is_verified INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS delivery_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          max_weight INTEGER,
          max_volume INTEGER,
          price_per_km INTEGER,
          base_price INTEGER,
          has_loaders INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1
        )
      `, `
        CREATE TABLE IF NOT EXISTS delivery_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          listing_id INTEGER,
          delivery_option_id INTEGER,
          from_address TEXT NOT NULL,
          to_address TEXT NOT NULL,
          distance INTEGER,
          weight INTEGER,
          volume INTEGER,
          total_price INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          scheduled_date TIMESTAMP,
          tracking_code TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id),
          FOREIGN KEY (delivery_option_id) REFERENCES delivery_options(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS estimates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          tender_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          total_cost INTEGER NOT NULL,
          project_type TEXT NOT NULL,
          area INTEGER,
          materials_included INTEGER DEFAULT 1,
          estimated_duration INTEGER,
          document_url TEXT,
          status TEXT DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (tender_id) REFERENCES tenders(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS estimate_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          estimate_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit TEXT NOT NULL,
          unit_price INTEGER NOT NULL,
          total_price INTEGER NOT NULL,
          category TEXT,
          description TEXT,
          FOREIGN KEY (estimate_id) REFERENCES estimates(id)
        )
      `, `
        CREATE TABLE IF NOT EXISTS design_projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          area INTEGER,
          status TEXT DEFAULT 'in_progress',
          visualization_urls TEXT DEFAULT '[]',
          project_files TEXT DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `];
      
      // Выполняем SQL запросы для создания таблиц
      createTablesSQL.forEach(sql => {
        sqlite.exec(sql);
      });
      
      console.log('Database schema initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Проверка, добавление тестовых данных
export function seedDatabaseIfEmpty() {
  try {
    // Проверяем, есть ли в базе пользователи
    const userCount = sqlite
      .prepare('SELECT COUNT(*) as count FROM users')
      .get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('Seeding database with test data...');
      
      // Добавляем тестовых пользователей
      const insertUser = sqlite.prepare(`
        INSERT INTO users (username, password, email, phone, full_name, user_type, location, bio, avatar, is_verified, wallet_balance, inn, website)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Пример тестовых данных
      const users = [
        {
          username: 'customer1',
          password: '$2a$10$zL.MmDPVAYC7oWdzqM5RYeWFAVqcV0RzCs1QAbJsQJ2s6JYJe7jlu', // password123
          email: 'customer1@example.com',
          phone: '+79991234567',
          fullName: 'Иван Заказчиков',
          userType: 'individual',
          location: 'Москва',
          bio: 'Ищу подрядчиков для ремонта квартиры',
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          isVerified: 1
        },
        {
          username: 'contractor1',
          password: '$2a$10$zL.MmDPVAYC7oWdzqM5RYeWFAVqcV0RzCs1QAbJsQJ2s6JYJe7jlu', // password123
          email: 'contractor1@example.com',
          phone: '+79991234568',
          fullName: 'Алексей Строителев',
          userType: 'contractor',
          location: 'Санкт-Петербург',
          bio: 'Профессиональная бригада строителей с опытом более 10 лет',
          avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          isVerified: 1
        },
        {
          username: 'supplier1',
          password: '$2a$10$zL.MmDPVAYC7oWdzqM5RYeWFAVqcV0RzCs1QAbJsQJ2s6JYJe7jlu', // password123
          email: 'supplier1@example.com',
          phone: '+79991234569',
          fullName: 'ООО Стройматериалы',
          userType: 'company',
          location: 'Екатеринбург',
          bio: 'Поставки высококачественных стройматериалов по всей России',
          avatar: 'https://logo.clearbit.com/construction.com',
          isVerified: 1
        }
      ];
      
      // Добавляем пользователей
      users.forEach(user => {
        const walletBalance = 10000; // Начальный баланс для тестовых пользователей
        const inn = user.userType === 'company' ? '7701234567' : null;
        const website = user.userType === 'company' ? `https://www.${user.username}.ru` : null;
        
        insertUser.run(
          user.username,
          user.password,
          user.email,
          user.phone,
          user.fullName,
          user.userType,
          user.location,
          user.bio,
          user.avatar,
          user.isVerified,
          walletBalance,
          inn,
          website
        );
      });
      
      // Получаем ID добавленных пользователей
      const getUserId = sqlite.prepare('SELECT id FROM users WHERE username = ?');
      const customerId = (getUserId.get('customer1') as { id: number }).id;
      const contractorId = (getUserId.get('contractor1') as { id: number }).id;
      const supplierId = (getUserId.get('supplier1') as { id: number }).id;
      
      // Добавляем тестовые тендеры
      const insertTender = sqlite.prepare(`
        INSERT INTO tenders (title, description, category, subcategory, budget, location, deadline, status, user_id, images, view_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const tenders = [
        {
          title: 'Разработка проекта жилого комплекса',
          description: 'Требуется разработать проект ЖК на 100 квартир с подземной парковкой и коммерческими помещениями на первом этаже.',
          category: 'services',
          subcategory: 'design',
          budget: 5000000,
          location: 'Москва',
          deadline: new Date('2025-12-31').toISOString(),
          status: 'open',
          userId: customerId,
          images: JSON.stringify(['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80']),
          viewCount: 120
        },
        {
          title: 'Строительство фундамента для частного дома',
          description: 'Нужно залить фундамент для двухэтажного частного дома площадью 150 кв.м.',
          category: 'services',
          subcategory: 'construction',
          budget: 800000,
          location: 'Санкт-Петербург',
          deadline: new Date('2025-08-15').toISOString(),
          status: 'open',
          userId: customerId,
          images: JSON.stringify(['https://images.unsplash.com/photo-1503594384566-461fe159d128?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80']),
          viewCount: 85
        },
        {
          title: 'Закупка строительных материалов для ремонта офиса',
          description: 'Требуется закупка строительных материалов для ремонта офиса площадью 200 кв.м. Список материалов предоставляется.',
          category: 'materials',
          subcategory: 'bricks',
          budget: 1200000,
          location: 'Екатеринбург',
          deadline: new Date('2025-07-01').toISOString(),
          status: 'open',
          userId: contractorId,
          images: JSON.stringify(['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80']),
          viewCount: 65
        }
      ];
      
      // Добавляем тендеры
      tenders.forEach(tender => {
        insertTender.run(
          tender.title,
          tender.description,
          tender.category,
          tender.subcategory,
          tender.budget,
          tender.location,
          tender.deadline,
          tender.status,
          tender.userId,
          tender.images,
          tender.viewCount
        );
      });
      
      // Добавляем тестовые объявления в маркетплейс
      const insertListing = sqlite.prepare(`
        INSERT INTO marketplace_listings (title, description, price, listing_type, category, subcategory, condition, location, user_id, images, view_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const listings = [
        {
          title: 'Продам башенный кран Liebherr 130 EC-B 6',
          description: 'Башенный кран Liebherr 130 EC-B 6 в отличном состоянии. Год выпуска: 2018. Наработка: 3000 моточасов.',
          price: 15000000,
          listingType: 'sell',
          category: 'equipment',
          subcategory: 'cranes',
          condition: 'used',
          location: 'Москва',
          userId: supplierId,
          images: JSON.stringify(['https://images.unsplash.com/photo-1508515053963-70c1d39e89e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80']),
          viewCount: 230
        },
        {
          title: 'Аренда бетономешалки FIORI DB 460CBV',
          description: 'Предлагаем в аренду бетономешалку FIORI DB 460CBV. Объем 4.6 куб.м. Минимальный срок аренды - 1 день.',
          price: 15000,
          listingType: 'rent',
          category: 'equipment',
          subcategory: 'concrete_mixers',
          condition: 'new',
          location: 'Санкт-Петербург',
          userId: supplierId,
          images: JSON.stringify(['https://images.unsplash.com/photo-1505855265981-d52719d9c559?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80']),
          viewCount: 180
        },
        {
          title: 'Продам кирпич облицовочный',
          description: 'Продам кирпич облицовочный керамический, цвет "Солома". В наличии 10000 штук.',
          price: 30,
          listingType: 'sell',
          category: 'materials',
          subcategory: 'bricks',
          condition: 'new',
          location: 'Екатеринбург',
          userId: supplierId,
          images: JSON.stringify(['https://images.unsplash.com/photo-1618076702124-d8b3a3a595b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80']),
          viewCount: 150
        }
      ];
      
      // Добавляем объявления
      listings.forEach(listing => {
        insertListing.run(
          listing.title,
          listing.description,
          listing.price,
          listing.listingType,
          listing.category,
          listing.subcategory,
          listing.condition,
          listing.location,
          listing.userId,
          listing.images,
          listing.viewCount
        );
      });
      
      // Добавляем тестовые опции доставки
      const insertDeliveryOption = sqlite.prepare(`
        INSERT INTO delivery_options (name, description, max_weight, max_volume, price_per_km, base_price, has_loaders)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const deliveryOptions = [
        {
          name: 'Лёгкая доставка (до 300 кг)',
          description: 'Доставка небольших грузов весом до 300 кг. Идеально для мелких стройматериалов и инструментов.',
          maxWeight: 300,
          maxVolume: 5,
          pricePerKm: 30,
          basePrice: 1000,
          hasLoaders: 0
        },
        {
          name: 'Средняя доставка (до 1.5 т)',
          description: 'Доставка грузов среднего веса до 1.5 тонн. Подходит для большинства стройматериалов.',
          maxWeight: 1500,
          maxVolume: 10,
          pricePerKm: 50,
          basePrice: 2000,
          hasLoaders: 0
        },
        {
          name: 'Грузовая доставка (до 5 т)',
          description: 'Доставка тяжелых грузов весом до 5 тонн. Для крупных партий стройматериалов.',
          maxWeight: 5000,
          maxVolume: 20,
          pricePerKm: 80,
          basePrice: 3000,
          hasLoaders: 0
        },
        {
          name: 'Переезд с грузчиками',
          description: 'Услуга переезда с командой грузчиков. Включает погрузку/разгрузку и транспортировку.',
          maxWeight: 2000,
          maxVolume: 15,
          pricePerKm: 60,
          basePrice: 5000,
          hasLoaders: 1
        }
      ];
      
      // Добавляем опции доставки
      deliveryOptions.forEach(option => {
        insertDeliveryOption.run(
          option.name,
          option.description,
          option.maxWeight,
          option.maxVolume,
          option.pricePerKm,
          option.basePrice,
          option.hasLoaders
        );
      });
      
      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/sqlite-schema';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Create data directory if it doesn't exist
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

// Connect to SQLite database
const sqlite = new Database(join(dataDir, 'construction-platform.db'));

// Configure database
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const sqliteDb = sqlite;
export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  console.log('Initializing SQLite database...');
  
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      user_type TEXT NOT NULL DEFAULT 'individual',
      firstName TEXT,
      lastName TEXT,
      phone TEXT,
      address TEXT,
      avatar TEXT,
      rating INTEGER DEFAULT 0,
      isVerified INTEGER DEFAULT 0,
      completedProjects INTEGER DEFAULT 0,
      inn TEXT,
      website TEXT,
      walletBalance INTEGER DEFAULT 0,
      isAdmin INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS tenders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      budget INTEGER,
      location TEXT NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      userId INTEGER NOT NULL,
      personType TEXT NOT NULL DEFAULT 'individual',
      requiredProfessions TEXT,
      images TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      viewCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tender_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenderId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      timeframe INTEGER,
      documents TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      isAccepted INTEGER DEFAULT 0,
      rejection_reason TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      price INTEGER NOT NULL,
      location TEXT NOT NULL,
      userId INTEGER NOT NULL,
      listingType TEXT NOT NULL DEFAULT 'sell',
      condition TEXT,
      isActive INTEGER DEFAULT 1,
      images TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      viewCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER NOT NULL,
      receiverId INTEGER NOT NULL,
      content TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewerId INTEGER NOT NULL,
      revieweeId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);

  console.log('SQLite database initialized successfully');
}

export function addModerationFields() {
  console.log('Adding moderation fields to database...');
  
  try {
    // Добавляем поля модерации в таблицу tenders
    sqlite.exec(`
      ALTER TABLE tenders ADD COLUMN moderation_status TEXT DEFAULT 'pending';
    `);
  } catch (error) {
    console.log('Moderation status column already exists in tenders table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE tenders ADD COLUMN moderated_by INTEGER;
    `);
  } catch (error) {
    console.log('Moderated by column already exists in tenders table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE tenders ADD COLUMN moderated_at TEXT;
    `);
  } catch (error) {
    console.log('Moderated at column already exists in tenders table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE tenders ADD COLUMN moderation_comment TEXT;
    `);
  } catch (error) {
    console.log('Moderation comment column already exists in tenders table');
  }

  // Добавляем поля модерации в таблицу marketplace_listings
  try {
    sqlite.exec(`
      ALTER TABLE marketplace_listings ADD COLUMN moderation_status TEXT DEFAULT 'pending';
    `);
  } catch (error) {
    console.log('Moderation status column already exists in marketplace_listings table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE marketplace_listings ADD COLUMN moderated_by INTEGER;
    `);
  } catch (error) {
    console.log('Moderated by column already exists in marketplace_listings table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE marketplace_listings ADD COLUMN moderated_at TEXT;
    `);
  } catch (error) {
    console.log('Moderated at column already exists in marketplace_listings table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE marketplace_listings ADD COLUMN moderation_comment TEXT;
    `);
  } catch (error) {
    console.log('Moderation comment column already exists in marketplace_listings table');
  }

  // Добавляем поле isTopSpecialist в таблицу users
  try {
    sqlite.exec(`
      ALTER TABLE users ADD COLUMN is_top_specialist INTEGER DEFAULT 0;
    `);
    console.log('isTopSpecialist column added to users table');
  } catch (error) {
    console.log('isTopSpecialist column already exists in users table');
  }

  // Проверяем и добавляем недостающие колонки в таблицу users
  try {
    sqlite.exec(`
      ALTER TABLE users ADD COLUMN first_name TEXT;
    `);
    console.log('first_name column added to users table');
  } catch (error) {
    console.log('first_name column already exists in users table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE users ADD COLUMN last_name TEXT;
    `);
    console.log('last_name column added to users table');
  } catch (error) {
    console.log('last_name column already exists in users table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;
    `);
    console.log('is_verified column added to users table');
  } catch (error) {
    console.log('is_verified column already exists in users table');
  }

  console.log('Moderation fields migration completed');
}

export function addBidStatusFields() {
  console.log('Adding bid status fields to database...');
  
  try {
    sqlite.exec(`
      ALTER TABLE tender_bids ADD COLUMN status TEXT DEFAULT 'pending';
    `);
  } catch (error) {
    console.log('Status column already exists in tender_bids table');
  }

  try {
    sqlite.exec(`
      ALTER TABLE tender_bids ADD COLUMN rejection_reason TEXT;
    `);
  } catch (error) {
    console.log('Rejection reason column already exists in tender_bids table');
  }

  console.log('Bid status fields migration completed');
}

// Seed database with basic data
export function seedDatabaseIfEmpty() {
  const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    console.log('Seeding database with initial data...');
    
    const now = new Date().toISOString();
    
    // Create sample users
    sqlite.exec(`
      INSERT INTO users (username, email, password, user_type, firstName, lastName, createdAt, updatedAt) VALUES
      ('customer1', 'customer1@example.com', '$2a$10$placeholder', 'individual', 'Иван', 'Заказчик', '${now}', '${now}'),
      ('contractor1', 'contractor1@example.com', '$2a$10$placeholder', 'contractor', 'Сергей', 'Подрядчик', '${now}', '${now}'),
      ('company1', 'company1@example.com', '$2a$10$placeholder', 'company', 'ООО', 'СтройКомпания', '${now}', '${now}');
    `);

    // Create sample tenders
    sqlite.exec(`
      INSERT INTO tenders (title, description, category, subcategory, budget, location, deadline, userId, personType, images, createdAt, updatedAt) VALUES
      ('Разработка проекта жилого комплекса', 'Требуется разработать проект жилого комплекса на 100 квартир', 'services', 'design', 5000000, 'Москва', '${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}', 1, 'legal', '[]', '${now}', '${now}'),
      ('Строительство частного дома', 'Строительство двухэтажного дома 200 кв.м.', 'services', 'construction', 3000000, 'Санкт-Петербург', '${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()}', 1, 'individual', '[]', '${now}', '${now}');
    `);

    // Create sample marketplace listings
    sqlite.exec(`
      INSERT INTO marketplace_listings (title, description, category, price, location, userId, listingType, images, createdAt, updatedAt) VALUES
      ('Продам башенный кран Liebherr', 'Башенный кран в отличном состоянии, высота подъема 50м', 'equipment', 2500000, 'Екатеринбург', 2, 'sell', '[]', '${now}', '${now}'),
      ('Аренда экскаватора JCB', 'Экскаватор-погрузчик JCB 3CX в аренду', 'equipment', 3500, 'Новосибирск', 2, 'rent', '[]', '${now}', '${now}');
    `);

    console.log('Database seeded successfully');
  }
}
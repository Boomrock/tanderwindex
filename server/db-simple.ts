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
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      address TEXT,
      avatar TEXT,
      rating INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      completed_projects INTEGER DEFAULT 0,
      inn TEXT,
      website TEXT,
      wallet_balance INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
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
      user_id INTEGER NOT NULL,
      person_type TEXT NOT NULL DEFAULT 'individual',
      required_professions TEXT,
      images TEXT,
      created_at TEXT,
      updated_at TEXT,
      view_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tender_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tender_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      timeframe INTEGER,
      is_accepted INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      price INTEGER NOT NULL,
      location TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      listing_type TEXT NOT NULL DEFAULT 'sell',
      condition TEXT,
      is_active INTEGER DEFAULT 1,
      images TEXT,
      created_at TEXT,
      updated_at TEXT,
      view_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT
    );
  `);

  console.log('SQLite database initialized successfully');
}

// Seed database with basic data
export function seedDatabaseIfEmpty() {
  const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    console.log('Seeding database with initial data...');
    
    const now = new Date().toISOString();
    
    // Create sample users
    sqlite.exec(`
      INSERT INTO users (username, email, password, user_type, first_name, last_name, created_at, updated_at) VALUES
      ('customer1', 'customer1@example.com', '$2a$10$placeholder', 'individual', 'Иван', 'Заказчик', '${now}', '${now}'),
      ('contractor1', 'contractor1@example.com', '$2a$10$placeholder', 'contractor', 'Сергей', 'Подрядчик', '${now}', '${now}'),
      ('company1', 'company1@example.com', '$2a$10$placeholder', 'company', 'ООО', 'СтройКомпания', '${now}', '${now}');
    `);

    // Create sample tenders
    sqlite.exec(`
      INSERT INTO tenders (title, description, category, subcategory, budget, location, deadline, user_id, person_type, images, created_at, updated_at) VALUES
      ('Разработка проекта жилого комплекса', 'Требуется разработать проект жилого комплекса на 100 квартир', 'services', 'design', 5000000, 'Москва', '${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}', 1, 'legal', '[]', '${now}', '${now}'),
      ('Строительство частного дома', 'Строительство двухэтажного дома 200 кв.м.', 'services', 'construction', 3000000, 'Санкт-Петербург', '${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()}', 1, 'individual', '[]', '${now}', '${now}');
    `);

    // Create sample marketplace listings
    sqlite.exec(`
      INSERT INTO marketplace_listings (title, description, category, price, location, user_id, listing_type, images, created_at, updated_at) VALUES
      ('Продам башенный кран Liebherr', 'Башенный кран в отличном состоянии, высота подъема 50м', 'equipment', 2500000, 'Екатеринбург', 2, 'sell', '[]', '${now}', '${now}'),
      ('Аренда экскаватора JCB', 'Экскаватор-погрузчик JCB 3CX в аренду', 'equipment', 3500, 'Новосибирск', 2, 'rent', '[]', '${now}', '${now}');
    `);

    console.log('Database seeded successfully');
  }
}
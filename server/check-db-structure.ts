import { sqliteDb } from './db-simple';

// Скрипт для проверки структуры базы данных
function checkDbStructure() {
  console.log('Проверка структуры базы данных...');
  
  try {
    // Проверяем структуру таблицы tenders
    const tendersInfo = sqliteDb.prepare("PRAGMA table_info(tenders)").all();
    console.log('Структура таблицы tenders:');
    console.log(tendersInfo);
    
    // Проверяем структуру таблицы marketplace_listings
    const marketplaceInfo = sqliteDb.prepare("PRAGMA table_info(marketplace_listings)").all();
    console.log('\nСтруктура таблицы marketplace_listings:');
    console.log(marketplaceInfo);
    
    // Проверяем структуру таблицы users
    const usersInfo = sqliteDb.prepare("PRAGMA table_info(users)").all();
    console.log('\nСтруктура таблицы users:');
    console.log(usersInfo);
    
  } catch (error) {
    console.error('Ошибка при проверке структуры базы данных:', error);
  }
}

checkDbStructure();
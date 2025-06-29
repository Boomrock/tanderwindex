import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

// Open database
const db = new Database('./database.db');

async function createAdmin() {
  try {
    // Hash password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating admin with password:', password);
    console.log('Hashed password:', hashedPassword);
    
    // Delete existing admin if exists
    db.prepare('DELETE FROM users WHERE username = ?').run('admin');
    
    // Insert new admin
    const insertStmt = db.prepare(`
      INSERT INTO users (
        username, email, password, user_type, is_admin, 
        first_name, last_name, phone, location, 
        is_verified, wallet_balance, rating, completed_projects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      'admin',
      'admin@windexs.ru', 
      hashedPassword,
      'individual',
      1, // is_admin = true
      'Администратор',
      'Системы',
      '+7-999-000-0000',
      'Москва',
      1, // is_verified = true
      0, // wallet_balance
      5.0, // rating
      0 // completed_projects
    );
    
    console.log('Admin created with ID:', result.lastInsertRowid);
    
    // Verify creation
    const admin = db.prepare('SELECT id, username, is_admin FROM users WHERE username = ?').get('admin');
    console.log('Verification - Admin found:', admin);
    
    // Test password
    const testResult = await bcrypt.compare(password, hashedPassword);
    console.log('Password test result:', testResult);
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    db.close();
  }
}

createAdmin();
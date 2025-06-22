import { BaseStorage } from './base-storage';
import type { User, InsertUser } from '@shared/schema';

/**
 * Storage для работы с пользователями
 */
export class UserStorage extends BaseStorage {

  async getUser(id: number): Promise<User | undefined> {
    const query = `SELECT * FROM users WHERE id = ?`;
    const user = this.getOne<any>(query, [id]);
    return user ? this.transformUserFromDb(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const query = `SELECT * FROM users WHERE username = ?`;
    const user = this.getOne<any>(query, [username]);
    return user ? this.transformUserFromDb(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const query = `SELECT * FROM users WHERE email = ?`;
    const user = this.getOne<any>(query, [email]);
    return user ? this.transformUserFromDb(user) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = this.now();
    
    const query = `
      INSERT INTO users (
        username, password, email, phone, full_name,
        user_type, location, bio, avatar, inn, website, 
        wallet_balance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = this.executeQuery(query, [
      user.username,
      user.password,
      user.email,
      user.phone || null,
      user.fullName,
      user.userType || 'individual',
      user.location || null,
      user.bio || null,
      user.avatar || null,
      user.inn || null,
      user.website || null,
      (user as any).walletBalance ?? 0,
      now,
      now
    ]);

    const newUser = this.getOne<any>(
      `SELECT * FROM users WHERE id = ?`, 
      [Number(result.lastInsertRowid)]
    );
    
    if (!newUser) {
      throw new Error('Failed to retrieve created user');
    }
    
    return this.transformUserFromDb(newUser);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const updateData = { ...userData };
    delete updateData.updatedAt;

    const { query, values } = this.buildUpdateQuery('users', updateData);
    this.executeQuery(query, [...values, id]);

    const updatedUser = this.getOne<any>(`SELECT * FROM users WHERE id = ?`, [id]);
    return updatedUser ? this.transformUserFromDb(updatedUser) : undefined;
  }

  async getTopSpecialists(personType: string): Promise<User[]> {
    const userTypeValue = personType === 'individual' ? 'individual' : 'company';
    
    const query = `
      SELECT * FROM users 
      WHERE user_type = ? 
      ORDER BY rating DESC, completed_projects DESC 
      LIMIT 10
    `;
    
    const users = this.getMany<any>(query, [userTypeValue]);
    return users.map(user => this.transformUserFromDb(user));
  }

  async incrementCompletedProjects(userId: number): Promise<void> {
    const query = `
      UPDATE users 
      SET completed_projects = completed_projects + 1,
          updated_at = ?
      WHERE id = ?
    `;
    
    this.executeQuery(query, [this.now(), userId]);
  }

  async updateWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    const query = `
      UPDATE users 
      SET wallet_balance = wallet_balance + ?,
          updated_at = ?
      WHERE id = ?
    `;
    
    this.executeQuery(query, [amount, this.now(), userId]);

    const updatedUser = this.getOne<any>(`SELECT * FROM users WHERE id = ?`, [userId]);
    return updatedUser ? this.transformUserFromDb(updatedUser) : undefined;
  }

  async getUserStats(userId: number): Promise<{
    totalTenders: number;
    totalBids: number;
    totalListings: number;
    totalMessages: number;
    averageRating: number;
  }> {
    const stats = {
      totalTenders: 0,
      totalBids: 0,
      totalListings: 0,
      totalMessages: 0,
      averageRating: 0
    };

    // Подсчет тендеров
    const tenderCount = this.getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM tenders WHERE user_id = ?`, 
      [userId]
    );
    stats.totalTenders = tenderCount?.count ?? 0;

    // Подсчет заявок
    const bidCount = this.getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM tender_bids WHERE user_id = ?`, 
      [userId]
    );
    stats.totalBids = bidCount?.count ?? 0;

    // Подсчет объявлений
    const listingCount = this.getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM marketplace_listings WHERE user_id = ?`, 
      [userId]
    );
    stats.totalListings = listingCount?.count ?? 0;

    // Подсчет сообщений
    const messageCount = this.getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE sender_id = ?`, 
      [userId]
    );
    stats.totalMessages = messageCount?.count ?? 0;

    // Средний рейтинг
    const avgRating = this.getOne<{ avg: number }>(
      `SELECT AVG(rating) as avg FROM reviews WHERE recipient_id = ?`, 
      [userId]
    );
    stats.averageRating = avgRating?.avg ?? 0;

    return stats;
  }

  /**
   * Преобразование записи из базы данных в объект User
   */
  private transformUserFromDb(row: any): User {
    return {
      id: row.id,
      username: row.username,
      password: row.password,
      email: row.email,
      phone: row.phone,
      fullName: row.full_name,
      userType: row.user_type,
      location: row.location,
      bio: row.bio,
      avatar: row.avatar,
      rating: row.rating || 0,
      completedProjects: row.completed_projects || 0,
      isVerified: !!row.is_verified,
      inn: row.inn,
      website: row.website,
      walletBalance: row.wallet_balance || 0,
      isAdmin: !!row.is_admin,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Поиск пользователей
   */
  async searchUsers(searchTerm: string, userType?: string): Promise<User[]> {
    let query = `
      SELECT * FROM users 
      WHERE (username LIKE ? OR full_name LIKE ? OR bio LIKE ?)
    `;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

    if (userType) {
      query += ` AND user_type = ?`;
      params.push(userType);
    }

    query += ` ORDER BY rating DESC LIMIT 20`;

    const users = this.getMany<any>(query, params);
    return users.map(user => this.transformUserFromDb(user));
  }

  /**
   * Проверка уникальности имени пользователя
   */
  async isUsernameAvailable(username: string, excludeUserId?: number): Promise<boolean> {
    let query = `SELECT 1 FROM users WHERE username = ?`;
    const params = [username];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    return !this.exists('users', 'username = ?', params);
  }

  /**
   * Проверка уникальности email
   */
  async isEmailAvailable(email: string, excludeUserId?: number): Promise<boolean> {
    let query = `SELECT 1 FROM users WHERE email = ?`;
    const params = [email];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    return !this.exists('users', 'email = ?', params);
  }
}
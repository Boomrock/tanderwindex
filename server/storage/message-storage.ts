import { BaseStorage } from './base-storage';
import type { Message, InsertMessage } from '@shared/schema';

/**
 * Storage для работы с сообщениями
 * Использует прямые SQLite запросы для избежания конфликтов с PostgreSQL схемой
 */
export class MessageStorage extends BaseStorage {
  
  /**
   * Получение всех сообщений пользователя
   */
  async getMessages(userId: number): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE sender_id = ? OR receiver_id = ?
      ORDER BY created_at DESC
    `;
    
    const rows = this.getMany(query, [userId, userId]);
    
    return rows.map(row => this.transformMessageFromDb(row));
  }

  /**
   * Получение диалога между двумя пользователями
   */
  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `;
    
    const rows = this.getMany(query, [user1Id, user2Id, user2Id, user1Id]);
    
    return rows.map(row => this.transformMessageFromDb(row));
  }

  /**
   * Создание нового сообщения
   */
  async createMessage(msg: InsertMessage): Promise<Message> {
    const timestamp = this.now();
    
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content, created_at)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = this.executeQuery(query, [
      msg.senderId,
      msg.receiverId,
      msg.content,
      timestamp
    ]);

    const newMessage = this.getOne(
      `SELECT * FROM messages WHERE id = ?`, 
      [Number(result.lastInsertRowid)]
    );

    if (!newMessage) {
      throw new Error('Failed to retrieve created message');
    }

    return this.transformMessageFromDb(newMessage);
  }

  /**
   * Отметка сообщения как прочитанного
   */
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const query = `
      UPDATE messages 
      SET is_read = 1 
      WHERE id = ?
    `;
    
    this.executeQuery(query, [id]);
    
    const updatedMessage = this.getOne(
      `SELECT * FROM messages WHERE id = ?`, 
      [id]
    );

    return updatedMessage ? this.transformMessageFromDb(updatedMessage) : undefined;
  }

  /**
   * Подсчет непрочитанных сообщений
   */
  async getUnreadCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE receiver_id = ? AND is_read = 0
    `;
    
    const result = this.getOne<{ count: number }>(query, [userId]);
    return result?.count ?? 0;
  }

  /**
   * Получение последних сообщений для каждого диалога
   */
  async getRecentConversations(userId: number): Promise<Message[]> {
    const query = `
      WITH ranked_messages AS (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY 
                   CASE 
                     WHEN sender_id = ? THEN receiver_id 
                     ELSE sender_id 
                   END 
                 ORDER BY created_at DESC
               ) as rn
        FROM messages 
        WHERE sender_id = ? OR receiver_id = ?
      )
      SELECT * FROM ranked_messages 
      WHERE rn = 1 
      ORDER BY created_at DESC
    `;
    
    const rows = this.getMany(query, [userId, userId, userId]);
    
    return rows.map(row => this.transformMessageFromDb(row));
  }

  /**
   * Преобразование записи из базы данных в объект Message
   */
  private transformMessageFromDb(row: any): Message {
    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      isRead: !!row.is_read,
      createdAt: row.created_at,
    };
  }

  /**
   * Удаление сообщения (мягкое удаление)
   */
  async deleteMessage(id: number, userId: number): Promise<boolean> {
    // Проверяем, что пользователь может удалить это сообщение
    const message = this.getOne(
      `SELECT * FROM messages WHERE id = ? AND sender_id = ?`, 
      [id, userId]
    );

    if (!message) {
      return false;
    }

    const query = `
      UPDATE messages 
      SET content = '[Сообщение удалено]', is_deleted = 1 
      WHERE id = ?
    `;
    
    this.executeQuery(query, [id]);
    return true;
  }

  /**
   * Поиск сообщений по содержимому
   */
  async searchMessages(userId: number, searchTerm: string): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE (sender_id = ? OR receiver_id = ?) 
        AND content LIKE ? 
        AND (is_deleted IS NULL OR is_deleted = 0)
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    
    const rows = this.getMany(query, [userId, userId, `%${searchTerm}%`]);
    
    return rows.map(row => this.transformMessageFromDb(row));
  }
}
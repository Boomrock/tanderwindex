import { eq, and, like, or, sql, desc } from 'drizzle-orm';
import { db, sqliteDb } from './db-simple';
import { IStorage } from './storage';
import {
  users, tenders, tenderBids, marketplaceListings, messages, reviews, notifications,
  type User, type InsertUser,
  type Tender, type InsertTender,
  type TenderBid, type InsertTenderBid,
  type MarketplaceListing, type MarketplaceListingResponse, type InsertMarketplaceListing,
  type Message, type InsertMessage,
  type Review, type InsertReview,
  type Notification, type InsertNotification
} from '@shared/sqlite-schema';

// Helper function to handle date strings properly
function ensureDateString(date: string | Date): string {
  if (typeof date === 'string') return date;
  return date.toISOString();
}

export class SimpleSQLiteStorage implements IStorage {
  sessionStore: any;
  private db: typeof sqliteDb;

  // Helper method to parse images from database
  private parseImages(images: any): string[] {
    if (!images) return [];
    if (typeof images === 'string') {
      try {
        // Handle multiple levels of JSON encoding
        let parsed = images;
        while (typeof parsed === 'string' && (parsed.startsWith('"') || parsed.startsWith('['))) {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            break;
          }
        }
        
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') return [parsed];
        return [];
      } catch {
        return images.startsWith('data:') || images.startsWith('http') ? [images] : [];
      }
    }
    if (Array.isArray(images)) return images;
    return [];
  }

  constructor() {
    this.sessionStore = null; // Placeholder for session store
    this.db = sqliteDb;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date().toISOString();
    const userData = {
      ...insertUser,
      createdAt: now,
      updatedAt: now,
    };

    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const updateData = {
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Tender methods
  async getTenders(filters?: {
    category?: string;
    subcategory?: string;
    location?: string;
    status?: string;
    personType?: string;
    userId?: number;
    limit?: number;
    offset?: number;
    showAll?: boolean; // Для админов, чтобы видеть все тендеры
    search?: string;
    minBudget?: number;
    maxBudget?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<Tender[]> {
    let query = db.select().from(tenders);

    // Показываем только одобренные тендеры, если не указано showAll
    if (!filters?.showAll) {
      // Используем SQL запрос с JOIN для получения информации о пользователе
      let sqlQuery = `
        SELECT 
          t.*,
          u.username,
          u.first_name,
          u.last_name,
          u.rating,
          u.avatar,
          u.email
        FROM tenders t
        LEFT JOIN users u ON t.userId = u.id
        WHERE t.moderation_status = 'approved'
      `;
      
      const params: any[] = [];
      
      if (filters?.category) {
        sqlQuery += ' AND t.category = ?';
        params.push(filters.category);
      }
      
      if (filters?.status) {
        sqlQuery += ' AND t.status = ?';
        params.push(filters.status);
      }
      
      if (filters?.userId) {
        sqlQuery += ' AND t.userId = ?';
        params.push(filters.userId);
      }
      
      if (filters?.location) {
        sqlQuery += ' AND t.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      
      if (filters?.minBudget) {
        sqlQuery += ' AND t.budget >= ?';
        params.push(filters.minBudget);
      }
      
      if (filters?.maxBudget) {
        sqlQuery += ' AND t.budget <= ?';
        params.push(filters.maxBudget);
      }
      
      if (filters?.search) {
        sqlQuery += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Добавляем сортировку
      if (filters?.sortBy) {
        const sortColumn = filters.sortBy === 'budget' ? 't.budget' : 
                          filters.sortBy === 'deadline' ? 't.deadline' : 't.createdAt';
        const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
        sqlQuery += ` ORDER BY ${sortColumn} ${sortDirection}`;
      } else {
        sqlQuery += ' ORDER BY t.createdAt DESC';
      }
      
      if (filters?.limit) {
        sqlQuery += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      if (filters?.offset) {
        sqlQuery += ' OFFSET ?';
        params.push(filters.offset);
      }

      const tendersWithUser = sqliteDb.prepare(sqlQuery).all(...params) as any[];
      
      return tendersWithUser.map(tender => ({
        ...tender,
        images: tender.images ? JSON.parse(tender.images) : [],
        user: {
          id: tender.userId,
          username: tender.username,
          fullName: tender.first_name && tender.last_name 
            ? `${tender.first_name} ${tender.last_name}` 
            : tender.username,
          rating: tender.rating || 0,
          avatar: tender.avatar,
          email: tender.email
        }
      }));
    }

    if (filters?.category) {
      query = query.where(eq(tenders.category, filters.category));
    }
    if (filters?.status) {
      query = query.where(eq(tenders.status, filters.status));
    }
    if (filters?.userId) {
      query = query.where(eq(tenders.userId, filters.userId));
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;
    return results.map(tender => ({
      ...tender,
      images: tender.images ? JSON.parse(tender.images) : [],
    }));
  }

  async getTender(id: number): Promise<Tender | undefined> {
    // Используем SQL запрос с JOIN для получения информации о пользователе
    const [tenderWithUser] = await sqliteDb.prepare(`
      SELECT 
        t.*,
        u.username,
        u.first_name,
        u.last_name,
        u.rating,
        u.avatar,
        u.email
      FROM tenders t
      LEFT JOIN users u ON t.userId = u.id
      WHERE t.id = ?
    `).all(id) as any[];
    
    if (!tenderWithUser) return undefined;

    return {
      ...tenderWithUser,
      images: tenderWithUser.images ? JSON.parse(tenderWithUser.images) : [],
      user: {
        id: tenderWithUser.userId,
        username: tenderWithUser.username,
        fullName: tenderWithUser.first_name && tenderWithUser.last_name 
          ? `${tenderWithUser.first_name} ${tenderWithUser.last_name}` 
          : tenderWithUser.username,
        rating: tenderWithUser.rating || 0,
        avatar: tenderWithUser.avatar,
        email: tenderWithUser.email
      }
    };
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    console.log('SimpleSQLiteStorage createTender received:', insertTender);
    
    const now = new Date().toISOString();
    const tenderData = {
      ...insertTender,
      deadline: ensureDateString(insertTender.deadline),
      images: JSON.stringify(insertTender.images || []),
      status: 'open' as const,
      moderationStatus: 'pending' as const,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
    };

    console.log('SimpleSQLiteStorage tenderData before insert:', tenderData);

    try {
      const [tender] = await db.insert(tenders).values(tenderData).returning();
      console.log('SimpleSQLiteStorage tender created successfully:', tender);
      
      return {
        ...tender,
        images: tender.images ? JSON.parse(tender.images) : [],
      };
    } catch (error) {
      console.error('SimpleSQLiteStorage tender creation error:', error);
      throw error;
    }
  }

  async updateTender(id: number, tenderData: Partial<Tender>): Promise<Tender | undefined> {
    const updateData = {
      ...tenderData,
      updatedAt: new Date().toISOString(),
    };

    // Обрабатываем изображения
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = JSON.stringify(updateData.images);
    }

    // Обрабатываем дату крайнего срока
    if (updateData.deadline) {
      updateData.deadline = ensureDateString(updateData.deadline);
    }

    const [tender] = await db.update(tenders).set(updateData).where(eq(tenders.id, id)).returning();
    if (!tender) return undefined;

    return {
      ...tender,
      images: tender.images ? JSON.parse(tender.images) : [],
    };
  }

  async deleteTender(id: number): Promise<boolean> {
    const result = await db.delete(tenders).where(eq(tenders.id, id));
    return result.changes > 0;
  }

  async incrementTenderViews(id: number): Promise<void> {
    await db.update(tenders)
      .set({ viewCount: sql`${tenders.viewCount} + 1` })
      .where(eq(tenders.id, id));
  }

  // Tender bid methods
  async getTenderBids(tenderId: number): Promise<TenderBid[]> {
    // Используем SQL запрос с JOIN для получения информации о пользователе
    const bidsWithUser = await sqliteDb.prepare(`
      SELECT 
        b.*,
        u.username,
        u.first_name,
        u.last_name,
        u.rating,
        u.avatar,
        u.email,
        u.phone
      FROM tender_bids b
      LEFT JOIN users u ON b.userId = u.id
      WHERE b.tenderId = ?
      ORDER BY b.createdAt DESC
    `).all(tenderId) as any[];
    
    console.log('Raw bids from database:', JSON.stringify(bidsWithUser, null, 2));
    
    const processedBids = bidsWithUser.map(bid => {
      let documents = [];
      if (bid.documents) {
        try {
          // Обрабатываем различные форматы сохранения документов
          let parsedDocs = bid.documents;
          
          // Если это строка, пытаемся распарсить
          if (typeof parsedDocs === 'string') {
            parsedDocs = JSON.parse(parsedDocs);
          }
          
          // Если после первого парсинга получили строку, парсим еще раз
          if (typeof parsedDocs === 'string') {
            parsedDocs = JSON.parse(parsedDocs);
          }
          
          // Убеждаемся, что это массив
          if (Array.isArray(parsedDocs)) {
            documents = parsedDocs;
          } else if (parsedDocs) {
            documents = [parsedDocs];
          }
          
          console.log(`Parsed documents for bid ${bid.id}:`, documents);
        } catch (e) {
          console.error(`Error parsing documents for bid ${bid.id}:`, e);
          console.error(`Raw documents value:`, bid.documents);
          // Пытаемся обработать как простую строку
          if (typeof bid.documents === 'string' && bid.documents.trim() && bid.documents !== '[]' && bid.documents !== '""') {
            documents = [bid.documents];
          } else {
            documents = [];
          }
        }
      }
      
      const processedBid = {
        ...bid,
        documents,
        user: {
          id: bid.userId,
          username: bid.username,
          fullName: bid.first_name && bid.last_name 
            ? `${bid.first_name} ${bid.last_name}` 
            : bid.username,
          rating: bid.rating || 0,
          avatar: bid.avatar,
          email: bid.email,
          phone: bid.phone
        }
      };
      
      console.log(`Processed bid ${bid.id}:`, JSON.stringify(processedBid, null, 2));
      return processedBid;
    });
    
    return processedBids;
  }

  async getTenderBid(id: number): Promise<TenderBid | undefined> {
    const [bid] = await db.select().from(tenderBids).where(eq(tenderBids.id, id));
    return bid || undefined;
  }

  async createTenderBid(insertBid: InsertTenderBid): Promise<TenderBid> {
    // Validate that documents are provided (now required)
    if (!insertBid.documents || !Array.isArray(insertBid.documents) || insertBid.documents.length === 0) {
      throw new Error("Документы, подтверждающие профессионализм, обязательны для участия в тендере");
    }

    const bidData = {
      ...insertBid,
      documents: JSON.stringify(insertBid.documents),
      createdAt: new Date().toISOString(),
      isAccepted: false,
    };

    console.log('Creating bid with documents:', bidData.documents);

    const [bid] = await db.insert(tenderBids).values(bidData).returning();
    return bid;
  }

  async acceptTenderBid(bidId: number): Promise<TenderBid | undefined> {
    const [bid] = await db.update(tenderBids)
      .set({ isAccepted: true })
      .where(eq(tenderBids.id, bidId))
      .returning();
    return bid || undefined;
  }

  // Marketplace methods
  async getMarketplaceListings(filters?: {
    category?: string;
    subcategory?: string;
    location?: string;
    listingType?: string;
    userId?: number;
    limit?: number;
    offset?: number;
    showAll?: boolean; // Для админов, чтобы видеть все объявления
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<MarketplaceListingResponse[]> {
    let query = db.select().from(marketplaceListings);

    // Показываем только одобренные объявления, если не указано showAll
    if (!filters?.showAll) {
      // Используем SQL запрос с JOIN для получения информации о пользователе
      let sqlQuery = `
        SELECT 
          l.*,
          u.username,
          u.first_name,
          u.last_name,
          u.rating,
          u.avatar,
          u.email
        FROM marketplace_listings l
        LEFT JOIN users u ON l.userId = u.id
        WHERE l.moderation_status = 'approved'
      `;
      
      const params: any[] = [];
      
      if (filters?.category) {
        sqlQuery += ' AND l.category = ?';
        params.push(filters.category);
      }
      
      if (filters?.subcategory) {
        sqlQuery += ' AND l.subcategory = ?';
        params.push(filters.subcategory);
      }
      
      if (filters?.listingType) {
        sqlQuery += ' AND l.listing_type = ?';
        params.push(filters.listingType);
      }
      
      if (filters?.userId) {
        sqlQuery += ' AND l.userId = ?';
        params.push(filters.userId);
      }
      
      if (filters?.location) {
        sqlQuery += ' AND l.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      
      if (filters?.minPrice) {
        sqlQuery += ' AND l.price >= ?';
        params.push(filters.minPrice);
      }
      
      if (filters?.maxPrice) {
        sqlQuery += ' AND l.price <= ?';
        params.push(filters.maxPrice);
      }
      
      if (filters?.search) {
        sqlQuery += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Добавляем сортировку
      if (filters?.sortBy) {
        const sortColumn = filters.sortBy === 'price' ? 'l.price' : 
                          filters.sortBy === 'title' ? 'l.title' : 'l.createdAt';
        const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
        sqlQuery += ` ORDER BY ${sortColumn} ${sortDirection}`;
      } else {
        sqlQuery += ' ORDER BY l.createdAt DESC';
      }
      
      if (filters?.limit) {
        sqlQuery += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      if (filters?.offset) {
        sqlQuery += ' OFFSET ?';
        params.push(filters.offset);
      }

      const listingsWithUser = sqliteDb.prepare(sqlQuery).all(...params) as any[];
      
      return listingsWithUser.map(listing => ({
        ...listing,
        images: this.parseImages(listing.images),
        user: {
          id: listing.userId,
          username: listing.username,
          fullName: listing.first_name && listing.last_name 
            ? `${listing.first_name} ${listing.last_name}` 
            : listing.username,
          rating: listing.rating || 0,
          avatar: listing.avatar,
          email: listing.email
        }
      })) as MarketplaceListingResponse[];
    }

    if (filters?.category) {
      query = query.where(eq(marketplaceListings.category, filters.category));
    }
    if (filters?.userId) {
      query = query.where(eq(marketplaceListings.userId, filters.userId));
    }
    
    // Always order by creation date descending to show newest first
    query = query.orderBy(desc(marketplaceListings.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;
    return results.map(listing => ({
      ...listing,
      images: this.parseImages(listing.images),
    })) as MarketplaceListingResponse[];
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListingResponse | undefined> {
    // Используем SQL запрос с JOIN для получения информации о пользователе
    const [listingWithUser] = await sqliteDb.prepare(`
      SELECT 
        l.*,
        u.username,
        u.first_name,
        u.last_name,
        u.rating,
        u.avatar,
        u.email
      FROM marketplace_listings l
      LEFT JOIN users u ON l.userId = u.id
      WHERE l.id = ?
    `).all(id) as any[];
    
    if (!listingWithUser) return undefined;

    return {
      ...listingWithUser,
      images: this.parseImages(listingWithUser.images),
      user: {
        id: listingWithUser.userId,
        username: listingWithUser.username,
        fullName: listingWithUser.first_name && listingWithUser.last_name 
          ? `${listingWithUser.first_name} ${listingWithUser.last_name}` 
          : listingWithUser.username,
        rating: listingWithUser.rating || 0,
        avatar: listingWithUser.avatar,
        email: listingWithUser.email
      }
    } as MarketplaceListingResponse;
  }

  async createMarketplaceListing(insertListing: InsertMarketplaceListing): Promise<MarketplaceListingResponse> {
    const now = new Date().toISOString();
    
    // Handle images properly - check if already stringified
    let imagesForDb: string;
    if (typeof insertListing.images === 'string') {
      imagesForDb = insertListing.images;
    } else {
      imagesForDb = JSON.stringify(insertListing.images || []);
    }
    
    const listingData = {
      ...insertListing,
      images: imagesForDb,
      isActive: true,
      moderationStatus: 'pending' as const,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
    };

    const [listing] = await db.insert(marketplaceListings).values(listingData).returning();
    return {
      ...listing,
      images: this.parseImages(listing.images),
    };
  }

  async updateMarketplaceListing(id: number, listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const updateData = {
      ...listingData,
      updatedAt: new Date().toISOString(),
    };

    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = JSON.stringify(updateData.images);
    }

    const [listing] = await db.update(marketplaceListings).set(updateData).where(eq(marketplaceListings.id, id)).returning();
    if (!listing) return undefined;

    return {
      ...listing,
      images: listing.images ? JSON.parse(listing.images) : [],
    };
  }

  async deleteMarketplaceListing(id: number): Promise<boolean> {
    const result = await db.delete(marketplaceListings).where(eq(marketplaceListings.id, id));
    return result.changes > 0;
  }

  async incrementListingViews(id: number): Promise<void> {
    await db.update(marketplaceListings)
      .set({ viewCount: sql`${marketplaceListings.viewCount} + 1` })
      .where(eq(marketplaceListings.id, id));
  }

  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )
      );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messageData = {
      ...insertMessage,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  // Review methods
  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.revieweeId, userId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const reviewData = {
      ...insertReview,
      createdAt: new Date().toISOString(),
    };

    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async updateUserRating(userId: number): Promise<number> {
    const userReviews = await this.getUserReviews(userId);
    const avgRating = userReviews.length > 0 
      ? Math.round(userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length)
      : 0;

    await this.updateUser(userId, { rating: avgRating });
    return avgRating;
  }

  // Placeholder methods for interface compliance
  async getTopSpecialists(userType?: string): Promise<User[]> {
    // Базовый запрос для всех лучших специалистов
    let whereCondition = eq(users.isTopSpecialist, 1);
    
    // Добавляем фильтр по типу пользователя если указан
    if (userType) {
      if (userType === 'legal') {
        whereCondition = and(
          eq(users.isTopSpecialist, 1),
          or(eq(users.userType, 'company'), eq(users.userType, 'contractor'))
        );
      } else if (userType === 'individual') {
        whereCondition = and(
          eq(users.isTopSpecialist, 1),
          eq(users.userType, 'individual')
        );
      }
    }
    
    return await db.select().from(users)
      .where(whereCondition)
      .orderBy(desc(users.rating), desc(users.completedProjects))
      .limit(10);
  }

  // Методы для работы с уведомлениями
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO notifications (userId, title, message, type, related_id, is_read, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        insertNotification.userId,
        insertNotification.title,
        insertNotification.message,
        insertNotification.type,
        insertNotification.relatedId || null,
        insertNotification.isRead ? 1 : 0,
        insertNotification.createdAt || new Date().toISOString()
      );
      
      return this.getNotification(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotification(id: number): Promise<Notification> {
    const stmt = sqliteDb.prepare('SELECT * FROM notifications WHERE id = ?');
    const notification = stmt.get(id) as any;
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return {
      ...notification,
      isRead: Boolean(notification.is_read)
    };
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const stmt = sqliteDb.prepare(`
      SELECT * FROM notifications 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `);
    const notifications = stmt.all(userId) as any[];
    
    return notifications.map(notification => ({
      ...notification,
      isRead: Boolean(notification.is_read)
    }));
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const stmt = sqliteDb.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
    stmt.run(id);
    return this.getNotification(id);
  }

  // Методы для управления статусами заявок
  async approveTenderBid(bidId: number): Promise<TenderBid | undefined> {
    try {
      const stmt = sqliteDb.prepare('UPDATE tender_bids SET status = ? WHERE id = ?');
      stmt.run('approved', bidId);
      
      const bid = await this.getTenderBid(bidId);
      if (bid) {
        // Создаем уведомление для исполнителя
        await this.createNotification({
          userId: bid.userId,
          title: 'Заявка одобрена',
          message: 'Ваша заявка на участие в тендере была одобрена заказчиком',
          type: 'bid_approved',
          relatedId: bid.tenderId,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
      
      return bid;
    } catch (error) {
      console.error('Error approving tender bid:', error);
      throw error;
    }
  }

  async rejectTenderBid(bidId: number, reason?: string): Promise<TenderBid | undefined> {
    try {
      const stmt = sqliteDb.prepare('UPDATE tender_bids SET status = ?, rejection_reason = ? WHERE id = ?');
      stmt.run('rejected', reason || null, bidId);
      
      const bid = await this.getTenderBid(bidId);
      if (bid) {
        // Создаем уведомление для исполнителя
        await this.createNotification({
          userId: bid.userId,
          title: 'Заявка отклонена',
          message: reason ? `Ваша заявка была отклонена. Причина: ${reason}` : 'Ваша заявка на участие в тендере была отклонена',
          type: 'bid_rejected',
          relatedId: bid.tenderId,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
      
      return bid;
    } catch (error) {
      console.error('Error rejecting tender bid:', error);
      throw error;
    }
  }

  async getTenderBidsForApproval(tenderId: number): Promise<TenderBid[]> {
    const stmt = sqliteDb.prepare(`
      SELECT tb.*, u.username, u.fullName, u.rating, u.isVerified, u.completedProjects 
      FROM tender_bids tb
      JOIN users u ON tb.userId = u.id
      WHERE tb.tenderId = ?
      ORDER BY tb.createdAt DESC
    `);
    const bids = stmt.all(tenderId) as any[];
    
    return bids.map(bid => {
      let documents = [];
      if (bid.documents) {
        try {
          const parsed = JSON.parse(bid.documents);
          if (typeof parsed === 'string') {
            documents = JSON.parse(parsed);
          } else {
            documents = parsed;
          }
        } catch (e) {
          console.error(`Error parsing documents for bid ${bid.id}:`, e);
          documents = [];
        }
      }
      
      return {
        ...bid,
        isAccepted: Boolean(bid.isAccepted),
        documents,
        user: {
          id: bid.userId,
          username: bid.username,
          fullName: bid.fullName,
          rating: bid.rating,
          isVerified: Boolean(bid.isVerified),
          completedProjects: bid.completedProjects
        }
      };
    });
  }

  // Specialists methods
  async getSpecialists(filters?: { status?: string }): Promise<any[]> {
    try {
      let query = `
        SELECT s.*, u.username, u.first_name, u.last_name, u.rating, u.is_verified, u.completed_projects
        FROM specialists s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = 'approved'
      `;
      
      const params: any[] = [];
      
      query += ' ORDER BY s.created_at DESC';
      
      const stmt = this.db.prepare(query);
      const specialists = stmt.all(...params) as any[];
      
      return specialists.map(specialist => ({
        ...specialist,
        images: this.parseImages(specialist.images),
        specializations: this.parseImages(specialist.specializations),
        user: {
          id: specialist.user_id,
          username: specialist.username,
          fullName: specialist.first_name && specialist.last_name ? `${specialist.first_name} ${specialist.last_name}` : specialist.username,
          rating: specialist.rating,
          isVerified: Boolean(specialist.is_verified),
          completedProjects: specialist.completed_projects
        }
      }));
    } catch (error) {
      console.error('Error getting specialists:', error);
      return [];
    }
  }

  async getSpecialist(id: number): Promise<any> {
    try {
      const stmt = this.db.prepare(`
        SELECT s.*, u.username, u.first_name, u.last_name, u.rating, u.is_verified, u.completed_projects
        FROM specialists s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `);
      const specialist = stmt.get(id) as any;
      
      if (!specialist) return null;
      
      return {
        ...specialist,
        images: this.parseImages(specialist.images),
        specializations: this.parseImages(specialist.specializations),
        user: {
          id: specialist.user_id,
          username: specialist.username,
          fullName: specialist.first_name && specialist.last_name ? `${specialist.first_name} ${specialist.last_name}` : specialist.username,
          rating: specialist.rating,
          isVerified: Boolean(specialist.is_verified),
          completedProjects: specialist.completed_projects
        }
      };
    } catch (error) {
      console.error('Error getting specialist:', error);
      return null;
    }
  }

  async createSpecialist(specialistData: any): Promise<any> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO specialists (
          user_id, name, description, location, experience_years, 
          hourly_rate, specializations, images, phone, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      const images = Array.isArray(specialistData.images) ? JSON.stringify(specialistData.images) : '[]';
      const specializations = Array.isArray(specialistData.specializations) ? JSON.stringify(specialistData.specializations) : '[]';
      
      // Map frontend field names to database field names
      const userId = specialistData.user_id || specialistData.userId;
      const experienceYears = specialistData.experience_years || specialistData.experience;
      const hourlyRate = specialistData.hourly_rate || specialistData.hourlyRate;
      const phone = specialistData.phone || null;
      
      const result = stmt.run(
        userId,
        specialistData.name,
        specialistData.description,
        specialistData.location,
        experienceYears,
        hourlyRate,
        specializations,
        images,
        phone,
        'approved',
        now,
        now
      );
      
      return this.getSpecialist(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating specialist:', error);
      throw error;
    }
  }

  async updateSpecialist(id: number, specialistData: any): Promise<any> {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (specialistData.name) {
        updates.push('name = ?');
        params.push(specialistData.name);
      }
      if (specialistData.description) {
        updates.push('description = ?');
        params.push(specialistData.description);
      }
      if (specialistData.location) {
        updates.push('location = ?');
        params.push(specialistData.location);
      }
      if (specialistData.experience_years !== undefined) {
        updates.push('experience_years = ?');
        params.push(specialistData.experience_years);
      }
      if (specialistData.hourly_rate !== undefined) {
        updates.push('hourly_rate = ?');
        params.push(specialistData.hourly_rate);
      }
      if (specialistData.specializations) {
        updates.push('specializations = ?');
        params.push(Array.isArray(specialistData.specializations) ? JSON.stringify(specialistData.specializations) : specialistData.specializations);
      }
      if (specialistData.images) {
        updates.push('images = ?');
        params.push(Array.isArray(specialistData.images) ? JSON.stringify(specialistData.images) : specialistData.images);
      }
      if (specialistData.phone) {
        updates.push('phone = ?');
        params.push(specialistData.phone);
      }
      if (specialistData.status) {
        updates.push('status = ?');
        params.push(specialistData.status);
      }
      
      updates.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);
      
      const stmt = this.db.prepare(`UPDATE specialists SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...params);
      
      return this.getSpecialist(id);
    } catch (error) {
      console.error('Error updating specialist:', error);
      throw error;
    }
  }

  async deleteSpecialist(id: number): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM specialists WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting specialist:', error);
      return false;
    }
  }

  async moderateSpecialist(id: number, status: string, moderatorId: number, comment?: string): Promise<any> {
    try {
      const stmt = this.db.prepare(`
        UPDATE specialists 
        SET status = ?, moderated_by = ?, moderated_at = ?, moderation_comment = ?, updated_at = ?
        WHERE id = ?
      `);
      
      const now = new Date().toISOString();
      stmt.run(status, moderatorId, now, comment || null, now, id);
      
      return this.getSpecialist(id);
    } catch (error) {
      console.error('Error moderating specialist:', error);
      throw error;
    }
  }

  // Add minimal implementations for other required methods
  async getUserDocuments(): Promise<any[]> { return []; }
  async getUserDocument(): Promise<any> { return null; }
  async createUserDocument(): Promise<any> { return null; }
  async updateUserDocument(): Promise<any> { return null; }
  async deleteUserDocument(): Promise<boolean> { return false; }
  async getDeliveryOptions(): Promise<any[]> { return []; }
  async getDeliveryOption(): Promise<any> { return null; }
  async createDeliveryOption(): Promise<any> { return null; }
  async updateDeliveryOption(): Promise<any> { return null; }
  async deleteDeliveryOption(): Promise<boolean> { return false; }
  async getDeliveryOrders(): Promise<any[]> { return []; }
  async getDeliveryOrder(): Promise<any> { return null; }
  async createDeliveryOrder(): Promise<any> { return null; }
  async updateDeliveryOrder(): Promise<any> { return null; }
  async deleteDeliveryOrder(): Promise<boolean> { return false; }
  async getEstimates(): Promise<any[]> { return []; }
  async getEstimate(): Promise<any> { return null; }
  async createEstimate(): Promise<any> { return null; }
  async updateEstimate(): Promise<any> { return null; }
  async deleteEstimate(): Promise<boolean> { return false; }
  async getEstimateItems(): Promise<any[]> { return []; }
  async getEstimateItem(): Promise<any> { return null; }
  async createEstimateItem(): Promise<any> { return null; }
  async updateEstimateItem(): Promise<any> { return null; }
  async deleteEstimateItem(): Promise<boolean> { return false; }
  async getDesignProjects(): Promise<any[]> { return []; }
  async getDesignProject(): Promise<any> { return null; }
  async createDesignProject(): Promise<any> { return null; }
  async updateDesignProject(): Promise<any> { return null; }
  async deleteDesignProject(): Promise<boolean> { return false; }
  async getCrews(filters?: { status?: string }): Promise<any[]> { 
    try {
      let query = `
        SELECT c.*, u.username, u.first_name, u.last_name, u.rating, u.is_verified, u.completed_projects
        FROM crews c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.status = 'approved'
      `;
      
      const params: any[] = [];
      
      query += ' ORDER BY c.created_at DESC';
      
      const stmt = this.db.prepare(query);
      const crews = stmt.all(...params) as any[];
      
      return crews.map(crew => ({
        ...crew,
        images: this.parseImages(crew.images),
        user: {
          id: crew.user_id,
          username: crew.username,
          fullName: crew.first_name && crew.last_name ? `${crew.first_name} ${crew.last_name}` : crew.username,
          rating: crew.rating,
          isVerified: Boolean(crew.is_verified),
          completedProjects: crew.completed_projects
        }
      }));
    } catch (error) {
      console.error('Error getting crews:', error);
      return [];
    }
  }

  async getCrew(id: number): Promise<any> { 
    try {
      const stmt = this.db.prepare(`
        SELECT c.*, u.username, u.first_name, u.last_name, u.rating, u.is_verified, u.completed_projects
        FROM crews c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `);
      const crew = stmt.get(id) as any;
      
      if (!crew) return null;
      
      return {
        ...crew,
        images: this.parseImages(crew.images),
        user: {
          id: crew.user_id,
          username: crew.username,
          fullName: crew.first_name && crew.last_name ? `${crew.first_name} ${crew.last_name}` : crew.username,
          rating: crew.rating,
          isVerified: Boolean(crew.is_verified),
          completedProjects: crew.completed_projects
        }
      };
    } catch (error) {
      console.error('Error getting crew:', error);
      return null;
    }
  }

  async createCrew(crewData: any): Promise<any> { 
    try {
      console.log('Creating crew with data:', crewData);
      
      const stmt = this.db.prepare(`
        INSERT INTO crews (
          user_id, name, description, location, experience_years, 
          team_size, hourly_rate, specializations, images, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      const images = Array.isArray(crewData.images) ? JSON.stringify(crewData.images) : '[]';
      const specializations = Array.isArray(crewData.specializations) ? JSON.stringify(crewData.specializations) : '[]';
      
      // Map frontend field names to database field names
      const userId = crewData.user_id || crewData.userId;
      const experienceYears = crewData.experience_years || crewData.experience;
      const teamSize = crewData.team_size || crewData.teamSize || crewData.memberCount;
      const hourlyRate = crewData.hourly_rate || crewData.hourlyRate || crewData.dailyRate;
      
      console.log('Mapped values:', {
        userId,
        name: crewData.name,
        description: crewData.description,
        location: crewData.location,
        experienceYears,
        teamSize,
        hourlyRate,
        specializations,
        images
      });
      
      const result = stmt.run(
        userId,
        crewData.name,
        crewData.description,
        crewData.location,
        experienceYears,
        teamSize,
        hourlyRate,
        specializations,
        images,
        'approved',
        now,
        now
      );
      
      return this.getCrew(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating crew:', error);
      throw error;
    }
  }

  async updateCrew(id: number, crewData: any): Promise<any> { 
    try {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (crewData.name) {
        updates.push('name = ?');
        params.push(crewData.name);
      }
      if (crewData.description) {
        updates.push('description = ?');
        params.push(crewData.description);
      }
      if (crewData.location) {
        updates.push('location = ?');
        params.push(crewData.location);
      }
      if (crewData.experience_years !== undefined) {
        updates.push('experience_years = ?');
        params.push(crewData.experience_years);
      }
      if (crewData.team_size !== undefined) {
        updates.push('team_size = ?');
        params.push(crewData.team_size);
      }
      if (crewData.hourly_rate !== undefined) {
        updates.push('hourly_rate = ?');
        params.push(crewData.hourly_rate);
      }
      if (crewData.specializations) {
        updates.push('specializations = ?');
        params.push(Array.isArray(crewData.specializations) ? JSON.stringify(crewData.specializations) : crewData.specializations);
      }
      if (crewData.images) {
        updates.push('images = ?');
        params.push(Array.isArray(crewData.images) ? JSON.stringify(crewData.images) : crewData.images);
      }
      if (crewData.status) {
        updates.push('status = ?');
        params.push(crewData.status);
      }
      
      updates.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);
      
      const stmt = this.db.prepare(`UPDATE crews SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...params);
      
      return this.getCrew(id);
    } catch (error) {
      console.error('Error updating crew:', error);
      throw error;
    }
  }

  async deleteCrew(id: number): Promise<boolean> { 
    try {
      const stmt = this.db.prepare('DELETE FROM crews WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting crew:', error);
      return false;
    }
  }

  async moderateCrew(id: number, status: string, moderatorId: number, comment?: string): Promise<any> {
    try {
      const stmt = this.db.prepare(`
        UPDATE crews 
        SET status = ?, moderated_by = ?, moderated_at = ?, moderation_comment = ?, updated_at = ?
        WHERE id = ?
      `);
      
      const now = new Date().toISOString();
      stmt.run(status, moderatorId, now, comment || null, now, id);
      
      return this.getCrew(id);
    } catch (error) {
      console.error('Error moderating crew:', error);
      throw error;
    }
  }
  async getCrewMembers(): Promise<any[]> { return []; }
  async getCrewMember(): Promise<any> { return null; }
  async createCrewMember(): Promise<any> { return null; }
  async updateCrewMember(): Promise<any> { return null; }
  async deleteCrewMember(): Promise<boolean> { return false; }
  async getCrewPortfolios(): Promise<any[]> { return []; }
  async getCrewPortfolio(): Promise<any> { return null; }
  async createCrewPortfolio(): Promise<any> { return null; }
  async updateCrewPortfolio(): Promise<any> { return null; }
  async deleteCrewPortfolio(): Promise<boolean> { return false; }
  async getCrewMemberSkills(): Promise<any[]> { return []; }
  async getCrewMemberSkill(): Promise<any> { return null; }
  async createCrewMemberSkill(): Promise<any> { return null; }
  async updateCrewMemberSkill(): Promise<any> { return null; }
  async deleteCrewMemberSkill(): Promise<boolean> { return false; }
}

export const simpleSqliteStorage = new SimpleSQLiteStorage();
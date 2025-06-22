import { eq, and, like, or, between, sql } from 'drizzle-orm';
import { db, sqliteDb } from './db-sqlite';
import { IStorage } from './storage';
import {
  users, tenders, tenderBids, marketplaceListings, messages, reviews,
  userDocuments, deliveryOptions, deliveryOrders, estimates, estimateItems, designProjects,
  crews, crewMembers, crewPortfolios, crewMemberSkills, bankGuarantees,
  type User, type InsertUser,
  type UserDocument, type InsertUserDocument,
  type Tender, type InsertTender,
  type TenderBid, type InsertTenderBid,
  type MarketplaceListing, type InsertMarketplaceListing,
  type Message, type InsertMessage,
  type Review, type InsertReview,
  type DeliveryOption, type InsertDeliveryOption,
  type DeliveryOrder, type InsertDeliveryOrder,
  type Estimate, type InsertEstimate,
  type EstimateItem, type InsertEstimateItem,
  type DesignProject, type InsertDesignProject,
  type Crew, type InsertCrew,
  type CrewMember, type InsertCrewMember, 
  type CrewPortfolio, type InsertCrewPortfolio,
  type CrewMemberSkill, type InsertCrewMemberSkill,
  type BankGuarantee, type InsertBankGuarantee
} from '@shared/schema';

// Преобразование строки JSON в массив строк
function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try {
    // Проверяем, является ли json уже массивом
    if (Array.isArray(json)) return json;
    
    // Проверяем, начинается ли строка с '[' (признак JSON массива)
    if (typeof json === 'string' && json.trim().startsWith('[')) {
      return JSON.parse(json);
    }
    
    // Если это строка URL без квадратных скобок, обернем в массив
    if (typeof json === 'string' && json.includes('http')) {
      return [json];
    }
    
    // Стандартный парсинг JSON
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    // Если это похоже на URL, но не удалось распарсить как JSON, вернем как один элемент массива
    if (typeof json === 'string' && (json.includes('http') || json.includes('www'))) {
      return [json];
    }
    return [];
  }
}

export class SQLiteStorage implements IStorage {
  // Методы для работы с пользователями
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      // Store current date for timestamps
      const now = new Date();
      const nowStr = now.toISOString();
      
      // Используем prepared statement SQLite напрямую
      const stmt = sqliteDb.prepare(`
        INSERT INTO users (
          username, password, email, phone, full_name, 
          user_type, location, bio, avatar, inn, website, wallet_balance, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
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
        // Инициализируем кошелек нулевым значением, если не указано
        // @ts-ignore - walletBalance может быть не в типе
        user.walletBalance !== undefined ? user.walletBalance : 0,
        nowStr,
        nowStr
      );
      
      if (!result.lastInsertRowid) {
        throw new Error("Failed to create user");
      }
      
      // Получаем созданного пользователя по ID
      const getUserStmt = sqliteDb.prepare(`
        SELECT * FROM users WHERE id = ?
      `);
      
      const newUser = getUserStmt.get(Number(result.lastInsertRowid)) as User;
      
      if (!newUser) {
        throw new Error("User created but could not be retrieved");
      }
      
      return newUser;
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      throw error;
    }
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    // Создаем копию данных для обновления
    const updatedData = {...userData};
    
    // Удаляем проблемное поле updatedAt, так как оно будет установлено в SQL запросе
    delete updatedData.updatedAt;
    
    try {
      // Используем SQL напрямую для обновления пользователя
      const stmt = sqliteDb.prepare(`
        UPDATE users
        SET ${Object.keys(updatedData).map(key => {
          // Преобразуем camelCase в snake_case для SQL
          const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          return `${snakeKey} = ?`;
        }).join(', ')}, updated_at = ?
        WHERE id = ?
      `);
      
      // Получаем значения для SQL запроса
      const values = [...Object.values(updatedData), new Date().toISOString(), id];
      stmt.run(...values);
      
      // Получаем обновленного пользователя
      const getUserStmt = sqliteDb.prepare(`SELECT * FROM users WHERE id = ?`);
      const updatedUser = getUserStmt.get(id) as User;
      return updatedUser;
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      throw error;
    }
  }
  
  async getTopSpecialists(personType: string): Promise<User[]> {
    // Тип персоны: 'individual' или 'legal'
    const userTypeValue = personType === 'individual' ? 'individual' : 'company';
    
    // Получаем пользователей соответствующего типа, сортированных по рейтингу и количеству завершенных проектов
    const topUsers = await db
      .select()
      .from(users)
      .where(eq(users.userType, userTypeValue))
      .orderBy(
        sql`${users.rating} DESC, ${users.completedProjects} DESC`
      )
      .limit(10); // Ограничиваем результаты до 10 пользователей
    
    return topUsers;
  }

  // Методы для работы с документами пользователей
  
  async getUserDocuments(userId: number): Promise<UserDocument[]> {
    return await db.select().from(userDocuments).where(eq(userDocuments.userId, userId));
  }
  
  async getUserDocument(id: number): Promise<UserDocument | undefined> {
    const [document] = await db.select().from(userDocuments).where(eq(userDocuments.id, id));
    return document;
  }
  
  async createUserDocument(document: InsertUserDocument): Promise<UserDocument> {
    const [newDocument] = await db.insert(userDocuments).values(document).returning();
    return newDocument;
  }
  
  async updateUserDocument(id: number, documentData: Partial<UserDocument>): Promise<UserDocument | undefined> {
    const [updatedDocument] = await db
      .update(userDocuments)
      .set(documentData)
      .where(eq(userDocuments.id, id))
      .returning();
    return updatedDocument;
  }
  
  async deleteUserDocument(id: number): Promise<boolean> {
    await db.delete(userDocuments).where(eq(userDocuments.id, id));
    return true;
  }
  
  async verifyUserDocument(id: number, isVerified: boolean): Promise<UserDocument | undefined> {
    const [updatedDocument] = await db
      .update(userDocuments)
      .set({ isVerified })
      .where(eq(userDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  // Методы для работы с тендерами
  
  async getTenders(filters?: {
    category?: string;
    location?: string;
    status?: string;
    userId?: number;
    searchTerm?: string;
    personType?: string;
    requiredProfessions?: string[];
  }): Promise<Tender[]> {
    let query = db.select().from(tenders);
    
    if (filters) {
      if (filters.category) {
        query = query.where(eq(tenders.category, filters.category));
      }
      
      if (filters.location) {
        query = query.where(like(tenders.location, `%${filters.location}%`));
      }
      
      if (filters.status) {
        query = query.where(eq(tenders.status, filters.status));
      }
      
      if (filters.userId) {
        query = query.where(eq(tenders.userId, filters.userId));
      }
      
      if (filters.searchTerm) {
        query = query.where(
          or(
            like(tenders.title, `%${filters.searchTerm}%`),
            like(tenders.description, `%${filters.searchTerm}%`)
          )
        );
      }
      
      if (filters.personType) {
        query = query.where(eq(tenders.personType, filters.personType));
      }
      
      // Для фильтрации по требуемым профессиям используем LIKE для каждой профессии
      // так как требуемые профессии хранятся в JSON строке
      if (filters.requiredProfessions && filters.requiredProfessions.length > 0) {
        const professionsConditions = filters.requiredProfessions.map(profession => 
          like(tenders.requiredProfessions, `%${profession}%`)
        );
        query = query.where(or(...professionsConditions));
      }
    }
    
    const result = await query;
    
    // Преобразуем строки JSON в массивы
    return result.map(tender => ({
      ...tender,
      images: parseJsonArray(tender.images as unknown as string)
    }));
  }
  
  async getTender(id: number): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    
    if (!tender) return undefined;
    
    // Преобразуем строку JSON в массив
    return {
      ...tender,
      images: parseJsonArray(tender.images as unknown as string)
    };
  }
  
  async createTender(tender: InsertTender): Promise<Tender> {
    // Преобразуем массив в строку JSON для сохранения
    // и добавляем временные метки для SQLite (в формате ISO строки)
    const tenderData = {
      ...tender,
      images: JSON.stringify(tender.images || []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const [newTender] = await db.insert(tenders).values(tenderData).returning();
    
    // Преобразуем обратно строку JSON в массив для возврата
    return {
      ...newTender,
      images: parseJsonArray(newTender.images as unknown as string)
    };
  }
  
  async updateTender(id: number, tenderData: Partial<Tender>): Promise<Tender | undefined> {
    // Если обновляются изображения, преобразуем их в JSON
    const data = { ...tenderData };
    if (data.images) {
      data.images = JSON.stringify(data.images);
    }
    
    const [updatedTender] = await db
      .update(tenders)
      .set(data)
      .where(eq(tenders.id, id))
      .returning();
    
    if (!updatedTender) return undefined;
    
    // Преобразуем строку JSON в массив для возврата
    return {
      ...updatedTender,
      images: parseJsonArray(updatedTender.images as unknown as string)
    };
  }
  
  async deleteTender(id: number): Promise<boolean> {
    await db.delete(tenders).where(eq(tenders.id, id));
    return true;
  }
  
  async incrementTenderViews(id: number): Promise<void> {
    await db
      .update(tenders)
      .set({ viewCount: sql`${tenders.viewCount} + 1` })
      .where(eq(tenders.id, id));
  }

  // Методы для работы с заявками на тендеры
  
  async getTenderBids(tenderId: number): Promise<TenderBid[]> {
    return await db.select().from(tenderBids).where(eq(tenderBids.tenderId, tenderId));
  }
  
  async getTenderBid(id: number): Promise<TenderBid | undefined> {
    const [bid] = await db.select().from(tenderBids).where(eq(tenderBids.id, id));
    return bid;
  }
  
  async createTenderBid(bid: InsertTenderBid): Promise<TenderBid> {
    // Добавляем временную метку для SQLite в формате ISO строки
    const bidWithTimestamp = {
      ...bid,
      createdAt: new Date().toISOString()
    };
    const [newBid] = await db.insert(tenderBids).values(bidWithTimestamp).returning();
    return newBid;
  }
  
  async acceptTenderBid(bidId: number): Promise<TenderBid | undefined> {
    // Получаем заявку, чтобы узнать ID тендера
    const [bid] = await db.select().from(tenderBids).where(eq(tenderBids.id, bidId));
    
    if (!bid) return undefined;
    
    // Обновляем статус тендера на "in_progress"
    await db
      .update(tenders)
      .set({ status: 'in_progress' })
      .where(eq(tenders.id, bid.tenderId));
    
    // Принимаем эту заявку
    const [updatedBid] = await db
      .update(tenderBids)
      .set({ isAccepted: true })
      .where(eq(tenderBids.id, bidId))
      .returning();
    
    return updatedBid;
  }

  // Методы для работы с объявлениями маркетплейса
  
  async getMarketplaceListings(filters?: {
    category?: string;
    subcategory?: string;
    listingType?: string;
    location?: string;
    userId?: number;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
  }): Promise<MarketplaceListing[]> {
    let query = db.select().from(marketplaceListings);
    
    if (filters) {
      if (filters.category) {
        query = query.where(eq(marketplaceListings.category, filters.category));
      }
      
      if (filters.subcategory) {
        query = query.where(eq(marketplaceListings.subcategory, filters.subcategory));
      }
      
      if (filters.listingType) {
        query = query.where(eq(marketplaceListings.listingType, filters.listingType));
      }
      
      if (filters.location) {
        query = query.where(like(marketplaceListings.location, `%${filters.location}%`));
      }
      
      if (filters.userId) {
        query = query.where(eq(marketplaceListings.userId, filters.userId));
      }
      
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        query = query.where(
          between(marketplaceListings.price, filters.minPrice, filters.maxPrice)
        );
      } else if (filters.minPrice !== undefined) {
        query = query.where(sql`${marketplaceListings.price} >= ${filters.minPrice}`);
      } else if (filters.maxPrice !== undefined) {
        query = query.where(sql`${marketplaceListings.price} <= ${filters.maxPrice}`);
      }
      
      if (filters.searchTerm) {
        query = query.where(
          or(
            like(marketplaceListings.title, `%${filters.searchTerm}%`),
            like(marketplaceListings.description, `%${filters.searchTerm}%`)
          )
        );
      }
    }
    
    const result = await query;
    
    // Преобразуем строки JSON в массивы
    return result.map(listing => ({
      ...listing,
      images: parseJsonArray(listing.images as unknown as string)
    }));
  }
  
  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    const [listing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id));
    
    if (!listing) return undefined;
    
    // Преобразуем строку JSON в массив
    return {
      ...listing,
      images: parseJsonArray(listing.images as unknown as string)
    };
  }
  
  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    // Преобразуем массив в строку JSON для сохранения
    // и добавляем временные метки для SQLite в формате ISO строк
    const listingData = {
      ...listing,
      images: JSON.stringify(listing.images || []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const [newListing] = await db.insert(marketplaceListings).values(listingData).returning();
    
    // Преобразуем обратно строку JSON в массив для возврата
    return {
      ...newListing,
      images: parseJsonArray(newListing.images as unknown as string)
    };
  }
  
  async updateMarketplaceListing(id: number, listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined> {
    // Если обновляются изображения, преобразуем их в JSON
    const data = { ...listingData };
    if (data.images) {
      data.images = JSON.stringify(data.images);
    }
    
    const [updatedListing] = await db
      .update(marketplaceListings)
      .set(data)
      .where(eq(marketplaceListings.id, id))
      .returning();
    
    if (!updatedListing) return undefined;
    
    // Преобразуем строку JSON в массив для возврата
    return {
      ...updatedListing,
      images: parseJsonArray(updatedListing.images as unknown as string)
    };
  }
  
  async deleteMarketplaceListing(id: number): Promise<boolean> {
    await db.delete(marketplaceListings).where(eq(marketplaceListings.id, id));
    return true;
  }
  
  async incrementListingViews(id: number): Promise<void> {
    await db
      .update(marketplaceListings)
      .set({ viewCount: sql`${marketplaceListings.viewCount} + 1` })
      .where(eq(marketplaceListings.id, id));
  }

  // Методы для работы с сообщениями
  
  async getMessages(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    // Добавляем временную метку для SQLite в виде ISO строки
    const messageWithTimestamp = {
      ...message,
      createdAt: new Date().toISOString()
    };
    const [newMessage] = await db.insert(messages).values(messageWithTimestamp).returning();
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  // Методы для работы с отзывами
  
  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.recipientId, userId));
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    // Добавляем временную метку для SQLite в формате ISO строки
    const reviewWithTimestamp = {
      ...review,
      createdAt: new Date().toISOString()
    };
    const [newReview] = await db.insert(reviews).values(reviewWithTimestamp).returning();
    return newReview;
  }
  
  async updateUserRating(userId: number): Promise<number> {
    // Получаем все отзывы о пользователе
    const userReviews = await db.select().from(reviews).where(eq(reviews.recipientId, userId));
    
    if (userReviews.length === 0) return 0;
    
    // Вычисляем среднюю оценку
    const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round(totalRating / userReviews.length);
    
    // Обновляем рейтинг пользователя
    const [updatedUser] = await db
      .update(users)
      .set({ rating: averageRating })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser.rating;
  }

  // Методы для работы с опциями доставки
  
  async getDeliveryOptions(): Promise<DeliveryOption[]> {
    return await db.select().from(deliveryOptions).where(eq(deliveryOptions.isActive, true));
  }
  
  async getDeliveryOption(id: number): Promise<DeliveryOption | undefined> {
    const [option] = await db.select().from(deliveryOptions).where(eq(deliveryOptions.id, id));
    return option;
  }
  
  async createDeliveryOption(option: InsertDeliveryOption): Promise<DeliveryOption> {
    const [newOption] = await db.insert(deliveryOptions).values(option).returning();
    return newOption;
  }
  
  async updateDeliveryOption(id: number, optionData: Partial<DeliveryOption>): Promise<DeliveryOption | undefined> {
    const [updatedOption] = await db
      .update(deliveryOptions)
      .set(optionData)
      .where(eq(deliveryOptions.id, id))
      .returning();
    return updatedOption;
  }
  
  async deleteDeliveryOption(id: number): Promise<boolean> {
    await db
      .update(deliveryOptions)
      .set({ isActive: false })
      .where(eq(deliveryOptions.id, id));
    return true;
  }

  // Методы для работы с заказами доставки
  
  async getDeliveryOrders(userId?: number): Promise<DeliveryOrder[]> {
    if (userId) {
      return await db.select().from(deliveryOrders).where(eq(deliveryOrders.userId, userId));
    }
    return await db.select().from(deliveryOrders);
  }
  
  async getDeliveryOrder(id: number): Promise<DeliveryOrder | undefined> {
    const [order] = await db.select().from(deliveryOrders).where(eq(deliveryOrders.id, id));
    return order;
  }
  
  async createDeliveryOrder(order: InsertDeliveryOrder): Promise<DeliveryOrder> {
    // Добавляем временные метки для SQLite
    const orderWithTimestamps = {
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const [newOrder] = await db.insert(deliveryOrders).values(orderWithTimestamps).returning();
    return newOrder;
  }
  
  async updateDeliveryOrderStatus(id: number, status: string): Promise<DeliveryOrder | undefined> {
    const [updatedOrder] = await db
      .update(deliveryOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(deliveryOrders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async updateDeliveryOrderTracking(id: number, trackingCode: string): Promise<DeliveryOrder | undefined> {
    const [updatedOrder] = await db
      .update(deliveryOrders)
      .set({ trackingCode, updatedAt: new Date() })
      .where(eq(deliveryOrders.id, id))
      .returning();
    return updatedOrder;
  }

  // Методы для работы со сметами
  
  async getEstimates(userId?: number, tenderId?: number): Promise<Estimate[]> {
    if (userId && tenderId) {
      return await db
        .select()
        .from(estimates)
        .where(
          and(
            eq(estimates.userId, userId),
            eq(estimates.tenderId, tenderId)
          )
        );
    } else if (userId) {
      return await db.select().from(estimates).where(eq(estimates.userId, userId));
    } else if (tenderId) {
      return await db.select().from(estimates).where(eq(estimates.tenderId, tenderId));
    }
    return await db.select().from(estimates);
  }
  
  async getEstimate(id: number): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate;
  }
  
  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    // Добавляем временные метки для SQLite
    const estimateWithTimestamps = {
      ...estimate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const [newEstimate] = await db.insert(estimates).values(estimateWithTimestamps).returning();
    return newEstimate;
  }
  
  async updateEstimate(id: number, estimateData: Partial<Estimate>): Promise<Estimate | undefined> {
    const data = { ...estimateData, updatedAt: new Date() };
    
    const [updatedEstimate] = await db
      .update(estimates)
      .set(data)
      .where(eq(estimates.id, id))
      .returning();
    
    return updatedEstimate;
  }
  
  async deleteEstimate(id: number): Promise<boolean> {
    await db.delete(estimates).where(eq(estimates.id, id));
    return true;
  }
  
  async updateEstimateStatus(id: number, status: string): Promise<Estimate | undefined> {
    const [updatedEstimate] = await db
      .update(estimates)
      .set({ status, updatedAt: new Date() })
      .where(eq(estimates.id, id))
      .returning();
    
    return updatedEstimate;
  }

  // Методы для работы с позициями сметы
  
  async getEstimateItems(estimateId: number): Promise<EstimateItem[]> {
    return await db.select().from(estimateItems).where(eq(estimateItems.estimateId, estimateId));
  }
  
  async getEstimateItem(id: number): Promise<EstimateItem | undefined> {
    const [item] = await db.select().from(estimateItems).where(eq(estimateItems.id, id));
    return item;
  }
  
  async createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem> {
    const [newItem] = await db.insert(estimateItems).values(item).returning();
    return newItem;
  }
  
  async updateEstimateItem(id: number, itemData: Partial<EstimateItem>): Promise<EstimateItem | undefined> {
    const [updatedItem] = await db
      .update(estimateItems)
      .set(itemData)
      .where(eq(estimateItems.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async deleteEstimateItem(id: number): Promise<boolean> {
    await db.delete(estimateItems).where(eq(estimateItems.id, id));
    return true;
  }

  // Методы для работы с дизайн-проектами
  
  async getDesignProjects(userId?: number): Promise<DesignProject[]> {
    if (userId) {
      return await db.select().from(designProjects).where(eq(designProjects.userId, userId));
    }
    return await db.select().from(designProjects);
  }
  
  async getDesignProject(id: number): Promise<DesignProject | undefined> {
    const [project] = await db.select().from(designProjects).where(eq(designProjects.id, id));
    
    if (!project) return undefined;
    
    // Преобразуем строки JSON в массивы
    return {
      ...project,
      visualizationUrls: parseJsonArray(project.visualizationUrls as unknown as string),
      projectFiles: parseJsonArray(project.projectFiles as unknown as string)
    };
  }
  
  async createDesignProject(project: InsertDesignProject): Promise<DesignProject> {
    // Преобразуем массивы в строки JSON для сохранения
    const projectData = {
      ...project,
      visualizationUrls: JSON.stringify(project.visualizationUrls || []),
      projectFiles: JSON.stringify(project.projectFiles || [])
    };
    
    const [newProject] = await db.insert(designProjects).values(projectData).returning();
    
    // Преобразуем обратно строки JSON в массивы для возврата
    return {
      ...newProject,
      visualizationUrls: parseJsonArray(newProject.visualizationUrls as unknown as string),
      projectFiles: parseJsonArray(newProject.projectFiles as unknown as string)
    };
  }
  
  async updateDesignProject(id: number, projectData: Partial<DesignProject>): Promise<DesignProject | undefined> {
    // Если обновляются массивы, преобразуем их в JSON
    const data = { ...projectData, updatedAt: new Date() };
    if (data.visualizationUrls) {
      data.visualizationUrls = JSON.stringify(data.visualizationUrls);
    }
    if (data.projectFiles) {
      data.projectFiles = JSON.stringify(data.projectFiles);
    }
    
    const [updatedProject] = await db
      .update(designProjects)
      .set(data)
      .where(eq(designProjects.id, id))
      .returning();
    
    if (!updatedProject) return undefined;
    
    // Преобразуем строки JSON в массивы для возврата
    return {
      ...updatedProject,
      visualizationUrls: parseJsonArray(updatedProject.visualizationUrls as unknown as string),
      projectFiles: parseJsonArray(updatedProject.projectFiles as unknown as string)
    };
  }
  
  async deleteDesignProject(id: number): Promise<boolean> {
    await db.delete(designProjects).where(eq(designProjects.id, id));
    return true;
  }
  
  async updateDesignProjectStatus(id: number, status: string): Promise<DesignProject | undefined> {
    const [updatedProject] = await db
      .update(designProjects)
      .set({ status, updatedAt: new Date() })
      .where(eq(designProjects.id, id))
      .returning();
    
    if (!updatedProject) return undefined;
    
    // Преобразуем строки JSON в массивы для возврата
    return {
      ...updatedProject,
      visualizationUrls: parseJsonArray(updatedProject.visualizationUrls as unknown as string),
      projectFiles: parseJsonArray(updatedProject.projectFiles as unknown as string)
    };
  }
  
  async addProjectVisualization(id: number, visualizationUrl: string): Promise<DesignProject | undefined> {
    // Получаем текущий проект
    const [project] = await db.select().from(designProjects).where(eq(designProjects.id, id));
    
    if (!project) return undefined;
    
    // Получаем текущие визуализации и добавляем новую
    const currentVisualizations = parseJsonArray(project.visualizationUrls as unknown as string);
    currentVisualizations.push(visualizationUrl);
    
    // Обновляем проект
    const [updatedProject] = await db
      .update(designProjects)
      .set({
        visualizationUrls: JSON.stringify(currentVisualizations),
        updatedAt: new Date()
      })
      .where(eq(designProjects.id, id))
      .returning();
    
    // Преобразуем строки JSON в массивы для возврата
    return {
      ...updatedProject,
      visualizationUrls: parseJsonArray(updatedProject.visualizationUrls as unknown as string),
      projectFiles: parseJsonArray(updatedProject.projectFiles as unknown as string)
    };
  }
  
  async addProjectFile(id: number, fileUrl: string): Promise<DesignProject | undefined> {
    // Получаем текущий проект
    const [project] = await db.select().from(designProjects).where(eq(designProjects.id, id));
    
    if (!project) return undefined;
    
    // Получаем текущие файлы и добавляем новый
    const currentFiles = parseJsonArray(project.projectFiles as unknown as string);
    currentFiles.push(fileUrl);
    
    // Обновляем проект
    const [updatedProject] = await db
      .update(designProjects)
      .set({
        projectFiles: JSON.stringify(currentFiles),
        updatedAt: new Date()
      })
      .where(eq(designProjects.id, id))
      .returning();
    
    // Преобразуем строки JSON в массивы для возврата
    return {
      ...updatedProject,
      visualizationUrls: parseJsonArray(updatedProject.visualizationUrls as unknown as string),
      projectFiles: parseJsonArray(updatedProject.projectFiles as unknown as string)
    };
  }

  // Методы для работы с бригадами

  async getCrews(filters?: {
    location?: string;
    specialization?: string;
    experienceYears?: number;
    isVerified?: boolean;
    isAvailable?: boolean;
    searchTerm?: string;
  }): Promise<Crew[]> {
    let query = db.select().from(crews);
    
    if (filters) {
      if (filters.location) {
        query = query.where(like(crews.location, `%${filters.location}%`));
      }
      
      if (filters.specialization) {
        query = query.where(like(crews.specialization, `%${filters.specialization}%`));
      }
      
      if (filters.experienceYears !== undefined) {
        query = query.where(sql`${crews.experienceYears} >= ${filters.experienceYears}`);
      }
      
      if (filters.isVerified !== undefined) {
        query = query.where(eq(crews.isVerified, filters.isVerified));
      }
      
      if (filters.isAvailable !== undefined) {
        query = query.where(eq(crews.isAvailable, filters.isAvailable));
      }
      
      if (filters.searchTerm) {
        query = query.where(
          or(
            like(crews.name, `%${filters.searchTerm}%`),
            like(crews.description as any, `%${filters.searchTerm}%`),
            like(crews.specialization, `%${filters.searchTerm}%`)
          )
        );
      }
    }
    
    return await query;
  }
  
  async getCrew(id: number): Promise<Crew | undefined> {
    const [crew] = await db.select().from(crews).where(eq(crews.id, id));
    return crew;
  }
  
  async getCrewsByOwnerId(ownerId: number): Promise<Crew[]> {
    return await db.select().from(crews).where(eq(crews.ownerId, ownerId));
  }
  
  async createCrew(crew: InsertCrew): Promise<Crew> {
    const [newCrew] = await db.insert(crews).values(crew).returning();
    return newCrew;
  }
  
  async updateCrew(id: number, crewData: Partial<Crew>): Promise<Crew | undefined> {
    const data = { ...crewData, updatedAt: new Date() };
    
    const [updatedCrew] = await db
      .update(crews)
      .set(data)
      .where(eq(crews.id, id))
      .returning();
    
    return updatedCrew;
  }
  
  async deleteCrew(id: number): Promise<boolean> {
    await db.delete(crews).where(eq(crews.id, id));
    return true;
  }

  // Методы для работы с участниками бригады
  
  async getCrewMembers(crewId: number): Promise<CrewMember[]> {
    return await db.select().from(crewMembers).where(eq(crewMembers.crewId, crewId));
  }
  
  async getCrewMember(id: number): Promise<CrewMember | undefined> {
    const [member] = await db.select().from(crewMembers).where(eq(crewMembers.id, id));
    return member;
  }
  
  async createCrewMember(member: InsertCrewMember): Promise<CrewMember> {
    const [newMember] = await db.insert(crewMembers).values(member).returning();
    return newMember;
  }
  
  async updateCrewMember(id: number, memberData: Partial<CrewMember>): Promise<CrewMember | undefined> {
    const [updatedMember] = await db
      .update(crewMembers)
      .set(memberData)
      .where(eq(crewMembers.id, id))
      .returning();
    
    return updatedMember;
  }
  
  async deleteCrewMember(id: number): Promise<boolean> {
    await db.delete(crewMembers).where(eq(crewMembers.id, id));
    return true;
  }

  // Методы для работы с портфолио бригад
  
  async getCrewPortfolios(crewId: number): Promise<CrewPortfolio[]> {
    const result = await db.select().from(crewPortfolios).where(eq(crewPortfolios.crewId, crewId));
    
    // Преобразуем строки JSON в массивы
    return result.map(portfolio => ({
      ...portfolio,
      images: parseJsonArray(portfolio.images as unknown as string)
    }));
  }
  
  async getCrewPortfolio(id: number): Promise<CrewPortfolio | undefined> {
    const [portfolio] = await db.select().from(crewPortfolios).where(eq(crewPortfolios.id, id));
    
    if (!portfolio) return undefined;
    
    // Преобразуем строку JSON в массив
    return {
      ...portfolio,
      images: parseJsonArray(portfolio.images as unknown as string)
    };
  }
  
  async createCrewPortfolio(portfolio: InsertCrewPortfolio): Promise<CrewPortfolio> {
    // Преобразуем массив в строку JSON для сохранения
    const portfolioData = {
      ...portfolio,
      images: JSON.stringify(portfolio.images || [])
    };
    
    const [newPortfolio] = await db.insert(crewPortfolios).values(portfolioData).returning();
    
    // Преобразуем обратно строку JSON в массив для возврата
    return {
      ...newPortfolio,
      images: parseJsonArray(newPortfolio.images as unknown as string)
    };
  }
  
  async updateCrewPortfolio(id: number, portfolioData: Partial<CrewPortfolio>): Promise<CrewPortfolio | undefined> {
    // Если обновляются изображения, преобразуем их в JSON
    const data = { ...portfolioData };
    if (data.images) {
      data.images = JSON.stringify(data.images);
    }
    
    const [updatedPortfolio] = await db
      .update(crewPortfolios)
      .set(data)
      .where(eq(crewPortfolios.id, id))
      .returning();
    
    if (!updatedPortfolio) return undefined;
    
    // Преобразуем строку JSON в массив для возврата
    return {
      ...updatedPortfolio,
      images: parseJsonArray(updatedPortfolio.images as unknown as string)
    };
  }
  
  async deleteCrewPortfolio(id: number): Promise<boolean> {
    await db.delete(crewPortfolios).where(eq(crewPortfolios.id, id));
    return true;
  }

  // Методы для работы с навыками участников бригад
  
  async getCrewMemberSkills(memberId: number): Promise<CrewMemberSkill[]> {
    return await db.select().from(crewMemberSkills).where(eq(crewMemberSkills.memberId, memberId));
  }
  
  async getCrewMemberSkill(id: number): Promise<CrewMemberSkill | undefined> {
    const [skill] = await db.select().from(crewMemberSkills).where(eq(crewMemberSkills.id, id));
    return skill;
  }
  
  async createCrewMemberSkill(skill: InsertCrewMemberSkill): Promise<CrewMemberSkill> {
    const [newSkill] = await db.insert(crewMemberSkills).values(skill).returning();
    return newSkill;
  }
  
  async updateCrewMemberSkill(id: number, skillData: Partial<CrewMemberSkill>): Promise<CrewMemberSkill | undefined> {
    const [updatedSkill] = await db
      .update(crewMemberSkills)
      .set(skillData)
      .where(eq(crewMemberSkills.id, id))
      .returning();
    
    return updatedSkill;
  }
  
  async deleteCrewMemberSkill(id: number): Promise<boolean> {
    await db.delete(crewMemberSkills).where(eq(crewMemberSkills.id, id));
    return true;
  }

  // Расширенные методы для работы с тендерами (с учетом новых полей)
  
  async getTendersByPersonType(personType: string): Promise<Tender[]> {
    const result = await db.select().from(tenders).where(eq(tenders.personType as any, personType));
    
    // Преобразуем строки JSON в массивы
    return result.map(tender => ({
      ...tender,
      images: parseJsonArray(tender.images as unknown as string),
      requiredProfessions: parseJsonArray(tender.requiredProfessions as unknown as string)
    }));
  }
  
  async getTendersByRequiredProfession(profession: string): Promise<Tender[]> {
    const result = await db.select().from(tenders);
    
    // Фильтрация на стороне приложения, т.к. SQLite не поддерживает поиск внутри JSON
    const filteredTenders = result.filter(tender => {
      const professions = parseJsonArray(tender.requiredProfessions as unknown as string);
      return professions.includes(profession);
    });
    
    // Преобразуем строки JSON в массивы
    return filteredTenders.map(tender => ({
      ...tender,
      images: parseJsonArray(tender.images as unknown as string),
      requiredProfessions: parseJsonArray(tender.requiredProfessions as unknown as string)
    }));
  }

  // Методы для работы с банковскими гарантиями

  async getBankGuarantees(filters?: { 
    customerId?: number; 
    contractorId?: number; 
    status?: string;
  }): Promise<BankGuarantee[]> {
    // Строим SQL запрос на основе фильтров
    let sql = `SELECT * FROM bank_guarantees`;
    const params: any[] = [];
    
    if (filters) {
      const conditions: string[] = [];
      
      if (filters.customerId) {
        conditions.push(`customer_id = ?`);
        params.push(filters.customerId);
      }
      
      if (filters.contractorId) {
        conditions.push(`contractor_id = ?`);
        params.push(filters.contractorId);
      }
      
      if (filters.status) {
        conditions.push(`status = ?`);
        params.push(filters.status);
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }
    }
    
    // Добавляем сортировку - сначала новые
    sql += ` ORDER BY created_at DESC`;
    
    const stmt = sqliteDb.prepare(sql);
    const guarantees = stmt.all(...params) as any[];
    
    // Преобразуем даты из строк в объекты Date для совместимости с API
    return guarantees.map(guarantee => ({
      id: guarantee.id,
      customerId: guarantee.customer_id,
      contractorId: guarantee.contractor_id,
      tenderId: guarantee.tender_id,
      amount: guarantee.amount,
      description: guarantee.description,
      terms: guarantee.terms,
      startDate: guarantee.start_date ? new Date(guarantee.start_date) : null,
      endDate: guarantee.end_date ? new Date(guarantee.end_date) : null,
      status: guarantee.status,
      createdAt: guarantee.created_at ? new Date(guarantee.created_at) : null,
      updatedAt: guarantee.updated_at ? new Date(guarantee.updated_at) : null
    }));
  }

  async getBankGuarantee(id: number): Promise<BankGuarantee | undefined> {
    const stmt = sqliteDb.prepare(`
      SELECT * FROM bank_guarantees WHERE id = ?
    `);
    
    const guarantee = stmt.get(id) as any;
    
    if (!guarantee) return undefined;
    
    // Преобразуем даты из строк в объекты Date для совместимости с API
    return {
      id: guarantee.id,
      customerId: guarantee.customer_id,
      contractorId: guarantee.contractor_id,
      tenderId: guarantee.tender_id,
      amount: guarantee.amount,
      description: guarantee.description,
      terms: guarantee.terms,
      startDate: guarantee.start_date ? new Date(guarantee.start_date) : null,
      endDate: guarantee.end_date ? new Date(guarantee.end_date) : null,
      status: guarantee.status,
      createdAt: guarantee.created_at ? new Date(guarantee.created_at) : null,
      updatedAt: guarantee.updated_at ? new Date(guarantee.updated_at) : null
    };
  }

  async createBankGuarantee(insertGuarantee: InsertBankGuarantee): Promise<BankGuarantee> {
    // Используем прямой SQL запрос для создания гарантии
    const startDateStr = insertGuarantee.startDate instanceof Date 
      ? insertGuarantee.startDate.toISOString() 
      : new Date(insertGuarantee.startDate).toISOString();
      
    const endDateStr = insertGuarantee.endDate instanceof Date
      ? insertGuarantee.endDate.toISOString()
      : new Date(insertGuarantee.endDate).toISOString();
    
    const now = new Date().toISOString();
    
    const insertStmt = sqliteDb.prepare(`
      INSERT INTO bank_guarantees (
        customer_id, contractor_id, tender_id, amount, description, 
        terms, start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      insertGuarantee.customerId,
      insertGuarantee.contractorId,
      insertGuarantee.tenderId || null,
      insertGuarantee.amount,
      insertGuarantee.description,
      insertGuarantee.terms,
      startDateStr,
      endDateStr,
      insertGuarantee.status || 'pending',
      now,
      now
    );
    
    const id = result.lastInsertRowid as number;
    
    // Получаем созданную гарантию
    const selectStmt = sqliteDb.prepare(`
      SELECT * FROM bank_guarantees WHERE id = ?
    `);
    
    const guarantee = selectStmt.get(id) as any;
    
    // Преобразуем даты из строк в объекты Date для совместимости с API
    return {
      id: guarantee.id,
      customerId: guarantee.customer_id,
      contractorId: guarantee.contractor_id,
      tenderId: guarantee.tender_id,
      amount: guarantee.amount,
      description: guarantee.description,
      terms: guarantee.terms,
      startDate: guarantee.start_date ? new Date(guarantee.start_date) : null,
      endDate: guarantee.end_date ? new Date(guarantee.end_date) : null,
      status: guarantee.status,
      createdAt: guarantee.created_at ? new Date(guarantee.created_at) : null,
      updatedAt: guarantee.updated_at ? new Date(guarantee.updated_at) : null
    };
  }

  async updateBankGuaranteeStatus(id: number, status: string): Promise<BankGuarantee | undefined> {
    // Проверяем, существует ли гарантия
    const checkStmt = sqliteDb.prepare(`
      SELECT * FROM bank_guarantees WHERE id = ?
    `);
    
    const existingGuarantee = checkStmt.get(id);
    if (!existingGuarantee) return undefined;
    
    const now = new Date().toISOString();
    
    // Обновляем статус гарантии
    const updateStmt = sqliteDb.prepare(`
      UPDATE bank_guarantees
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);
    
    updateStmt.run(status, now, id);
    
    // Получаем обновленную гарантию
    const selectStmt = sqliteDb.prepare(`
      SELECT * FROM bank_guarantees WHERE id = ?
    `);
    
    const guarantee = selectStmt.get(id) as any;
    
    // Преобразуем даты из строк в объекты Date для совместимости с API
    return {
      id: guarantee.id,
      customerId: guarantee.customer_id,
      contractorId: guarantee.contractor_id,
      tenderId: guarantee.tender_id,
      amount: guarantee.amount,
      description: guarantee.description,
      terms: guarantee.terms,
      startDate: guarantee.start_date ? new Date(guarantee.start_date) : null,
      endDate: guarantee.end_date ? new Date(guarantee.end_date) : null,
      status: guarantee.status,
      createdAt: guarantee.created_at ? new Date(guarantee.created_at) : null,
      updatedAt: guarantee.updated_at ? new Date(guarantee.updated_at) : null
    };
  }
}

export const sqliteStorage = new SQLiteStorage();
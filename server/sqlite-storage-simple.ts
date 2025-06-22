import { eq, and, like, or, sql, desc } from 'drizzle-orm';
import { db } from './db-simple';
import { IStorage } from './storage';
import {
  users, tenders, tenderBids, marketplaceListings, messages, reviews,
  type User, type InsertUser,
  type Tender, type InsertTender,
  type TenderBid, type InsertTenderBid,
  type MarketplaceListing, type MarketplaceListingResponse, type InsertMarketplaceListing,
  type Message, type InsertMessage,
  type Review, type InsertReview
} from '@shared/sqlite-schema';

// Helper function to handle date strings properly
function ensureDateString(date: string | Date): string {
  if (typeof date === 'string') return date;
  return date.toISOString();
}

export class SimpleSQLiteStorage implements IStorage {
  sessionStore: any;

  // Helper method to parse images from database
  private parseImages(images: any): string[] {
    if (!images) return [];
    if (typeof images === 'string') {
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    }
    if (Array.isArray(images)) return images;
    return [];
  }

  constructor() {
    this.sessionStore = null; // Placeholder for session store
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
    limit?: number;
    offset?: number;
  }): Promise<Tender[]> {
    let query = db.select().from(tenders);

    if (filters?.category) {
      query = query.where(eq(tenders.category, filters.category));
    }
    if (filters?.status) {
      query = query.where(eq(tenders.status, filters.status));
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
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    if (!tender) return undefined;

    return {
      ...tender,
      images: tender.images ? JSON.parse(tender.images) : [],
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

    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = JSON.stringify(updateData.images);
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
    return await db.select().from(tenderBids).where(eq(tenderBids.tenderId, tenderId));
  }

  async getTenderBid(id: number): Promise<TenderBid | undefined> {
    const [bid] = await db.select().from(tenderBids).where(eq(tenderBids.id, id));
    return bid || undefined;
  }

  async createTenderBid(insertBid: InsertTenderBid): Promise<TenderBid> {
    const bidData = {
      ...insertBid,
      createdAt: new Date().toISOString(),
      isAccepted: false,
    };

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
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceListingResponse[]> {
    let query = db.select().from(marketplaceListings);

    if (filters?.category) {
      query = query.where(eq(marketplaceListings.category, filters.category));
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
    }));
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListingResponse | undefined> {
    const [listing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id));
    if (!listing) return undefined;

    return {
      ...listing,
      images: this.parseImages(listing.images),
    };
  }

  async createMarketplaceListing(insertListing: InsertMarketplaceListing): Promise<MarketplaceListingResponse> {
    const now = new Date().toISOString();
    const listingData = {
      ...insertListing,
      images: JSON.stringify(insertListing.images || []),
      isActive: true,
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
  async getTopSpecialists(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.userType, 'contractor'))
      .limit(10);
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
  async getCrews(): Promise<any[]> { return []; }
  async getCrew(): Promise<any> { return null; }
  async createCrew(): Promise<any> { return null; }
  async updateCrew(): Promise<any> { return null; }
  async deleteCrew(): Promise<boolean> { return false; }
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
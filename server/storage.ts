import {
  users, tenders, tenderBids, marketplaceListings, messages, reviews,
  userDocuments, deliveryOptions, deliveryOrders, estimates, estimateItems, designProjects,
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
  type DesignProject, type InsertDesignProject
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getTopSpecialists(personType: string): Promise<User[]>;
  
  // User documents methods
  getUserDocuments(userId: number): Promise<UserDocument[]>;
  getUserDocument(id: number): Promise<UserDocument | undefined>;
  createUserDocument(document: InsertUserDocument): Promise<UserDocument>;
  updateUserDocument(id: number, documentData: Partial<UserDocument>): Promise<UserDocument | undefined>;
  deleteUserDocument(id: number): Promise<boolean>;
  verifyUserDocument(id: number, isVerified: boolean): Promise<UserDocument | undefined>;
  
  // Tender methods
  getTenders(filters?: {
    category?: string;
    location?: string;
    status?: string;
    userId?: number;
    searchTerm?: string;
  }): Promise<Tender[]>;
  getTender(id: number): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  updateTender(id: number, tenderData: Partial<Tender>): Promise<Tender | undefined>;
  deleteTender(id: number): Promise<boolean>;
  incrementTenderViews(id: number): Promise<void>;
  
  // Tender bid methods
  getTenderBids(tenderId: number): Promise<TenderBid[]>;
  getTenderBid(id: number): Promise<TenderBid | undefined>;
  createTenderBid(bid: InsertTenderBid): Promise<TenderBid>;
  acceptTenderBid(bidId: number): Promise<TenderBid | undefined>;
  
  // Marketplace listing methods
  getMarketplaceListings(filters?: {
    category?: string;
    subcategory?: string;
    listingType?: string;
    location?: string;
    userId?: number;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
  }): Promise<MarketplaceListing[]>;
  getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  updateMarketplaceListing(id: number, listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined>;
  deleteMarketplaceListing(id: number): Promise<boolean>;
  incrementListingViews(id: number): Promise<void>;
  
  // Message methods
  getMessages(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Review methods
  getUserReviews(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateUserRating(userId: number): Promise<number>;
  
  // Delivery options methods
  getDeliveryOptions(): Promise<DeliveryOption[]>;
  getDeliveryOption(id: number): Promise<DeliveryOption | undefined>;
  createDeliveryOption(option: InsertDeliveryOption): Promise<DeliveryOption>;
  updateDeliveryOption(id: number, optionData: Partial<DeliveryOption>): Promise<DeliveryOption | undefined>;
  deleteDeliveryOption(id: number): Promise<boolean>;
  
  // Delivery orders methods
  getDeliveryOrders(userId?: number): Promise<DeliveryOrder[]>;
  getDeliveryOrder(id: number): Promise<DeliveryOrder | undefined>;
  createDeliveryOrder(order: InsertDeliveryOrder): Promise<DeliveryOrder>;
  updateDeliveryOrderStatus(id: number, status: string): Promise<DeliveryOrder | undefined>;
  updateDeliveryOrderTracking(id: number, trackingCode: string): Promise<DeliveryOrder | undefined>;
  
  // Estimate methods
  getEstimates(userId?: number, tenderId?: number): Promise<Estimate[]>;
  getEstimate(id: number): Promise<Estimate | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: number, estimateData: Partial<Estimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: number): Promise<boolean>;
  updateEstimateStatus(id: number, status: string): Promise<Estimate | undefined>;
  
  // Estimate items methods
  getEstimateItems(estimateId: number): Promise<EstimateItem[]>;
  getEstimateItem(id: number): Promise<EstimateItem | undefined>;
  createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem>;
  updateEstimateItem(id: number, itemData: Partial<EstimateItem>): Promise<EstimateItem | undefined>;
  deleteEstimateItem(id: number): Promise<boolean>;
  
  // Design project methods
  getDesignProjects(userId?: number): Promise<DesignProject[]>;
  getDesignProject(id: number): Promise<DesignProject | undefined>;
  createDesignProject(project: InsertDesignProject): Promise<DesignProject>;
  updateDesignProject(id: number, projectData: Partial<DesignProject>): Promise<DesignProject | undefined>;
  deleteDesignProject(id: number): Promise<boolean>;
  updateDesignProjectStatus(id: number, status: string): Promise<DesignProject | undefined>;
  addProjectVisualization(id: number, visualizationUrl: string): Promise<DesignProject | undefined>;
  addProjectFile(id: number, fileUrl: string): Promise<DesignProject | undefined>;
  

}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenders: Map<number, Tender>;
  private tenderBids: Map<number, TenderBid>;
  private marketplaceListings: Map<number, MarketplaceListing>;
  private messages: Map<number, Message>;
  private reviews: Map<number, Review>;
  
  private userId: number;
  private tenderId: number;
  private tenderBidId: number;
  private listingId: number;
  private messageId: number;
  private reviewId: number;

  constructor() {
    this.users = new Map();
    this.tenders = new Map();
    this.tenderBids = new Map();
    this.marketplaceListings = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    
    this.userId = 1;
    this.tenderId = 1;
    this.tenderBidId = 1;
    this.listingId = 1;
    this.messageId = 1;
    this.reviewId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      rating: 0, 
      isVerified: false, 
      completedProjects: 0,
      createdAt: timestamp 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Метод для получения лучших специалистов
  async getTopSpecialists(personType: string): Promise<User[]> {
    // Фильтруем пользователей по типу (individual или company)
    const userTypeValue = personType === 'individual' ? 'individual' : 'company';
    
    const filteredUsers = Array.from(this.users.values())
      .filter(user => user.userType === userTypeValue);
    
    // Сортируем по рейтингу и количеству завершенных проектов (если есть)
    return filteredUsers.sort((a, b) => {
      // Сначала сортируем по рейтингу (по убыванию)
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      
      // Если рейтинг одинаковый, сортируем по количеству завершенных проектов (по убыванию)
      const aCompleted = a.completedProjects || 0;
      const bCompleted = b.completedProjects || 0;
      return bCompleted - aCompleted;
    }).slice(0, 10); // Ограничиваем выборку 10 специалистами
  }

  // Tender methods
  async getTenders(filters?: {
    category?: string;
    location?: string;
    status?: string;
    userId?: number;
    searchTerm?: string;
  }): Promise<Tender[]> {
    let tenders = Array.from(this.tenders.values());
    
    if (filters) {
      if (filters.category) {
        tenders = tenders.filter(tender => tender.category === filters.category);
      }
      
      if (filters.location) {
        tenders = tenders.filter(tender => 
          tender.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      if (filters.status) {
        tenders = tenders.filter(tender => tender.status === filters.status);
      }
      
      if (filters.userId) {
        tenders = tenders.filter(tender => tender.userId === filters.userId);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        tenders = tenders.filter(tender => 
          tender.title.toLowerCase().includes(term) || 
          tender.description.toLowerCase().includes(term)
        );
      }
    }
    
    return tenders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTender(id: number): Promise<Tender | undefined> {
    return this.tenders.get(id);
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    const id = this.tenderId++;
    const timestamp = new Date();
    const tender: Tender = {
      ...insertTender,
      id,
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp,
      viewCount: 0
    };
    this.tenders.set(id, tender);
    return tender;
  }

  async updateTender(id: number, tenderData: Partial<Tender>): Promise<Tender | undefined> {
    const tender = await this.getTender(id);
    if (!tender) return undefined;
    
    const updatedTender = { 
      ...tender, 
      ...tenderData,
      updatedAt: new Date()
    };
    this.tenders.set(id, updatedTender);
    return updatedTender;
  }

  async deleteTender(id: number): Promise<boolean> {
    return this.tenders.delete(id);
  }

  async incrementTenderViews(id: number): Promise<void> {
    const tender = await this.getTender(id);
    if (tender) {
      tender.viewCount += 1;
      this.tenders.set(id, tender);
    }
  }

  // Tender bid methods
  async getTenderBids(tenderId: number): Promise<TenderBid[]> {
    return Array.from(this.tenderBids.values())
      .filter(bid => bid.tenderId === tenderId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getTenderBid(id: number): Promise<TenderBid | undefined> {
    return this.tenderBids.get(id);
  }

  async createTenderBid(insertBid: InsertTenderBid): Promise<TenderBid> {
    const id = this.tenderBidId++;
    const timestamp = new Date();
    const bid: TenderBid = {
      ...insertBid,
      id,
      isAccepted: false,
      createdAt: timestamp
    };
    this.tenderBids.set(id, bid);
    return bid;
  }

  async acceptTenderBid(bidId: number): Promise<TenderBid | undefined> {
    const bid = await this.getTenderBid(bidId);
    if (!bid) return undefined;
    
    // First, reject all other bids for this tender
    const otherBids = await this.getTenderBids(bid.tenderId);
    for (const otherBid of otherBids) {
      if (otherBid.id !== bidId) {
        otherBid.isAccepted = false;
        this.tenderBids.set(otherBid.id, otherBid);
      }
    }
    
    // Accept this bid
    const acceptedBid = { ...bid, isAccepted: true };
    this.tenderBids.set(bidId, acceptedBid);
    
    // Update tender status
    const tender = await this.getTender(bid.tenderId);
    if (tender) {
      await this.updateTender(tender.id, { status: 'in_progress' });
    }
    
    return acceptedBid;
  }

  // Marketplace listing methods
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
    let listings = Array.from(this.marketplaceListings.values())
      .filter(listing => listing.isActive);
    
    if (filters) {
      if (filters.category) {
        listings = listings.filter(listing => listing.category === filters.category);
      }
      
      if (filters.subcategory) {
        listings = listings.filter(listing => listing.subcategory === filters.subcategory);
      }
      
      if (filters.listingType) {
        listings = listings.filter(listing => listing.listingType === filters.listingType);
      }
      
      if (filters.location) {
        listings = listings.filter(listing => 
          listing.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      
      if (filters.userId) {
        listings = listings.filter(listing => listing.userId === filters.userId);
      }
      
      if (filters.minPrice !== undefined) {
        listings = listings.filter(listing => listing.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        listings = listings.filter(listing => listing.price <= filters.maxPrice!);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        listings = listings.filter(listing => 
          listing.title.toLowerCase().includes(term) || 
          listing.description.toLowerCase().includes(term)
        );
      }
    }
    
    return listings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    return this.marketplaceListings.get(id);
  }

  async createMarketplaceListing(insertListing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const id = this.listingId++;
    const timestamp = new Date();
    const listing: MarketplaceListing = {
      ...insertListing,
      id,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      viewCount: 0
    };
    this.marketplaceListings.set(id, listing);
    return listing;
  }

  async updateMarketplaceListing(id: number, listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const listing = await this.getMarketplaceListing(id);
    if (!listing) return undefined;
    
    const updatedListing = { 
      ...listing, 
      ...listingData,
      updatedAt: new Date()
    };
    this.marketplaceListings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteMarketplaceListing(id: number): Promise<boolean> {
    const listing = await this.getMarketplaceListing(id);
    if (!listing) return false;
    
    // Soft delete by marking as inactive
    listing.isActive = false;
    this.marketplaceListings.set(id, listing);
    return true;
  }

  async incrementListingViews(id: number): Promise<void> {
    const listing = await this.getMarketplaceListing(id);
    if (listing) {
      listing.viewCount += 1;
      this.marketplaceListings.set(id, listing);
    }
  }

  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.senderId === userId || message.receiverId === userId
      )
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const timestamp = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      createdAt: timestamp
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Review methods
  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.recipientId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const timestamp = new Date();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: timestamp
    };
    this.reviews.set(id, review);
    
    // Update user rating
    await this.updateUserRating(insertReview.recipientId);
    
    return review;
  }

  async updateUserRating(userId: number): Promise<number> {
    const reviews = await this.getUserReviews(userId);
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round(totalRating / reviews.length);
    
    const user = await this.getUser(userId);
    if (user) {
      user.rating = averageRating;
      this.users.set(userId, user);
    }
    
    return averageRating;
  }
}

// Импортируем реализацию базы данных
import { DatabaseStorage } from "./database-storage";
import { RefactoredStorage } from "./storage/refactored-storage";

// Используем рефакторированный storage с модульной архитектурой
// Временно оставляем старый storage как fallback
export const storage = new RefactoredStorage();
export const legacyStorage = new DatabaseStorage();

import { 
  User, InsertUser, 
  Tender, InsertTender,
  TenderBid, InsertTenderBid,
  MarketplaceListing, InsertMarketplaceListing,
  Message, InsertMessage,
  Review, InsertReview,
  Notification, InsertNotification
} from "@shared/schema";

export interface MarketplaceListingResponse extends MarketplaceListing {
  username?: string;
  first_name?: string;
  last_name?: string;
  rating?: number;
}

export interface IStorage {
  sessionStore: any;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User & { specialistData?: string }>): Promise<User | undefined>;

  // Tender methods
  getTenders(filters?: {
    category?: string;
    subcategory?: string;
    location?: string;
    status?: string;
    personType?: string;
    userId?: number;
    limit?: number;
    offset?: number;
    showAll?: boolean;
    search?: string;
    minBudget?: number;
    maxBudget?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<Tender[]>;
  getTender(id: number): Promise<Tender | undefined>;
  createTender(insertTender: InsertTender): Promise<Tender>;
  updateTender(id: number, tenderData: Partial<Tender>): Promise<Tender | undefined>;
  deleteTender(id: number): Promise<boolean>;
  incrementTenderViews(id: number): Promise<void>;

  // Tender bid methods
  getTenderBids(tenderId: number): Promise<TenderBid[]>;
  getTenderBid(id: number): Promise<TenderBid | undefined>;
  createTenderBid(insertBid: InsertTenderBid): Promise<TenderBid>;
  acceptTenderBid(bidId: number): Promise<TenderBid | undefined>;
  approveTenderBid(bidId: number): Promise<TenderBid | undefined>;
  rejectTenderBid(bidId: number, reason?: string): Promise<TenderBid | undefined>;
  getTenderBidsForApproval(tenderId: number): Promise<TenderBid[]>;

  // Marketplace methods
  getMarketplaceListings(filters?: {
    category?: string;
    subcategory?: string;
    location?: string;
    listingType?: string;
    userId?: number;
    limit?: number;
    offset?: number;
    showAll?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<MarketplaceListingResponse[]>;
  getMarketplaceListing(id: number): Promise<MarketplaceListingResponse | undefined>;
  createMarketplaceListing(insertListing: InsertMarketplaceListing): Promise<MarketplaceListingResponse>;
  updateMarketplaceListing(id: number, listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined>;
  deleteMarketplaceListing(id: number): Promise<boolean>;
  incrementListingViews(id: number): Promise<void>;

  // Message methods
  getMessages(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(insertMessage: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Review methods
  getUserReviews(userId: number): Promise<Review[]>;
  createReview(insertReview: InsertReview): Promise<Review>;
  updateUserRating(userId: number): Promise<number>;

  // Specialist methods
  getTopSpecialists(userType?: string): Promise<User[]>;

  // Notification methods
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  getNotification(id: number): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;

  // Placeholder methods for future features
  getUserDocuments(): Promise<any[]>;
  getUserDocument(): Promise<any>;
  createUserDocument(): Promise<any>;
  updateUserDocument(): Promise<any>;
  deleteUserDocument(): Promise<boolean>;

  getDeliveryOptions(): Promise<any[]>;
  getDeliveryOption(): Promise<any>;
  createDeliveryOption(): Promise<any>;
  updateDeliveryOption(): Promise<any>;
  deleteDeliveryOption(): Promise<boolean>;

  getDeliveryOrders(): Promise<any[]>;
  getDeliveryOrder(): Promise<any>;
  createDeliveryOrder(): Promise<any>;
  updateDeliveryOrder(): Promise<any>;
  deleteDeliveryOrder(): Promise<boolean>;

  getEstimates(): Promise<any[]>;
  getEstimate(): Promise<any>;
  createEstimate(): Promise<any>;
  updateEstimate(): Promise<any>;
  deleteEstimate(): Promise<boolean>;

  getEstimateItems(): Promise<any[]>;
  getEstimateItem(): Promise<any>;
  createEstimateItem(): Promise<any>;
  updateEstimateItem(): Promise<any>;
  deleteEstimateItem(): Promise<boolean>;

  getDesignProjects(): Promise<any[]>;
  getDesignProject(): Promise<any>;
  createDesignProject(): Promise<any>;
  updateDesignProject(): Promise<any>;
  deleteDesignProject(): Promise<boolean>;

  getCrews(): Promise<any[]>;
  getCrew(): Promise<any>;
  createCrew(): Promise<any>;
  updateCrew(): Promise<any>;
  deleteCrew(): Promise<boolean>;

  getCrewMembers(): Promise<any[]>;
  getCrewMember(): Promise<any>;
  createCrewMember(): Promise<any>;
  updateCrewMember(): Promise<any>;
  deleteCrewMember(): Promise<boolean>;

  getCrewPortfolios(): Promise<any[]>;
  getCrewPortfolio(): Promise<any>;
  createCrewPortfolio(): Promise<any>;
  updateCrewPortfolio(): Promise<any>;
  deleteCrewPortfolio(): Promise<boolean>;

  getCrewMemberSkills(): Promise<any[]>;
  getCrewMemberSkill(): Promise<any>;
  createCrewMemberSkill(): Promise<any>;
  updateCrewMemberSkill(): Promise<any>;
  deleteCrewMemberSkill(): Promise<boolean>;
}
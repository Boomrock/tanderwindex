import {
  User, InsertUser,
  Tender, InsertTender,
  TenderBid, InsertTenderBid,
  MarketplaceListing, MarketplaceListingResponse, InsertMarketplaceListing,
  Message, InsertMessage,
  Review, InsertReview,
  Notification, InsertNotification,
} from '@shared/schema';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getTopSpecialists(userType?: string): Promise<User[]>;

  // Tender methods
  getTenders(filters?: any): Promise<Tender[]>;
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
  getMarketplaceListings(filters?: any): Promise<MarketplaceListingResponse[]>;
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
  getSpecialistReviews(specialistId: number): Promise<Review[]>;
  getCrewReviews(crewId: number): Promise<Review[]>;
  createReview(insertReview: InsertReview): Promise<Review>;
  updateUserRating(userId: number): Promise<number>;

  // Notification methods
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  getNotification(id: number): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;

  // Specialist methods
  getSpecialists(filters?: { status?: string }): Promise<any[]>;
  getSpecialist(id: number): Promise<any>;
  createSpecialist(specialistData: any): Promise<any>;
  updateSpecialist(id: number, specialistData: any): Promise<any>;
  deleteSpecialist(id: number): Promise<boolean>;
  moderateSpecialist(id: number, status: string, moderatorId: number, comment?: string): Promise<any>;

  // Crew methods
  getCrews(filters?: { status?: string }): Promise<any[]>;
  getCrew(id: number): Promise<any>;
  createCrew(crewData: any): Promise<any>;
  updateCrew(id: number, crewData: any): Promise<any>;
  deleteCrew(id: number): Promise<boolean>;
  moderateCrew(id: number, status: string, moderatorId: number, comment?: string): Promise<any>;

  // Placeholder methods for interface compliance
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

  sessionStore?: any;
}
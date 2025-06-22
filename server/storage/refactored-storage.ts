import { IStorage } from '../storage';
import { MessageStorage } from './message-storage';
import { UserStorage } from './user-storage';
import type {
  User, InsertUser,
  Tender, InsertTender,
  TenderBid, InsertTenderBid,
  MarketplaceListing, InsertMarketplaceListing,
  Message, InsertMessage,
  Review, InsertReview,
  UserDocument, InsertUserDocument,
  DeliveryOption, InsertDeliveryOption,
  DeliveryOrder, InsertDeliveryOrder,
  Estimate, InsertEstimate,
  EstimateItem, InsertEstimateItem,
  DesignProject, InsertDesignProject,
  Crew, InsertCrew,
  CrewMember, InsertCrewMember,
  CrewPortfolio, InsertCrewPortfolio,
  CrewMemberSkill, InsertCrewMemberSkill
} from '@shared/schema';

/**
 * Рефакторированный storage с модульной архитектурой
 * Использует специализированные storage классы для каждой области
 */
export class RefactoredStorage implements IStorage {
  private messageStorage = new MessageStorage();
  private userStorage = new UserStorage();

  // === ПОЛЬЗОВАТЕЛИ ===
  async getUser(id: number): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userStorage.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.userStorage.createUser(user);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    return this.userStorage.updateUser(id, userData);
  }

  // === СООБЩЕНИЯ ===
  async getMessages(userId: number): Promise<Message[]> {
    return this.messageStorage.getMessages(userId);
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return this.messageStorage.getConversation(user1Id, user2Id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    return this.messageStorage.createMessage(message);
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    return this.messageStorage.markMessageAsRead(id);
  }

  // Временные заглушки делегируют к старому storage
  async getTenders(filters?: any): Promise<Tender[]> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getTenders(filters);
  }

  async getTender(id: number): Promise<Tender | undefined> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getTender(id);
  }

  async createTender(tender: InsertTender): Promise<Tender> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.createTender(tender);
  }

  async updateTender(id: number, tenderData: Partial<Tender>): Promise<Tender | undefined> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.updateTender(id, tenderData);
  }

  async deleteTender(id: number): Promise<boolean> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.deleteTender(id);
  }

  async incrementTenderViews(id: number): Promise<void> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.incrementTenderViews(id);
  }

  async getTenderBids(tenderId: number): Promise<TenderBid[]> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getTenderBids(tenderId);
  }

  async getTenderBid(id: number): Promise<TenderBid | undefined> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getTenderBid(id);
  }

  async createTenderBid(bid: InsertTenderBid): Promise<TenderBid> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.createTenderBid(bid);
  }

  async acceptTenderBid(bidId: number): Promise<TenderBid | undefined> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.acceptTenderBid(bidId);
  }

  async getMarketplaceListings(filters?: any): Promise<MarketplaceListing[]> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getMarketplaceListings(filters);
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getMarketplaceListing(id);
  }

  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.createMarketplaceListing(listing);
  }

  async updateMarketplaceListing(id: number, listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.updateMarketplaceListing(id, listingData);
  }

  async deleteMarketplaceListing(id: number): Promise<boolean> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.deleteMarketplaceListing(id);
  }

  async incrementListingViews(id: number): Promise<void> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.incrementListingViews(id);
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.getUserReviews(userId);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.createReview(review);
  }

  async updateUserRating(userId: number): Promise<number> {
    const { legacyStorage } = await import('../storage');
    return legacyStorage.updateUserRating(userId);
  }

  async getUserDocuments(userId: number): Promise<UserDocument[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getUserDocument(id: number): Promise<UserDocument | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createUserDocument(document: InsertUserDocument): Promise<UserDocument> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateUserDocument(id: number, documentData: Partial<UserDocument>): Promise<UserDocument | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteUserDocument(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async verifyUserDocument(id: number, isVerified: boolean): Promise<UserDocument | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getDeliveryOptions(): Promise<DeliveryOption[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getDeliveryOption(id: number): Promise<DeliveryOption | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createDeliveryOption(option: InsertDeliveryOption): Promise<DeliveryOption> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateDeliveryOption(id: number, optionData: Partial<DeliveryOption>): Promise<DeliveryOption | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteDeliveryOption(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getDeliveryOrders(userId?: number): Promise<DeliveryOrder[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getDeliveryOrder(id: number): Promise<DeliveryOrder | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createDeliveryOrder(order: InsertDeliveryOrder): Promise<DeliveryOrder> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateDeliveryOrderStatus(id: number, status: string): Promise<DeliveryOrder | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateDeliveryOrderTracking(id: number, trackingCode: string): Promise<DeliveryOrder | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getEstimates(userId?: number, tenderId?: number): Promise<Estimate[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getEstimate(id: number): Promise<Estimate | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateEstimate(id: number, estimateData: Partial<Estimate>): Promise<Estimate | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteEstimate(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateEstimateStatus(id: number, status: string): Promise<Estimate | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getEstimateItems(estimateId: number): Promise<EstimateItem[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getEstimateItem(id: number): Promise<EstimateItem | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateEstimateItem(id: number, itemData: Partial<EstimateItem>): Promise<EstimateItem | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteEstimateItem(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getDesignProjects(userId?: number): Promise<DesignProject[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getDesignProject(id: number): Promise<DesignProject | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createDesignProject(project: InsertDesignProject): Promise<DesignProject> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateDesignProject(id: number, projectData: Partial<DesignProject>): Promise<DesignProject | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteDesignProject(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateDesignProjectStatus(id: number, status: string): Promise<DesignProject | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async addProjectVisualization(id: number, visualizationUrl: string): Promise<DesignProject | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async addProjectFile(id: number, fileUrl: string): Promise<DesignProject | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrews(filters?: any): Promise<Crew[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrew(id: number): Promise<Crew | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewsByOwnerId(ownerId: number): Promise<Crew[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createCrew(crew: InsertCrew): Promise<Crew> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateCrew(id: number, crewData: Partial<Crew>): Promise<Crew | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteCrew(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewMembers(crewId: number): Promise<CrewMember[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewMember(id: number): Promise<CrewMember | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createCrewMember(member: InsertCrewMember): Promise<CrewMember> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateCrewMember(id: number, memberData: Partial<CrewMember>): Promise<CrewMember | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteCrewMember(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewPortfolios(crewId: number): Promise<CrewPortfolio[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewPortfolio(id: number): Promise<CrewPortfolio | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createCrewPortfolio(portfolio: InsertCrewPortfolio): Promise<CrewPortfolio> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateCrewPortfolio(id: number, portfolioData: Partial<CrewPortfolio>): Promise<CrewPortfolio | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteCrewPortfolio(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewMemberSkills(memberId: number): Promise<CrewMemberSkill[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getCrewMemberSkill(id: number): Promise<CrewMemberSkill | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async createCrewMemberSkill(skill: InsertCrewMemberSkill): Promise<CrewMemberSkill> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async updateCrewMemberSkill(id: number, skillData: Partial<CrewMemberSkill>): Promise<CrewMemberSkill | undefined> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async deleteCrewMemberSkill(id: number): Promise<boolean> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getTendersByPersonType(personType: string): Promise<Tender[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }

  async getTendersByRequiredProfession(profession: string): Promise<Tender[]> {
    throw new Error('Not implemented yet - will be refactored next');
  }


}
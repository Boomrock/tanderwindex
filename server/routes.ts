import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { sqliteStorage as storage } from "./sqlite-storage";
import { sqliteDb, db } from "./db-sqlite";
import { 
  insertUserSchema, 
  insertTenderSchema, 
  insertTenderBidSchema, 
  insertMarketplaceListingSchema, 
  insertMessageSchema, 
  insertReviewSchema,
  insertBankGuaranteeSchema,
  users,
  tenders,
  marketplaceListings,
  type User
} from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-token";
const TOKEN_EXPIRY = '7d';

// JWT Middleware
function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authorization required" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Middleware для проверки прав администратора
async function adminMiddleware(req: Request, res: Response, next: Function) {
  // Сначала проверяем аутентификацию
  authMiddleware(req, res, async () => {
    try {
      // Получаем пользователя из базы данных
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Проверяем, является ли пользователь администратором
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Если пользователь администратор, разрешаем доступ
      next();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Auth routes
  apiRouter.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with explicit timestamps for SQLite and initialize wallet
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        walletBalance: 0 // Явно инициализируем кошелек с нулевым балансом
      });
      
      // Дополнительная проверка - если кошелек не был создан, обновляем пользователя
      if (user && (user.walletBalance === null || user.walletBalance === undefined)) {
        console.log(`Инициализация кошелька для пользователя ${user.id}, т.к. walletBalance=${user.walletBalance}`);
        await storage.updateUser(user.id, { walletBalance: 0 });
        
        // Получаем обновленного пользователя для ответа
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser) {
          user.walletBalance = updatedUser.walletBalance;
        }
      }
      
      // Generate JWT
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Ошибка при регистрации пользователя:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // User routes
  // Получение списка всех пользователей
  apiRouter.get('/users', async (_req: Request, res: Response) => {
    try {
      // Запрашиваем всех пользователей из базы данных
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        userType: users.userType
      }).from(users);
      
      res.status(200).json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.get('/users/top', async (req: Request, res: Response) => {
    try {
      const userType = req.query.personType as string;
      if (!userType || (userType !== 'individual' && userType !== 'company' && userType !== 'legal')) {
        return res.status(400).json({ message: "Invalid user type", receivedType: userType });
      }
      
      // Получаем лучших специалистов по рейтингу и количеству выполненных проектов
      const topSpecialists = await storage.getTopSpecialists(userType);
      
      // Удаляем пароли из ответа
      const specialistsWithoutPasswords = topSpecialists.map(specialist => {
        const { password, ...specialistWithoutPassword } = specialist;
        return specialistWithoutPassword;
      });
      
      res.status(200).json(specialistsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.get('/users/me', authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.get('/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.put('/users/me', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Exclude sensitive fields
      const { password, isVerified, rating, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Tender routes
  apiRouter.get('/tenders', async (req: Request, res: Response) => {
    try {
      // Обработка параметра requiredProfessions, который приходит в виде строки с разделителями
      let requiredProfessions: string[] | undefined;
      if (req.query.requiredProfessions) {
        requiredProfessions = (req.query.requiredProfessions as string).split(',');
      }

      const filters = {
        category: req.query.category as string | undefined,
        location: req.query.location as string | undefined,
        status: req.query.status as string | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        searchTerm: req.query.search as string | undefined,
        personType: req.query.personType as string | undefined,
        requiredProfessions
      };
      
      const tenders = await storage.getTenders(filters);
      res.status(200).json(tenders);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.get('/tenders/:id', async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }
      
      const tender = await storage.getTender(tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      // Increment view count
      await storage.incrementTenderViews(tenderId);
      
      res.status(200).json(tender);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/tenders', authMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderData = insertTenderSchema.parse(req.body);
      
      const tender = await storage.createTender({
        ...tenderData,
        userId: req.user.id
      });
      
      res.status(201).json(tender);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.put('/tenders/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }
      
      const tender = await storage.getTender(tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      if (tender.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own tenders" });
      }
      
      // Only allow certain fields to be updated
      const { status, viewCount, createdAt, updatedAt, ...updateData } = req.body;
      
      const updatedTender = await storage.updateTender(tenderId, updateData);
      
      res.status(200).json(updatedTender);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.delete('/tenders/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }
      
      const tender = await storage.getTender(tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      if (tender.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own tenders" });
      }
      
      const success = await storage.deleteTender(tenderId);
      
      if (success) {
        res.status(200).json({ message: "Tender deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete tender" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Tender bid routes
  apiRouter.get('/tenders/:id/bids', async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }
      
      const bids = await storage.getTenderBids(tenderId);
      res.status(200).json(bids);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/tenders/:id/bids', authMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }
      
      const tender = await storage.getTender(tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      // Users cannot bid on their own tenders
      if (tender.userId === req.user.id) {
        return res.status(403).json({ message: "You cannot bid on your own tender" });
      }
      
      const bidData = insertTenderBidSchema.parse({
        ...req.body,
        tenderId,
        userId: req.user.id
      });
      
      const bid = await storage.createTenderBid(bidData);
      
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/tenders/bids/:id/accept', authMiddleware, async (req: Request, res: Response) => {
    try {
      const bidId = parseInt(req.params.id);
      if (isNaN(bidId)) {
        return res.status(400).json({ message: "Invalid bid ID" });
      }
      
      const bid = await storage.getTenderBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      const tender = await storage.getTender(bid.tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      // Only tender owner can accept bids
      if (tender.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only accept bids on your own tenders" });
      }
      
      const acceptedBid = await storage.acceptTenderBid(bidId);
      
      res.status(200).json(acceptedBid);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Marketplace listing routes
  apiRouter.get('/marketplace', async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        subcategory: req.query.subcategory as string | undefined,
        listingType: req.query.listingType as string | undefined,
        location: req.query.location as string | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        searchTerm: req.query.search as string | undefined
      };
      
      const listings = await storage.getMarketplaceListings(filters);
      res.status(200).json(listings);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.get('/marketplace/:id', async (req: Request, res: Response) => {
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Increment view count
      await storage.incrementListingViews(listingId);
      
      res.status(200).json(listing);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/marketplace', authMiddleware, async (req: Request, res: Response) => {
    try {
      const listingData = insertMarketplaceListingSchema.parse(req.body);
      
      const listing = await storage.createMarketplaceListing({
        ...listingData,
        userId: req.user.id
      });
      
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.put('/marketplace/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own listings" });
      }
      
      // Only allow certain fields to be updated
      const { isActive, viewCount, createdAt, updatedAt, ...updateData } = req.body;
      
      const updatedListing = await storage.updateMarketplaceListing(listingId, updateData);
      
      res.status(200).json(updatedListing);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.delete('/marketplace/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getMarketplaceListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own listings" });
      }
      
      const success = await storage.deleteMarketplaceListing(listingId);
      
      if (success) {
        res.status(200).json({ message: "Listing deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete listing" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Message routes
  apiRouter.get('/messages', authMiddleware, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages(req.user.id);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.get('/messages/:userId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const conversation = await storage.getConversation(req.user.id, otherUserId);
      res.status(200).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/messages', authMiddleware, async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      console.log('Parsed message data:', messageData);
      
      const message = await storage.createMessage(messageData);
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Message creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.put('/messages/:id/read', authMiddleware, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const message = await storage.markMessageAsRead(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Review routes
  apiRouter.get('/users/:id/reviews', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const reviews = await storage.getUserReviews(userId);
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  apiRouter.post('/reviews', authMiddleware, async (req: Request, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user.id
      });
      
      // Prevent self-reviews
      if (reviewData.reviewerId === reviewData.recipientId) {
        return res.status(400).json({ message: "You cannot review yourself" });
      }
      
      const review = await storage.createReview(reviewData);
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Bank Guarantee routes
  apiRouter.get('/guarantees', async (req: Request, res: Response) => {
    try {
      const filters = {
        customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
        contractorId: req.query.contractorId ? parseInt(req.query.contractorId as string) : undefined,
        status: req.query.status as string | undefined
      };
      
      const guarantees = await storage.getBankGuarantees(filters);
      res.status(200).json(guarantees);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.get('/guarantees/:id', async (req: Request, res: Response) => {
    try {
      const guaranteeId = parseInt(req.params.id);
      if (isNaN(guaranteeId)) {
        return res.status(400).json({ message: "Invalid guarantee ID" });
      }
      
      const guarantee = await storage.getBankGuarantee(guaranteeId);
      if (!guarantee) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      res.status(200).json(guarantee);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.post('/guarantees', authMiddleware, async (req: Request, res: Response) => {
    try {
      console.log('Request body:', req.body);
      const guaranteeData = insertBankGuaranteeSchema.parse(req.body);
      console.log('Parsed guarantee data:', guaranteeData);
      
      // Allow either the customer or the contractor to create a guarantee
      if (guaranteeData.customerId !== req.user.id && guaranteeData.contractorId !== req.user.id) {
        return res.status(403).json({ 
          message: "You can only create guarantees where you are either the customer or the contractor" 
        });
      }
      
      // Manually handle dates in guaranteeData
      const sanitizedData = {
        ...guaranteeData,
        startDate: guaranteeData.startDate ? new Date(guaranteeData.startDate) : null,
        endDate: guaranteeData.endDate ? new Date(guaranteeData.endDate) : null
      };
      
      console.log('Sanitized guarantee data:', sanitizedData);
      const guarantee = await storage.createBankGuarantee(sanitizedData);
      res.status(201).json(guarantee);
    } catch (error) {
      console.error('Error creating guarantee:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.patch('/guarantees/:id/status', authMiddleware, async (req: Request, res: Response) => {
    try {
      const guaranteeId = parseInt(req.params.id);
      if (isNaN(guaranteeId)) {
        return res.status(400).json({ message: "Invalid guarantee ID" });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status", 
          valid_statuses: validStatuses 
        });
      }
      
      // Get the guarantee to check if the user is authorized to update it
      const guarantee = await storage.getBankGuarantee(guaranteeId);
      if (!guarantee) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      // Check if the user is authorized to update the guarantee
      // Only allow customers and contractors involved in the guarantee to update status
      if (guarantee.customerId !== req.user.id && guarantee.contractorId !== req.user.id) {
        return res.status(403).json({ 
          message: "You are not authorized to update this guarantee" 
        });
      }
      
      // Update the guarantee status
      const updatedGuarantee = await storage.updateBankGuaranteeStatus(guaranteeId, status);
      if (!updatedGuarantee) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      res.status(200).json(updatedGuarantee);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Административные маршруты
  apiRouter.get('/admin/stats', adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Подсчитываем количество пользователей
      const userCountStmt = sqliteDb.prepare('SELECT COUNT(*) as count FROM users');
      const userCount = userCountStmt.get() as { count: number };
      
      // Подсчитываем количество тендеров
      const tenderCountStmt = sqliteDb.prepare('SELECT COUNT(*) as count FROM tenders');
      const tenderCount = tenderCountStmt.get() as { count: number };
      
      // Подсчитываем количество объявлений на маркетплейсе
      const listingCountStmt = sqliteDb.prepare('SELECT COUNT(*) as count FROM marketplace_listings');
      const listingCount = listingCountStmt.get() as { count: number };
      
      // Подсчитываем количество активных пользователей (создавших тендеры или объявления)
      const activeUsersStmt = sqliteDb.prepare(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM (
          SELECT user_id FROM tenders
          UNION
          SELECT user_id FROM marketplace_listings
        )
      `);
      const activeUsers = activeUsersStmt.get() as { count: number };
      
      res.status(200).json({
        stats: {
          users: userCount.count,
          tenders: tenderCount.count,
          listings: listingCount.count,
          activeUsers: activeUsers.count
        }
      });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });
  
  // Получение списка всех пользователей (для админов)
  apiRouter.get('/admin/users', adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Получаем всех пользователей
      const allUsersStmt = sqliteDb.prepare('SELECT * FROM users');
      const allUsers = allUsersStmt.all() as User[];
      
      // Удаляем пароли из ответа
      const usersWithoutPasswords = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error getting admin users list:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });
  
  // Администрирование пользователя (изменение прав, верификация и т.д.)
  apiRouter.put('/admin/users/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Разрешаем обновлять только определенные поля через админку
      const { isAdmin, isVerified, walletBalance } = req.body;
      
      // Создаем объект с данными для обновления
      const updateData: Partial<User> = {};
      
      if (isAdmin !== undefined) {
        updateData.isAdmin = isAdmin;
      }
      
      if (isVerified !== undefined) {
        updateData.isVerified = isVerified;
      }
      
      if (walletBalance !== undefined) {
        updateData.walletBalance = walletBalance;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user from admin panel:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });
  
  // Назначение пользователя администратором
  apiRouter.post('/admin/make-admin', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { isAdmin: true });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        message: "User is now an admin",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Mount the API router
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}

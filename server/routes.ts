import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { simpleSqliteStorage as storage } from "./sqlite-storage-simple";
import { sqliteDb, db, initializeDatabase, seedDatabaseIfEmpty } from "./db-simple";
import { 
  insertUserSchema, 
  insertTenderSchema, 
  insertTenderBidSchema, 
  insertMarketplaceListingSchema, 
  insertMessageSchema, 
  insertReviewSchema,
  users,
  tenders,
  marketplaceListings,
  type User
} from "@shared/sqlite-schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs from "fs";
import path from "path";

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
  
  // File upload endpoint
  apiRouter.post('/upload', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { filename, fileData, fileSize, fileType } = req.body;
      
      if (!filename || !fileData) {
        return res.status(400).json({ message: "Filename and file data required" });
      }
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = './uploads';
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Create a unique file identifier
      const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const savedFileName = `${fileId}_${filename}`;
      const filePath = `${uploadsDir}/${savedFileName}`;
      
      // Decode base64 file data and save to disk
      const base64Data = fileData.replace(/^data:.*;base64,/, '');
      
      // Decode and save the file
      try {
        fs.writeFileSync(filePath, base64Data, 'base64');
        
        // Verify file was written correctly
        const fileStats = fs.statSync(filePath);
        console.log(`File uploaded: ${filename} (${fileStats.size} bytes)`);
        
      } catch (writeError) {
        console.error(`Error writing file: ${writeError}`);
        throw writeError;
      }
      
      const fileUrl = `/api/files/${savedFileName}`;
      
      res.json({ url: fileUrl, filename: savedFileName });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed", error: (error as Error).message });
    }
  });

  // File download endpoint (requires authentication)
  apiRouter.get('/files/:filename', authMiddleware, (req: Request, res: Response) => {
    try {
      // Decode the filename parameter to handle URL-encoded names
      const filename = decodeURIComponent(req.params.filename);
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      console.log(`Download request for: ${filename}`);
      console.log(`Looking at path: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return res.status(404).json({ message: "File not found" });
      }
      
      // Extract original filename from the saved filename
      // If filename contains timestamp prefix, extract original name, otherwise use as is
      const originalName = filename.includes('_') && filename.match(/^\d+_[a-z0-9]+_/) 
        ? filename.split('_').slice(2).join('_') 
        : filename;
      
      console.log(`Original name: ${originalName}`);
      
      // Set appropriate headers for file download
      // Create ASCII-safe filename for compatibility and avoid header encoding issues
      const safeName = originalName
        .replace(/[^\w\s.-]/g, '_')  // Replace non-word characters except spaces, dots, hyphens
        .replace(/\s+/g, '_')       // Replace spaces with underscores
        .substring(0, 100);         // Limit length
      
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      
      // Determine content type based on file extension
      const ext = originalName.split('.').pop()?.toLowerCase();
      const contentTypes: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      
      const contentType = contentTypes[ext || ''] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      console.log(`Sending file as: ${safeName} (${contentType})`);
      
      // Send the actual file
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error sending file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: "File download failed", error: err.message });
          }
        } else {
          console.log(`File sent successfully: ${filename}`);
        }
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "File download failed", error: (error as Error).message });
    }
  });
  
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
        firstName: users.firstName,
        lastName: users.lastName,
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

  // Get user's own tenders
  apiRouter.get('/users/me/tenders', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userTenders = await storage.getTenders({ userId: req.user.id });
      res.status(200).json(userTenders);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Get user's own marketplace listings
  apiRouter.get('/users/me/marketplace', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userListings = await storage.getMarketplaceListings({ userId: req.user.id });
      res.status(200).json(userListings);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
  
  // Statistics endpoint
  apiRouter.get('/stats', async (_req: Request, res: Response) => {
    try {
      const activeTenders = await storage.getTenders({ status: 'open' });
      const totalMarketplaceListings = await storage.getMarketplaceListings();
      
      res.status(200).json({
        activeTenders: activeTenders.length,
        totalUsers: 1500, // Will be dynamic when we add user count method
        totalMarketplaceListings: totalMarketplaceListings.length,
        completedProjects: 2340 // Will be dynamic when we add this calculation
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Tender routes
  apiRouter.get('/tenders', async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        location: req.query.location as string | undefined,
        status: req.query.status as string | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        search: req.query.search as string | undefined,
        minBudget: req.query.minBudget ? parseInt(req.query.minBudget as string) : undefined,
        maxBudget: req.query.maxBudget ? parseInt(req.query.maxBudget as string) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
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
      console.log('Raw request body:', req.body);
      console.log('Deadline field:', req.body.deadline, 'Type:', typeof req.body.deadline);
      
      const tenderData = insertTenderSchema.parse(req.body);
      
      console.log('After schema validation:', tenderData);
      
      // Convert images array to JSON string for database storage
      const tenderForDB = {
        ...tenderData,
        images: tenderData.images ? JSON.stringify(tenderData.images) : null,
        userId: req.user.id
      };
      
      const tender = await storage.createTender(tenderForDB);
      
      res.status(201).json(tender);
    } catch (error) {
      console.error('Tender creation error:', error);
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
      const { status, viewCount, createdAt, updatedAt, ...rawUpdateData } = req.body;
      
      // Convert deadline string to Date object if present
      const updateData = {
        ...rawUpdateData,
        ...(rawUpdateData.deadline && { deadline: new Date(rawUpdateData.deadline) })
      };
      
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
  
  // Tender bid routes - only for tender owner or bid authors
  apiRouter.get('/tenders/:id/bids', authMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }
      
      // Get tender to check ownership
      const tender = await storage.getTender(tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      const userId = req.user.id;
      const allBids = await storage.getTenderBids(tenderId);
      
      console.log(`User ${userId} requesting bids for tender ${tenderId}`);
      console.log(`Tender owner: ${tender.userId}`);
      console.log(`Total bids found: ${allBids.length}`);
      
      // If user is tender owner, show all bids
      if (tender.userId === userId) {
        console.log('User is tender owner, returning all bids');
        res.status(200).json(allBids);
      } else {
        // If user is not tender owner, show only their own bids
        const userBids = allBids.filter(bid => bid.userId === userId);
        console.log(`User is not tender owner, returning ${userBids.length} user bids`);
        res.status(200).json(userBids);
      }
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
      
      // Pre-process and transform data
      const dataToValidate = {
        amount: req.body.amount,
        description: req.body.description,
        timeframe: req.body.timeframe,
        tenderId,
        userId: req.user.id
      };
      
      // Validate that documents are provided (now required)
      if (!req.body.documents || !Array.isArray(req.body.documents) || req.body.documents.length === 0) {
        return res.status(400).json({ 
          message: "Документы, подтверждающие профессионализм, обязательны для участия в тендере" 
        });
      }
      
      const validDocuments = req.body.documents.filter(doc => doc !== null && doc !== undefined && doc !== '');
      if (validDocuments.length === 0) {
        return res.status(400).json({ 
          message: "Необходимо загрузить хотя бы один документ, подтверждающий профессионализм" 
        });
      }
      
      dataToValidate.documents = validDocuments;
      
      console.log('Raw bid request body:', JSON.stringify(req.body, null, 2));
      console.log('Data to validate:', JSON.stringify(dataToValidate, null, 2));
      
      const bidData = insertTenderBidSchema.parse(dataToValidate);
      
      console.log('Parsed bid data:', JSON.stringify(bidData, null, 2));
      
      const bid = await storage.createTenderBid(bidData);
      
      // Создаем уведомление для заказчика о новой заявке
      try {
        await storage.createNotification({
          userId: tender.userId,
          title: 'Новая заявка на тендер',
          message: `Получена новая заявка на тендер "${tender.title}" от пользователя ${req.user.fullName || req.user.username}`,
          type: 'tender_bid',
          relatedId: tender.id,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } catch (notificationError) {
        console.log('Error creating notification:', notificationError);
      }
      
      res.status(201).json(bid);
    } catch (error) {
      console.error('Tender bid creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
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

  // Новые маршруты для управления заявками
  apiRouter.post('/tenders/bids/:id/approve', authMiddleware, async (req: Request, res: Response) => {
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
      
      // Проверяем, что пользователь является владельцем тендера
      if (tender.userId !== req.user.id) {
        return res.status(403).json({ message: "Only tender owner can approve bids" });
      }
      
      const approvedBid = await storage.approveTenderBid(bidId);
      res.status(200).json(approvedBid);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  apiRouter.post('/tenders/bids/:id/reject', authMiddleware, async (req: Request, res: Response) => {
    try {
      const bidId = parseInt(req.params.id);
      if (isNaN(bidId)) {
        return res.status(400).json({ message: "Invalid bid ID" });
      }
      
      const { reason } = req.body;
      
      const bid = await storage.getTenderBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      const tender = await storage.getTender(bid.tenderId);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      
      // Проверяем, что пользователь является владельцем тендера
      if (tender.userId !== req.user.id) {
        return res.status(403).json({ message: "Only tender owner can reject bids" });
      }
      
      const rejectedBid = await storage.rejectTenderBid(bidId, reason);
      res.status(200).json(rejectedBid);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Маршруты для уведомлений
  apiRouter.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  apiRouter.put('/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.markNotificationAsRead(notificationId);
      res.status(200).json(notification);
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
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
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
      
      // Pass images array directly - storage layer will handle serialization
      const listingForDB = {
        ...listingData,
        userId: req.user.id
      };
      
      const listing = await storage.createMarketplaceListing(listingForDB);
      
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
      
      // Convert images array to JSON string for database storage if present
      if (updateData.images && Array.isArray(updateData.images)) {
        updateData.images = JSON.stringify(updateData.images);
      }
      
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
  
  // Completely block this endpoint to stop infinite loops
  apiRouter.put('/messages/:id/read', (req: Request, res: Response) => {
    console.log('Blocked infinite loop attempt for message ID:', req.params.id);
    res.status(429).json({ message: "Endpoint blocked due to infinite loop" });
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
        SELECT COUNT(DISTINCT userId) as count 
        FROM (
          SELECT userId FROM tenders WHERE userId IS NOT NULL
          UNION
          SELECT userId FROM marketplace_listings WHERE userId IS NOT NULL
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
      const { isAdmin, isVerified, walletBalance, isTopSpecialist } = req.body;
      
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
      
      if (isTopSpecialist !== undefined) {
        updateData.isTopSpecialist = isTopSpecialist;
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

  // API эндпоинты для модерации тендеров
  apiRouter.get('/admin/moderation/tenders', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const stmt = sqliteDb.prepare(`
        SELECT t.*, u.username, u.firstName, u.lastName 
        FROM tenders t 
        LEFT JOIN users u ON t.userId = u.id 
        WHERE t.moderation_status = 'pending'
        ORDER BY t.createdAt DESC
      `);
      const pendingTenders = stmt.all();
      
      res.status(200).json(pendingTenders);
    } catch (error) {
      console.error("Error getting pending tenders:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.post('/admin/moderation/tenders/:id/approve', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      const { comment } = req.body;
      const adminId = (req as any).user.id;
      
      const stmt = sqliteDb.prepare(`
        UPDATE tenders 
        SET moderation_status = 'approved', 
            moderated_by = ?, 
            moderated_at = ?, 
            moderation_comment = ?
        WHERE id = ?
      `);
      
      stmt.run(adminId, new Date().toISOString(), comment || '', tenderId);
      
      res.status(200).json({ message: "Тендер одобрен" });
    } catch (error) {
      console.error("Error approving tender:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.post('/admin/moderation/tenders/:id/reject', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      const { comment } = req.body;
      const adminId = (req as any).user.id;
      
      const stmt = sqliteDb.prepare(`
        UPDATE tenders 
        SET moderation_status = 'rejected', 
            moderated_by = ?, 
            moderated_at = ?, 
            moderation_comment = ?
        WHERE id = ?
      `);
      
      stmt.run(adminId, new Date().toISOString(), comment || '', tenderId);
      
      res.status(200).json({ message: "Тендер отклонен" });
    } catch (error) {
      console.error("Error rejecting tender:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // API эндпоинты для модерации маркетплейса
  apiRouter.get('/admin/moderation/marketplace', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const stmt = sqliteDb.prepare(`
        SELECT ml.*, u.username, u.firstName, u.lastName 
        FROM marketplace_listings ml 
        LEFT JOIN users u ON ml.userId = u.id 
        WHERE ml.moderation_status = 'pending'
        ORDER BY ml.createdAt DESC
      `);
      const pendingListings = stmt.all();
      
      res.status(200).json(pendingListings);
    } catch (error) {
      console.error("Error getting pending marketplace listings:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.post('/admin/moderation/marketplace/:id/approve', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const listingId = parseInt(req.params.id);
      const { comment } = req.body;
      const adminId = (req as any).user.id;
      
      const stmt = sqliteDb.prepare(`
        UPDATE marketplace_listings 
        SET moderation_status = 'approved', 
            moderated_by = ?, 
            moderated_at = ?, 
            moderation_comment = ?
        WHERE id = ?
      `);
      
      stmt.run(adminId, new Date().toISOString(), comment || '', listingId);
      
      res.status(200).json({ message: "Объявление одобрено" });
    } catch (error) {
      console.error("Error approving marketplace listing:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  apiRouter.post('/admin/moderation/marketplace/:id/reject', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const listingId = parseInt(req.params.id);
      const { comment } = req.body;
      const adminId = (req as any).user.id;
      
      const stmt = sqliteDb.prepare(`
        UPDATE marketplace_listings 
        SET moderation_status = 'rejected', 
            moderated_by = ?, 
            moderated_at = ?, 
            moderation_comment = ?
        WHERE id = ?
      `);
      
      stmt.run(adminId, new Date().toISOString(), comment || '', listingId);
      
      res.status(200).json({ message: "Объявление отклонено" });
    } catch (error) {
      console.error("Error rejecting marketplace listing:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Admin delete tender
  apiRouter.delete('/admin/tenders/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const tenderId = parseInt(req.params.id);
      if (isNaN(tenderId)) {
        return res.status(400).json({ message: "Invalid tender ID" });
      }

      const success = await storage.deleteTender(tenderId);
      if (!success) {
        return res.status(404).json({ message: "Tender not found" });
      }

      res.status(200).json({ message: "Тендер удален" });
    } catch (error) {
      console.error("Error deleting tender:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Admin delete marketplace listing
  apiRouter.delete('/admin/marketplace/:id', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const listingId = parseInt(req.params.id);
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }

      const success = await storage.deleteMarketplaceListing(listingId);
      if (!success) {
        return res.status(404).json({ message: "Listing not found" });
      }

      res.status(200).json({ message: "Объявление удалено" });
    } catch (error) {
      console.error("Error deleting marketplace listing:", error);
      res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
  });

  // Specialists routes
  apiRouter.get('/specialists', async (req: Request, res: Response) => {
    try {
      const { status = 'approved' } = req.query;
      const specialists = await storage.getSpecialists({ status: status as string });
      res.json(specialists);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      res.status(500).json({ error: 'Ошибка загрузки специалистов' });
    }
  });

  apiRouter.post('/specialists', authMiddleware, async (req: Request, res: Response) => {
    try {
      console.log('Creating specialist with data:', req.body);
      const specialistData = {
        ...req.body,
        userId: req.user.id,
        user_id: req.user.id,
        specializations: req.body.specializations || [],
        images: req.body.images || [],
        status: 'approved'
      };
      console.log('Processed specialist data:', specialistData);
      const specialist = await storage.createSpecialist(specialistData);
      console.log('Created specialist:', specialist);
      res.status(201).json(specialist);
    } catch (error) {
      console.error('Error creating specialist:', error);
      res.status(500).json({ error: 'Ошибка создания анкеты специалиста' });
    }
  });

  // Crews routes
  apiRouter.get('/crews', async (req: Request, res: Response) => {
    try {
      const { status = 'approved' } = req.query;
      const crews = await storage.getCrews({ status: status as string });
      res.json(crews);
    } catch (error) {
      console.error('Error fetching crews:', error);
      res.status(500).json({ error: 'Ошибка загрузки бригад' });
    }
  });

  apiRouter.post('/crews', authMiddleware, async (req: Request, res: Response) => {
    try {
      const crewData = {
        ...req.body,
        userId: req.user.id,
        user_id: req.user.id,
        specializations: req.body.specializations || [],
        images: req.body.images || [],
        status: 'approved'
      };
      const crew = await storage.createCrew(crewData);
      res.status(201).json(crew);
    } catch (error) {
      console.error('Error creating crew:', error);
      res.status(500).json({ error: 'Ошибка создания анкеты бригады' });
    }
  });

  // Admin specialists moderation
  apiRouter.get('/admin/moderation/specialists', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const specialists = await storage.getSpecialists({ status: 'pending' });
      res.json(specialists);
    } catch (error) {
      console.error('Error fetching specialists for moderation:', error);
      res.status(500).json({ error: 'Ошибка загрузки специалистов для модерации' });
    }
  });

  apiRouter.post('/admin/moderation/specialists/:id/approve', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const specialist = await storage.moderateSpecialist(parseInt(id), 'approved', req.user.id, comment);
      res.json(specialist);
    } catch (error) {
      console.error('Error approving specialist:', error);
      res.status(500).json({ error: 'Ошибка одобрения специалиста' });
    }
  });

  apiRouter.post('/admin/moderation/specialists/:id/reject', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const specialist = await storage.moderateSpecialist(parseInt(id), 'rejected', req.user.id, comment);
      res.json(specialist);
    } catch (error) {
      console.error('Error rejecting specialist:', error);
      res.status(500).json({ error: 'Ошибка отклонения специалиста' });
    }
  });

  // Admin crews moderation
  apiRouter.get('/admin/moderation/crews', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const crews = await storage.getCrews({ status: 'pending' });
      res.json(crews);
    } catch (error) {
      console.error('Error fetching crews for moderation:', error);
      res.status(500).json({ error: 'Ошибка загрузки бригад для модерации' });
    }
  });

  apiRouter.post('/admin/moderation/crews/:id/approve', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const crew = await storage.moderateCrew(parseInt(id), 'approved', req.user.id, comment);
      res.json(crew);
    } catch (error) {
      console.error('Error approving crew:', error);
      res.status(500).json({ error: 'Ошибка одобрения бригады' });
    }
  });

  apiRouter.post('/admin/moderation/crews/:id/reject', adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const crew = await storage.moderateCrew(parseInt(id), 'rejected', req.user.id, comment);
      res.json(crew);
    } catch (error) {
      console.error('Error rejecting crew:', error);
      res.status(500).json({ error: 'Ошибка отклонения бригады' });
    }
  });

  // Reviews routes
  apiRouter.get('/specialists/:id/reviews', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getUserReviews(parseInt(id));
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching specialist reviews:', error);
      res.status(500).json({ error: 'Ошибка загрузки отзывов' });
    }
  });

  apiRouter.post('/reviews', authMiddleware, async (req: Request, res: Response) => {
    try {
      const reviewData = {
        ...req.body,
        reviewerId: req.user.id,
      };
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Ошибка создания отзыва' });
    }
  });

  // Mount the API router
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  
  return httpServer;
}

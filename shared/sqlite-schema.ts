import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type definitions for validation (replacing enums)
export const userTypeValues = ['individual', 'contractor', 'company'] as const;
export const personTypeValues = ['individual', 'legal'] as const;
export const tenderStatusValues = ['open', 'in_progress', 'completed', 'canceled'] as const;
export const listingTypeValues = ['sell', 'rent', 'buy'] as const;
export const categoryValues = ['equipment', 'materials', 'tools', 'services', 'property', 'transport'] as const;
export const subcategoryValues = [
  // Оборудование
  'excavators', 'loaders', 'cranes', 'trucks', 'concrete_mixers',
  // Материалы
  'bricks', 'cement', 'wood', 'metal', 'paint', 'sand', 
  'panels', 'windows', 'doors', 'rare_stones', 'parquet', 'stairs',
  // Инструменты
  'power_tools', 'hand_tools', 'measuring_tools', 'ladders', 'scaffolding',
  // Услуги
  'repair', 'construction', 'design', 'demolition', 'cleaning',
  'moving_services', 'consulting', 'installation', 'plumbing', 'electrical',
  // Недвижимость
  'commercial', 'residential', 'land', 'industrial',
  // Транспорт
  'truck', 'van', 'special',
  // Другое
  'furniture', 'dsv', 'mdf', 'solid_wood', 'other'
] as const;

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull().default('individual'), // 'individual' | 'contractor' | 'company'
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  address: text("address"),
  avatar: text("avatar"),
  rating: integer("rating").default(0),
  isVerified: integer("is_verified", { mode: 'boolean' }).default(false),
  completedProjects: integer("completed_projects").default(0),
  inn: text("inn"),
  website: text("website"),
  walletBalance: integer("wallet_balance").default(0),
  isAdmin: integer("is_admin", { mode: 'boolean' }).default(false),
  isTopSpecialist: integer("is_top_specialist", { mode: 'boolean' }).default(false),
  createdAt: text("createdAt"), // ISO string
  updatedAt: text("updatedAt"), // ISO string
});

// Tenders table
export const tenders = sqliteTable("tenders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // categoryValues
  subcategory: text("subcategory"),
  budget: integer("budget"),
  location: text("location").notNull(),
  deadline: text("deadline").notNull(), // ISO string
  status: text("status").notNull().default('open'), // tenderStatusValues
  userId: integer("userId").notNull(),
  personType: text("personType").notNull().default('individual'), // personTypeValues
  requiredProfessions: text("requiredProfessions"), // JSON string
  images: text("images"), // JSON string
  createdAt: text("createdAt"), // ISO string
  updatedAt: text("updatedAt"), // ISO string
  viewCount: integer("viewCount").default(0),
});

// Tender bids table
export const tenderBids = sqliteTable("tender_bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tenderId: integer("tenderId").notNull(),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  timeframe: integer("timeframe"), // in days
  documents: text("documents"), // JSON string array
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  isAccepted: integer("isAccepted", { mode: 'boolean' }).default(false),
  rejectionReason: text("rejection_reason"), // причина отказа
  createdAt: text("createdAt"), // ISO string
});

// Marketplace listings table
export const marketplaceListings = sqliteTable("marketplace_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // categoryValues
  subcategory: text("subcategory"),
  price: integer("price").notNull(),
  location: text("location").notNull(),
  userId: integer("userId").notNull(),
  listingType: text("listingType").notNull().default('sell'), // listingTypeValues
  condition: text("condition"),
  isActive: integer("isActive", { mode: 'boolean' }).default(true),
  images: text("images"), // JSON string
  createdAt: text("createdAt"), // ISO string
  updatedAt: text("updatedAt"), // ISO string
  viewCount: integer("viewCount").default(0),
});

// Messages table
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: integer("isRead", { mode: 'boolean' }).default(false),
  createdAt: text("createdAt"), // ISO string
});

// Reviews table
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewerId: integer("reviewerId").notNull(),
  revieweeId: integer("revieweeId").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("createdAt"), // ISO string
});

// Notifications table
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'bid_approved', 'bid_rejected', 'tender_bid', etc.
  relatedId: integer("related_id"), // ID связанной записи (тендер, заявка и т.д.)
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  createdAt: text("createdAt"), // ISO string
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tender = typeof tenders.$inferSelect;
export type InsertTender = typeof tenders.$inferInsert;
export type TenderBid = typeof tenderBids.$inferSelect;
export type InsertTenderBid = typeof tenderBids.$inferInsert;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;

// API response type with parsed images
export type MarketplaceListingResponse = Omit<MarketplaceListing, 'images'> & {
  images: string[];
};
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users, {
  userType: z.enum(userTypeValues),
  isVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).omit({
  id: true,
  rating: true,
  isVerified: true,
  completedProjects: true,
  createdAt: true,
});

export const insertTenderSchema = createInsertSchema(tenders, {
  category: z.enum(categoryValues),
  subcategory: z.enum(subcategoryValues).optional(),
  status: z.enum(tenderStatusValues).optional(),
  personType: z.enum(personTypeValues),
  deadline: z.string(), // Accept ISO string
  requiredProfessions: z.string().optional(),
  images: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertTenderBidSchema = createInsertSchema(tenderBids, {
  isAccepted: z.boolean().optional(),
  documents: z.array(z.string()).min(1, "Необходимо загрузить хотя бы один документ, подтверждающий профессионализм"),
  createdAt: z.string().optional(),
}).omit({
  id: true,
  isAccepted: true,
  createdAt: true,
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings, {
  category: z.enum(categoryValues),
  subcategory: z.enum(subcategoryValues).optional(),
  listingType: z.enum(listingTypeValues),
  isActive: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertMessageSchema = createInsertSchema(messages, {
  isRead: z.boolean().optional(),
  createdAt: z.string().optional(),
}).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews, {
  createdAt: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Export type unions for validation
export type UserType = typeof userTypeValues[number];
export type PersonType = typeof personTypeValues[number];
export type TenderStatus = typeof tenderStatusValues[number];
export type ListingType = typeof listingTypeValues[number];
export type Category = typeof categoryValues[number];
export type Subcategory = typeof subcategoryValues[number];
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
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
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
  userId: integer("user_id").notNull(),
  personType: text("person_type").notNull().default('individual'), // personTypeValues
  requiredProfessions: text("required_professions"), // JSON string
  images: text("images"), // JSON string
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
  viewCount: integer("view_count").default(0),
});

// Tender bids table
export const tenderBids = sqliteTable("tender_bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tenderId: integer("tender_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  timeframe: integer("timeframe"), // in days
  isAccepted: integer("is_accepted", { mode: 'boolean' }).default(false),
  createdAt: text("created_at"), // ISO string
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
  userId: integer("user_id").notNull(),
  listingType: text("listing_type").notNull().default('sell'), // listingTypeValues
  condition: text("condition"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  images: text("images"), // JSON string
  createdAt: text("created_at"), // ISO string
  updatedAt: text("updated_at"), // ISO string
  viewCount: integer("view_count").default(0),
});

// Messages table
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  createdAt: text("created_at"), // ISO string
});

// Reviews table
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewerId: integer("reviewer_id").notNull(),
  revieweeId: integer("reviewee_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at"), // ISO string
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
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

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
  images: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertTenderBidSchema = createInsertSchema(tenderBids, {
  isAccepted: z.boolean().optional(),
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
  images: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).omit({
  id: true,
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
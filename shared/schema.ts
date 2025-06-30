import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite doesn't have native enums, so we'll use text fields with validation in Zod
// Type definitions for validation
export const userTypeValues = ['individual', 'contractor', 'company'] as const;
export const personTypeValues = ['individual', 'legal'] as const;
export const professionValues = [
  'carpenter',           // плотник
  'plumber',             // сантехник
  'electrician',         // электрик
  'painter',             // маляр
  'bricklayer',          // каменщик
  'welder',              // сварщик
  'concrete_worker',     // бетонщик
  'crane_operator',      // крановщик
  'bulldozer_operator',  // бульдозерист
  'architect',           // архитектор
  'engineer',            // инженер
  'surveyor',            // геодезист
  'landscaper',          // ландшафтный дизайнер
  'interior_designer',   // дизайнер интерьеров
  'project_manager',     // руководитель проекта
  'foreman',             // прораб
  'roofer',              // кровельщик
  'flooring_specialist', // специалист по напольным покрытиям
  'hvac_technician',     // специалист по вентиляции и кондиционированию
  'security_systems',    // специалист по системам безопасности
  'insulation_specialist', // специалист по утеплению
  'demolition_worker',   // специалист по сносу
  'glazier',             // стекольщик
  'other'                // другое
] as const;

export const tenderStatusEnum = pgEnum('tender_status', [
  'open', 'in_progress', 'completed', 'canceled'
]);

export const listingTypeEnum = pgEnum('listing_type', [
  'sell', 'rent', 'buy'
]);

export const categoryEnum = pgEnum('category', [
  'equipment',  // оборудование
  'materials',  // материалы
  'tools',      // инструменты
  'services',   // услуги
  'property',   // недвижимость (для аренды площадей)
  'transport'   // транспорт (для логистики)
]);

export const serviceTypeEnum = pgEnum('service_type', [
  'construction',  // строительство
  'repair',        // ремонт
  'design',        // дизайн
  'transportation', // перевозки
  'installation',  // монтаж
  'consulting'     // консультации
]);

export const subcategoryEnum = pgEnum('subcategory', [
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
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  fullName: text("full_name").notNull(),
  userType: userTypeEnum("user_type").notNull().default('individual'),
  location: text("location"),
  bio: text("bio"),
  avatar: text("avatar"),
  rating: integer("rating").default(0),
  isVerified: boolean("is_verified").default(false),
  completedProjects: integer("completed_projects").default(0),
  
  // Дополнительные поля для подрядчиков и юридических лиц
  inn: text("inn"), // ИНН (для юридических лиц и подрядчиков)
  website: text("website"), // Сайт (если есть)
  
  // Поле для хранения баланса кошелька
  walletBalance: integer("wallet_balance").default(0),
  
  // Флаг администратора
  isAdmin: boolean("is_admin").default(false),
  
  // Для SQLite мы не можем использовать defaultNow()
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Tenders table
export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  subcategory: subcategoryEnum("subcategory"),
  budget: integer("budget"),
  location: text("location").notNull(),
  deadline: timestamp("deadline").notNull(),
  status: tenderStatusEnum("status").notNull().default('open'),
  userId: integer("user_id").notNull().references(() => users.id),
  personType: personTypeEnum("person_type").notNull().default('individual'),
  requiredProfessions: json("required_professions").$type<string[]>().default([]),
  images: json("images").$type<string[]>().default([]),
  // Поля модерации
  moderationStatus: text("moderation_status").notNull().default('pending'), // pending, approved, rejected
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationComment: text("moderation_comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  viewCount: integer("view_count").default(0),
});

// Tender bids table
export const tenderBids = pgTable("tender_bids", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull().references(() => tenders.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  timeframe: integer("timeframe"), // in days
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketplace listings table
export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  listingType: listingTypeEnum("listing_type").notNull(),
  category: categoryEnum("category").notNull(),
  subcategory: subcategoryEnum("subcategory"),
  condition: text("condition"),
  location: text("location").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  images: json("images").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  // Поля модерации
  moderationStatus: text("moderation_status").notNull().default('pending'), // pending, approved, rejected
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationComment: text("moderation_comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  viewCount: integer("view_count").default(0),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  tenderId: integer("tender_id").references(() => tenders.id),
  listingId: integer("listing_id").references(() => marketplaceListings.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Документы пользователей (лицензии, сертификаты)
export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // license, certificate, etc.
  documentNumber: text("document_number"),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  documentUrl: text("document_url"), // ссылка на документ
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Логистика и доставка
export const deliveryOptions = pgTable("delivery_options", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Название опции доставки
  description: text("description"),
  maxWeight: integer("max_weight"), // максимальный вес в кг
  maxVolume: integer("max_volume"), // максимальный объем в м³
  pricePerKm: integer("price_per_km"), // цена за км
  basePrice: integer("base_price"), // базовая цена
  hasLoaders: boolean("has_loaders").default(false), // есть ли грузчики
  isActive: boolean("is_active").default(true),
});

// Заказы доставки
export const deliveryOrders = pgTable("delivery_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").references(() => marketplaceListings.id),
  deliveryOptionId: integer("delivery_option_id").references(() => deliveryOptions.id),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  distance: integer("distance"), // расстояние в км
  weight: integer("weight"), // вес в кг
  volume: integer("volume"), // объем в м³
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default('pending'), // pending, in_progress, completed, canceled
  scheduledDate: timestamp("scheduled_date"),
  trackingCode: text("tracking_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Сметы проектов
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tenderId: integer("tender_id").references(() => tenders.id),
  title: text("title").notNull(),
  description: text("description"),
  totalCost: integer("total_cost").notNull(),
  projectType: text("project_type").notNull(), // repair, construction, etc.
  area: integer("area"), // площадь в м²
  materialsIncluded: boolean("materials_included").default(true),
  estimatedDuration: integer("estimated_duration"), // в днях
  documentUrl: text("document_url"), // ссылка на PDF
  status: text("status").notNull().default('draft'), // draft, final, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Позиции сметы
export const estimateItems = pgTable("estimate_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").notNull().references(() => estimates.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // шт, м², м³, и т.д.
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  category: text("category"), // materials, work, equipment, etc.
  description: text("description"),
});

// Проекты дизайна
export const designProjects = pgTable("design_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // interior, exterior, landscape, etc.
  area: integer("area"), // площадь в м²
  status: text("status").notNull().default('in_progress'), // in_progress, completed
  visualizationUrls: json("visualization_urls").$type<string[]>().default([]),
  projectFiles: json("project_files").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Бригады
export const crews = pgTable("crews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  location: text("location").notNull(),
  specialization: text("specialization").notNull(),
  experienceYears: integer("experience_years"),
  rating: integer("rating").default(0),
  completedProjects: integer("completed_projects").default(0),
  avatar: text("avatar"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  isVerified: boolean("is_verified").default(false),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Участники бригады
export const crewMembers = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  crewId: integer("crew_id").notNull().references(() => crews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  profession: professionEnum("profession").notNull(),
  experienceYears: integer("experience_years"),
  specialization: text("specialization"),
  isLeader: boolean("is_leader").default(false),
  bio: text("bio"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Портфолио бригад
export const crewPortfolios = pgTable("crew_portfolios", {
  id: serial("id").primaryKey(),
  crewId: integer("crew_id").notNull().references(() => crews.id),
  title: text("title").notNull(),
  description: text("description"),
  projectType: text("project_type").notNull(), // construction, repair, etc.
  location: text("location"),
  completionDate: timestamp("completion_date"),
  clientName: text("client_name"),
  clientReview: text("client_review"),
  clientRating: integer("client_rating"),
  budget: integer("budget"),
  duration: integer("duration"), // in days
  images: json("images").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Профессиональные навыки участников бригад
export const crewMemberSkills = pgTable("crew_member_skills", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => crewMembers.id),
  skillName: text("skill_name").notNull(),
  proficiency: integer("proficiency").notNull(), // 1-5
  years: integer("years"),
  description: text("description"),
  isCertified: boolean("is_certified").default(false),
  certificationName: text("certification_name"),
  certificationDate: timestamp("certification_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, 
  rating: true, 
  isVerified: true, 
  completedProjects: true,
  createdAt: true
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true, 
  status: true, 
  createdAt: true, 
  updatedAt: true, 
  viewCount: true
}).extend({
  deadline: z.union([z.date(), z.string().transform((str) => new Date(str))])
});

export const insertTenderBidSchema = createInsertSchema(tenderBids).omit({
  id: true, 
  isAccepted: true, 
  createdAt: true
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true, 
  isActive: true, 
  createdAt: true, 
  updatedAt: true, 
  viewCount: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true, 
  isRead: true, 
  createdAt: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true, 
  createdAt: true
});

export const insertUserDocumentSchema = createInsertSchema(userDocuments).omit({
  id: true,
  isVerified: true,
  createdAt: true
});

export const insertDeliveryOptionSchema = createInsertSchema(deliveryOptions).omit({
  id: true,
  isActive: true
});

export const insertDeliveryOrderSchema = createInsertSchema(deliveryOrders).omit({
  id: true,
  status: true,
  trackingCode: true,
  createdAt: true,
  updatedAt: true
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});

export const insertEstimateItemSchema = createInsertSchema(estimateItems).omit({
  id: true
});

export const insertDesignProjectSchema = createInsertSchema(designProjects).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});

export const insertCrewSchema = createInsertSchema(crews).omit({
  id: true,
  rating: true,
  completedProjects: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).omit({
  id: true,
  createdAt: true
});

export const insertCrewPortfolioSchema = createInsertSchema(crewPortfolios).omit({
  id: true,
  createdAt: true
});

export const insertCrewMemberSkillSchema = createInsertSchema(crewMemberSkills).omit({
  id: true,
  createdAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;

export type TenderBid = typeof tenderBids.$inferSelect;
export type InsertTenderBid = z.infer<typeof insertTenderBidSchema>;

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;





export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = z.infer<typeof insertUserDocumentSchema>;

export type DeliveryOption = typeof deliveryOptions.$inferSelect;
export type InsertDeliveryOption = z.infer<typeof insertDeliveryOptionSchema>;

export type DeliveryOrder = typeof deliveryOrders.$inferSelect;
export type InsertDeliveryOrder = z.infer<typeof insertDeliveryOrderSchema>;

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;

export type EstimateItem = typeof estimateItems.$inferSelect;
export type InsertEstimateItem = z.infer<typeof insertEstimateItemSchema>;

export type DesignProject = typeof designProjects.$inferSelect;
export type InsertDesignProject = z.infer<typeof insertDesignProjectSchema>;

export type Crew = typeof crews.$inferSelect;
export type InsertCrew = z.infer<typeof insertCrewSchema>;

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;

export type CrewPortfolio = typeof crewPortfolios.$inferSelect;
export type InsertCrewPortfolio = z.infer<typeof insertCrewPortfolioSchema>;

export type CrewMemberSkill = typeof crewMemberSkills.$inferSelect;
export type InsertCrewMemberSkill = z.infer<typeof insertCrewMemberSkillSchema>;

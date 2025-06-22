// Authentication types
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  userType: 'individual' | 'contractor' | 'company';
  location?: string;
  bio?: string;
  avatar?: string;
  rating: number;
  isVerified: boolean;
  isAdmin?: boolean; // Права администратора
  isTopSpecialist?: boolean; // Статус лучшего специалиста
  completedProjects: number;
  inn?: string;  // ИНН для юр. лиц и подрядчиков
  website?: string; // Сайт компании или подрядчика
  walletBalance: number; // Баланс кошелька
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Tender types
export interface Tender {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget?: number;
  location: string;
  deadline: string;
  status: 'open' | 'in_progress' | 'completed' | 'canceled';
  userId: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  personType: 'individual' | 'legal_entity';
  requiredProfessions: string[];
  user?: User;
}

export interface TenderBid {
  id: number;
  tenderId: number;
  userId: number;
  amount: number;
  description: string;
  timeframe?: number;
  isAccepted: boolean;
  createdAt: string;
  user?: User;
}

// Marketplace types
export interface MarketplaceListing {
  id: number;
  title: string;
  description: string;
  price: number;
  listingType: 'sell' | 'rent' | 'buy';
  category: string;
  subcategory?: string;
  condition?: string;
  location: string;
  userId: number;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  user?: User;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  userType: 'individual' | 'contractor' | 'company';
  location?: string;
  bio?: string;
  avatar?: string;
  rating: number;
  isVerified: boolean;
  completedProjects: number;
  inn?: string;  // ИНН для юр. лиц и подрядчиков
  website?: string; // Сайт компании или подрядчика
  walletBalance: number; // Баланс кошелька
  createdAt: string;
}

export interface Review {
  id: number;
  reviewerId: number;
  recipientId: number;
  tenderId?: number;
  listingId?: number;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
}

// Message types
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  userType: 'individual' | 'contractor' | 'company';
  location?: string;
  phone?: string;
}

export interface TenderFormData {
  id?: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget?: number;
  location: string;
  deadline: string | Date;
  images?: string[];
  personType: 'individual' | 'legal_entity';
  requiredProfessions?: string[];
  userId?: number;
}

export interface TenderBidFormData {
  amount: number;
  description: string;
  timeframe?: number;
}

export interface MarketplaceItemFormData {
  title: string;
  description: string;
  price: number;
  listingType: 'sell' | 'rent' | 'buy';
  category: string;
  subcategory?: string;
  condition?: string;
  location: string;
  images: string[];
}

export interface ReviewFormData {
  rating: number;
  comment?: string;
  tenderId?: number;
  listingId?: number;
  recipientId: number;
}

export interface MessageFormData {
  content: string;
  receiverId: number;
}

export interface ProfileUpdateFormData {
  fullName?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
}

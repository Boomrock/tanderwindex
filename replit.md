# СтройТендер - Construction Tenders and Marketplace Platform

## Overview

СтройТендер is a comprehensive construction platform that combines tender management with a marketplace for construction materials and equipment. The platform enables construction companies, contractors, and individual specialists to find projects, participate in tenders, and trade construction-related goods and services.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (SQLite support for development)
- **UI Components**: Radix UI with Tailwind CSS (shadcn/ui design system)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite with esbuild for production builds

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- **Client**: React SPA with TypeScript
- **Server**: Express.js REST API
- **Shared**: Common types, schemas, and utilities

## Key Components

### Frontend Architecture
- **React Router**: Using wouter for lightweight routing
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Form Management**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React Context for auth state, TanStack Query for server state

### Backend Architecture
- **API Structure**: RESTful API with Express.js
- **Database Layer**: SQLite with direct SQL queries for optimal performance
- **Authentication**: JWT tokens with Bearer authentication
- **Storage Abstraction**: Modular storage architecture with specialized classes
- **Session Management**: Express sessions with PostgreSQL store
- **Storage Pattern**: Base storage class with domain-specific extensions (MessageStorage, UserStorage, BankGuaranteeStorage)

### Database Design
The platform uses PostgreSQL with the following key entities:
- **Users**: Support for individuals, contractors, and companies with verification system
- **Tenders**: Construction project tenders with bidding system
- **Marketplace**: Buy/sell/rent listings for construction materials and equipment
- **Messages**: Internal messaging system between users
- **Reviews**: Rating and review system for users
- **Bank Guarantees**: Financial guarantee system for secure transactions
- **Crews**: Team management for contractors with skills tracking

## Data Flow

### Authentication Flow
1. User registration/login through JWT tokens
2. Token stored in localStorage and included in API requests
3. Server validates tokens using middleware
4. User context maintained throughout the application

### Tender Management Flow
1. Authenticated users create tenders with detailed specifications
2. Contractors submit bids with proposals
3. Tender creators review and select winning bids
4. Project execution tracking and completion

### Marketplace Flow
1. Users create listings for equipment, materials, or services
2. Search and filtering system for discovering relevant items
3. Direct messaging between buyers and sellers
4. Transaction management through secure payment system

### Messaging System
1. Real-time messaging between platform users
2. Message persistence in database
3. Conversation management and history

## External Dependencies

### Core Libraries
- **@radix-ui/***: Accessible UI primitives for components
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token management
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Database Drivers
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **better-sqlite3**: SQLite driver for development
- **@libsql/client**: LibSQL client for SQLite compatibility

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
1. **Development**: `npm run dev` - Vite dev server with HMR
2. **Production Build**: `npm run build` - Vite build for client + esbuild for server
3. **Production Start**: `npm run start` - Runs built server application

### Environment Configuration
- **Database**: PostgreSQL in production, SQLite in development
- **Authentication**: JWT secret configuration
- **Session Storage**: PostgreSQL-backed sessions in production

### Platform Deployment
- **Target**: Replit autoscale deployment
- **Port Configuration**: Server runs on port 5000, externally exposed on port 80
- **Database**: PostgreSQL 16 module with automatic provisioning

### Migration Strategy
- **Database Migrations**: Drizzle migrations in `/migrations` directory
- **Schema Evolution**: Automated column additions and table updates
- **Data Seeding**: Initial data population for development and testing

## Changelog

- June 22, 2025. Initial setup
- June 22, 2025. Major refactoring completed:
  - Removed unused storage modules (database-storage.ts, sqlite-storage.ts, refactored-storage.ts)
  - Cleaned up server/storage directory 
  - Removed search functionality from header navigation
  - Removed wallet functionality from user menus
  - Consolidated to single storage implementation (sqlite-storage-simple.ts)
  - Fixed seed-specialists.ts to match current database schema
  - Removed SearchFilters component and related imports

## User Preferences

Preferred communication style: Simple, everyday language.
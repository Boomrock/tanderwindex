# Windexs-Строй - Construction Tenders and Marketplace Platform

## Overview

Windexs-Строй is a comprehensive construction platform that combines tender management with a marketplace for construction materials and equipment. The platform enables construction companies, contractors, and individual specialists to find projects, participate in tenders, and trade construction-related goods and services.

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
- June 22, 2025. Enhanced tender bid privacy and communication system:
  - Implemented restricted bid visibility: only tender owners and bid authors can see bids
  - Added automatic chat creation between customer and contractor when bid is submitted
  - Updated API endpoint security with authentication requirements for bid access
  - Modified frontend to handle new privacy restrictions with appropriate user messaging
- June 22, 2025. Implemented comprehensive content moderation system:
  - Added moderation fields to database (status, moderator, date, comment)
  - Created API endpoints for admin approval/rejection of tenders and marketplace items
  - Updated content visibility logic to show only approved items publicly
  - Built admin panel with moderation tabs for tenders and marketplace listings
  - Gradient abstractions already implemented for tenders without images on homepage
- June 23, 2025. Fixed critical issues with user experience:
  - Resolved documents validation error preventing bid submissions without uploaded documents
  - Implemented user information display in tender and marketplace cards via SQL JOINs
  - Fixed fallback "Пользователь" text by showing real names (first_name + last_name or username)
  - Enhanced data retrieval methods to include user profile information in listings
- June 24, 2025. Refactored bid system with mandatory document requirements:
  - Made document uploads mandatory for tender participation to ensure contractor professionalism
  - Added comprehensive document validation on both client and server sides
  - Implemented secure document download system for tender owners to review contractor credentials
  - Enhanced bid display with document access controls (only visible to bid owner and tender owner)
  - Added proper error handling and user feedback for document requirements
- June 25, 2025. Implemented comprehensive search and filtering system:
  - Added search functionality across tenders and marketplace by title, description, and location
  - Created advanced filtering with category, price range, location, and type filters
  - Implemented sorting by budget/price, date, deadline, and title with ascending/descending order
  - Built responsive SearchFilters component with collapsible advanced options
  - Added filter badge display and individual filter removal functionality
  - Enhanced API endpoints to support all search and filtering parameters with SQL-based queries
  - Fixed Select component validation errors by ensuring all SelectItem components have non-empty values
  - Identified and resolved file download system issue where test content was served instead of actual uploaded documents
  - Enhanced file upload/download system with proper logging and error handling for real document delivery
  - Fixed Content-Disposition header encoding for files with non-ASCII characters by using ASCII-safe filenames
  - Updated project branding from "Windex-Строй" to "Windexs-Строй" across all headers, footers, and page titles
- June 28, 2025. Implemented green branding for Windexs-Строй logo only and restructured specialist sections:
  - Changed only the Windexs-Строй logo and brand name to green color while keeping the platform's primary UI in blue
  - Updated logo colors in headers, footers, and login/register pages to use green specifically for brand identity
  - Split "Лучшие специалисты" into two separate sections: "Специалисты" and "Бригады"
  - Created dedicated Specialists page with individual contractor profiles and chat functionality
  - Created dedicated Crews page for construction teams with member count and team rates
  - Added specialist creation form with photo upload, skills, hourly rates, and portfolio
  - Added crew creation form with team photo, member count, daily rates, and specializations
  - Enhanced tender creation with expanded repair categories: house, apartment, commercial repair
- June 29, 2025. Fixed critical issues and completed specialist/crew functionality:
  - Fixed 404 errors by adding proper routes for /specialists/:id and /crews/:id detail pages
  - Implemented functional chat buttons that redirect to messaging system
  - Created complete API for specialists and crews with CRUD operations
  - Fixed creation forms to properly submit data to database via API calls
  - Expanded admin panel with 4-tab moderation system for Tenders, Marketplace, Specialists, and Crews
  - Created SQLite database tables for specialists and crews with moderation fields
  - Added detail pages with comprehensive profile information, portfolios, and contact options
  - Implemented proper data flow from creation forms through moderation to public listings
  - Fixed database connection issues causing empty API responses by correcting database file path
  - Resolved SQL query compatibility problems with duplicate column names in users table
  - Created admin account with credentials: login: admin, password: admin123
  - Verified all API endpoints working correctly with proper data retrieval and admin access
  - Fixed authentication system issues: resolved password hashing problems and recreated admin user
  - Corrected field name mismatches in specialist and crew detail pages (hourly_rate, daily_rate, member_count)
  - All detail pages now display data correctly without runtime errors
- June 30, 2025. Fixed chat system errors and specialist creation functionality:
  - Resolved "undefined is not an object (evaluating 'u.fullName.toLowerCase')" error in chat system
  - Added getUserDisplayName helper function to handle both fullName and full_name database fields
  - Fixed SpecialistDetail and CrewDetail chat buttons to use correct user_id instead of specialist/crew id
  - Updated Messages, ChatBox, and NewMessage components with proper name display handling
  - Implemented actual API calls in SpecialistCreate form instead of console logging only
  - Fixed specialist creation to properly submit data to /api/specialists endpoint with moderation workflow

## User Preferences

Preferred communication style: Simple, everyday language.
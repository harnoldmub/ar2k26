# Ruth & Arnold Wedding Website - Golden Love 2026

## Overview

This is an elegant, mobile-first wedding website for Ruth & Arnold's 2026 wedding celebration. The application serves as both a public-facing landing page for guests to view wedding details and RSVP, and a private admin dashboard for managing guest responses and table assignments. The site features a romantic, sophisticated design inspired by luxury wedding platforms, with a gold and ivory color palette that creates an emotional, memorable experience for wedding guests.

## Recent Changes

**October 17, 2025 (Evening)** - Table Assignment Optimization
- ✅ **Optimized table number assignment workflow**
  - Removed inline table number input that sent request on every keystroke
  - Table number now displayed as read-only in admin table ("Table X" or "Non attribuée")
  - Added table number field to edit dialog for controlled updates
  - Single PUT request per save instead of multiple onChange requests
- ✅ **Schema separation for better validation**
  - Created `updateRsvpResponseSchema` for admin updates (includes tableNumber, notes)
  - Kept `insertRsvpResponseSchema` for public RSVP submissions (excludes admin-only fields)
  - Backend routes now use appropriate schema for each operation
- ✅ **Testing & validation**
  - E2E tests confirm table assignment workflow without excessive requests
  - Database updates verified for both setting and clearing table numbers
  - Architect review confirms improved UX and maintainability

**October 17, 2025 (Afternoon)** - Local Authentication & RSVP Management
- ✅ **Local authentication system implemented**
  - Replaced Replit Auth with Passport-local strategy
  - Admin credentials: AR2026_Admin / Arnold&Ruth2026
  - Created dedicated login page at /login with username/password form
  - Logout functionality with redirect to login page
  - All admin routes protected with local authentication
- ✅ **RSVP edit functionality**
  - Added edit button in admin table for each RSVP
  - Edit dialog with form for firstName, lastName, email, partySize, availability
  - Updates persist to database via PUT /api/rsvp/:id
  - React Query cache invalidation for immediate UI updates
- ✅ **RSVP delete functionality**
  - Added delete button in admin table for each RSVP
  - Confirmation dialog before deletion
  - Deletes from database via DELETE /api/rsvp/:id
  - Proper cache invalidation and success feedback
- ✅ **Mobile-responsive admin stats**
  - Stats cards now use grid-cols-2 (mobile), sm:grid-cols-3 (tablet), lg:grid-cols-6 (desktop)
  - Reduced padding and font sizes on mobile for better fit
  - Text uses leading-tight for compact display
- ✅ **Portrait alt text fix**
  - Corrected Arnold and Ruth portrait alt texts to match actual photos
- ✅ **Testing & validation**
  - E2E tests confirm local login, edit, and delete workflows
  - All features working correctly without regressions
  - Architect review confirms code quality and maintainability

**October 17, 2025** - Email Field Addition & Authentication Bug Fix
- ✅ **Email field added to RSVP form**
  - Added email column to rsvp_responses table (varchar 255, NOT NULL)
  - Updated Zod validation schema with email validation
  - RSVP form now captures guest email addresses
  - Admin dashboard displays email column in guest table
- ✅ **Critical authentication bug fixed**
  - Fixed server crash on admin login caused by duplicate email constraints
  - Implemented transactional upsertUser solution that handles ID/email conflicts
  - ID (OIDC sub) is source of truth; email can change
  - When email conflict occurs with different ID, old user's email is cleared (set to NULL)
  - Transaction ensures atomicity and prevents data loss
- ✅ **Testing & validation**
  - E2E tests confirm RSVP submission with email works
  - Admin login tested in both conflict scenarios (same ID/new email, new ID/same email)
  - No server crashes, proper conflict resolution verified
  - Architect review confirms robustness and maintainability

**October 16, 2025 (Late Evening)** - Enhanced Hero Section, Party Size Tracking & Section Reorganization
- ✅ **Hero section enhancements**
  - Added descriptive paragraph: "Rejoignez-nous pour une célébration pleine d'amour, de rires et de souvenirs inoubliables"
  - Increased background image visibility from 5% to 20% opacity for better visual impact
  - Maintained luxury aesthetic with elegant Playfair Display typography
- ✅ **Party size tracking feature**
  - Added partySize field to database schema (integer: 1 for Solo, 2 for Couple)
  - Updated RSVP form with "Nombre de personnes" dropdown selector
  - Options: "Solo (1 personne)" and "Couple (2 personnes)"
  - Admin dashboard now displays "Personnes" column showing "Solo (1)" or "Couple (2)"
- ✅ **Improved page flow**
  - Reorganized landing page sections: RSVP form now appears before photo gallery
  - Better user journey: Dates → RSVP → Gallery → Footer
  - Maintains clean, minimalist design with proper spacing
- ✅ **Testing & validation**
  - E2E tests confirm all features working correctly
  - Database migrations applied successfully
  - Party size data captured and displayed in admin dashboard
  - All data-testid attributes in place for testing

**October 16, 2025 (Evening)** - Modern Minimalist Design Transformation
- ✅ **Complete design modernization** inspired by luxury wedding websites with minimalist aesthetics
  - Hero section: Large elegant couple names "RUTH & ARNOLD" in Playfair Display with subtle background image
  - Notre Histoire: Separated portrait layout with Arnold and Ruth side-by-side, centered quote between portraits (3-column grid)
  - Dates section: Clean "HEUREUX DE VOUS ACCUEILLIR PARMI NOUS" heading with large date display (5xl-8xl font size)
  - Gallery: Refined 3-column grid with aspect-ratio 3:4 images and subtle hover effects (scale + brightness)
  - Footer: Organized 4-column structure (Informations, Dates, Navigation, Golden Love tagline)
  - RSVP section: Updated with light serif headings and italic subtitle
- ✅ Enhanced user experience
  - Increased white space throughout for modern, breathable layout
  - Light font weights (font-light) for headings matching luxury wedding aesthetics
  - Consistent tracking-wide and uppercase styling for section headers
  - Smooth scroll navigation from footer buttons to story and gallery sections
- ✅ Testing & validation
  - All E2E tests passing with new design
  - Added data-testid attributes to footer navigation buttons (button-footer-nav-story, button-footer-nav-gallery)
  - Architect review confirms design coherence and code quality

**October 16, 2025** - Complete Wedding Website Implementation
- ✅ Generated all visual assets (9 wedding photos: hero couple, Ruth & Arnold portraits, 6 gallery images)
- ✅ **Replaced portraits with real photos** - Arnold and Ruth's authentic photos now featured in Notre Histoire section
- ✅ Built complete frontend with exceptional design quality following design guidelines
  - Landing page with hero section featuring couple photo background
  - Notre Histoire section with couple portraits and love story
  - Dates section with countdown timer to March 19, 2026 (updates every second)
  - Responsive photo gallery (6 images) with lightbox modal and social sharing
  - Beautiful RSVP form with validation (firstName, lastName, availability)
  - Protected admin dashboard with guest list, search/filter, and seat assignment
- ✅ Implemented complete backend with PostgreSQL database
  - RSVP submission API (POST /api/rsvp)
  - Guest list retrieval (GET /api/rsvp - protected)
  - Table assignment updates (PATCH /api/rsvp/:id - protected)
  - CSV export endpoint (GET /api/rsvp/export/csv - protected)
  - Send invitation endpoint (POST /api/send-invitation - protected)
  - Replit Auth integration with proper session management
- ✅ Email integration via Resend
  - Automatic RSVP confirmation emails to contact@ar2k26.com
  - Personalized wedding invitation emails with custom messages
  - Beautiful HTML templates with golden theme
- ✅ Enhanced features
  - CSV/Excel export for guest data with French formatting
  - Social media sharing (Facebook, Twitter, WhatsApp, Copy Link) for gallery photos
  - Photo-specific share URLs with query parameters (?photo={id}#galerie)
- ✅ Fixed critical issues
  - Auth endpoint returns 200 with null for unauthenticated users (no infinite loops)
  - Admin route properly protected with auth guard
  - Countdown timer uses useEffect for proper cleanup
  - ThemeProvider implemented with localStorage persistence
  - All interactive elements have data-testid attributes
- ✅ E2E testing validated complete user journey
  - Landing page loads correctly with all sections
  - RSVP submission works and persists to database
  - Admin authentication flow works with OIDC
  - Table assignment functionality works and persists
  - CSV export and email invitations working
  - Social sharing buttons functional with photo-specific URLs

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite as the build tool and development server.

**UI Component System**: Shadcn/ui components based on Radix UI primitives, providing accessible, customizable components with consistent styling. The design system uses the "new-york" style variant with Tailwind CSS for styling.

**Routing**: Wouter for lightweight client-side routing with three main routes:
- `/` - Public landing page with wedding information and RSVP form
- `/login` - Admin login page with username/password authentication
- `/admin` - Protected admin dashboard for managing responses

**State Management**: TanStack Query (React Query) for server state management, handling data fetching, caching, and synchronization with the backend.

**Form Handling**: React Hook Form with Zod validation for type-safe form validation and submission.

**Styling System**: Tailwind CSS with custom design tokens defined in CSS variables, supporting both light mode (primary) and dark mode (admin area). Custom color palette includes signature gold accent (#C8A96A) and ivory backgrounds.

**Typography**: Google Fonts integration with three font families:
- Playfair Display (serif) for headings and display text
- Lato (sans-serif) for body text
- Great Vibes (cursive) for decorative accents

### Backend Architecture

**Runtime**: Node.js with Express.js server framework, written in TypeScript.

**API Design**: RESTful API with JSON request/response format:
- `POST /api/rsvp` - Create new RSVP response (public)
- `GET /api/rsvp` - Fetch all responses (authenticated)
- `PUT /api/rsvp/:id` - Update RSVP data (authenticated)
- `DELETE /api/rsvp/:id` - Delete RSVP (authenticated)
- `PATCH /api/rsvp/:id` - Update table assignments (authenticated)
- `POST /api/login` - Admin login with username/password
- `POST /api/logout` - Admin logout
- `GET /api/auth/user` - Get current user session

**Authentication**: Local authentication using Passport-local strategy with bcrypt password hashing. Admin credentials (username: AR2026_Admin, password: Arnold&Ruth2026) are validated against hardcoded values. Session management uses express-session with PostgreSQL-backed session store.

**Data Layer**: Storage abstraction pattern with `IStorage` interface, allowing for flexible backend implementations. Current implementation uses `DatabaseStorage` class with Drizzle ORM.

**Development Server**: Custom Vite integration in development mode with Hot Module Replacement (HMR) for rapid development. Production mode serves pre-built static assets.

### Data Storage

**Database**: PostgreSQL (via Neon serverless driver with WebSocket support for serverless environments).

**ORM**: Drizzle ORM for type-safe database queries and migrations.

**Schema Design**:
- `sessions` table - Session storage for authentication
- `users` table - User profiles for admin access
- `rsvp_responses` table - Guest RSVP submissions with fields for name, email, partySize, availability (specific dates), table assignments, and notes

**Type Safety**: Full type inference from database schema to TypeScript using Drizzle's type generation, with Zod schemas for runtime validation.

### External Dependencies

**Database Service**: Neon PostgreSQL serverless database with WebSocket connections for optimal performance in serverless environments.

**CDN Services**: 
- Google Fonts CDN for typography (Playfair Display, Lato, Great Vibes)
- Local asset management for wedding photos stored in `attached_assets/generated_images/`

**UI Component Libraries**:
- Radix UI primitives for accessible component foundations
- Shadcn/ui for pre-built, customizable components
- Lucide React for icon system

**Development Tools**:
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal) for enhanced development experience
- TypeScript for type safety across the entire stack
- ESBuild for production server bundling

**Session Storage**: connect-pg-simple for PostgreSQL-backed express sessions, ensuring session persistence across server restarts.
# Project Structure Overview

This document explains the organization of the RealEstate SaaS codebase.

## 📂 Directory Structure

```
real-estate-saas/
│
├── 📁 app/                          # Next.js App Router (main application code)
│   │
│   ├── 📁 api/                      # Backend API endpoints
│   │   ├── 📁 ai/                   # AI-related endpoints
│   │   │   ├── 📁 analyze-image/    # POST /api/ai/analyze-image
│   │   │   │   └── route.ts         # Analyze property images with AI
│   │   │   └── 📁 generate-content/ # POST /api/ai/generate-content
│   │   │       └── route.ts         # Generate marketing content with AI
│   │   ├── 📁 brand-kit/            # GET/PUT /api/brand-kit
│   │   │   └── route.ts             # Manage user's brand kit
│   │   ├── 📁 projects/             # Project CRUD operations
│   │   │   ├── 📁 [id]/             # Dynamic route for specific project
│   │   │   │   └── route.ts         # GET/PUT/DELETE /api/projects/:id
│   │   │   └── route.ts             # GET/POST /api/projects
│   │   └── 📁 auth/
│   │       └── 📁 callback/         # OAuth callback handler
│   │           └── route.ts
│   │
│   ├── 📁 auth/                     # Authentication pages (public)
│   │   ├── 📁 login/
│   │   │   └── page.tsx             # Login page (/auth/login)
│   │   └── 📁 signup/
│   │       └── page.tsx             # Sign up page (/auth/signup)
│   │
│   ├── 📁 dashboard/                # Protected dashboard pages
│   │   ├── 📁 account/
│   │   │   └── page.tsx             # User account settings
│   │   ├── 📁 brand-kit/
│   │   │   └── page.tsx             # Brand customization
│   │   ├── 📁 projects/
│   │   │   ├── 📁 [id]/             # Dynamic route
│   │   │   │   └── page.tsx         # Project detail page (/dashboard/projects/:id)
│   │   │   ├── 📁 new/
│   │   │   │   └── page.tsx         # Create new project
│   │   │   └── page.tsx             # Projects list page
│   │   ├── layout.tsx               # Dashboard layout (with sidebar)
│   │   └── page.tsx                 # Dashboard home
│   │
│   ├── globals.css                  # Global styles and Tailwind directives
│   ├── layout.tsx                   # Root layout (wraps entire app)
│   └── page.tsx                     # Landing page (/)
│
├── 📁 components/                   # React components
│   │
│   ├── 📁 layout/                   # Layout-specific components
│   │   ├── Header.tsx               # Top navigation bar with title
│   │   └── Sidebar.tsx              # Left sidebar navigation
│   │
│   ├── 📁 ui/                       # Reusable UI components
│   │   ├── Button.tsx               # Button component (multiple variants)
│   │   ├── Card.tsx                 # Card container component
│   │   └── Input.tsx                # Input field with label/error
│   │
│   └── ProjectCard.tsx              # Project display card (used in lists)
│
├── 📁 lib/                          # Utility libraries and helpers
│   ├── openai.ts                    # OpenAI client configuration
│   │                                # - generatePropertyContent()
│   │                                # - analyzePropertyImage()
│   └── supabase.ts                  # Supabase client configuration
│                                    # - signUpWithEmail()
│                                    # - signInWithEmail()
│                                    # - signInWithGoogle()
│                                    # - signOut()
│                                    # - getCurrentUser()
│
├── 📁 types/                        # TypeScript type definitions
│   └── index.ts                     # All types (User, Project, BrandKit, etc.)
│
├── 📄 .env.local.example            # Template for environment variables
├── 📄 .gitignore                    # Git ignore rules
├── 📄 GETTING_STARTED.md            # Quick start guide (5-minute setup)
├── 📄 next.config.js                # Next.js configuration
├── 📄 package.json                  # Dependencies and scripts
├── 📄 postcss.config.js             # PostCSS configuration (for Tailwind)
├── 📄 PROJECT_STRUCTURE.md          # This file!
├── 📄 README.md                     # Main documentation
├── 📄 supabase-schema.sql           # Database schema (run in Supabase)
├── 📄 tailwind.config.js            # Tailwind CSS configuration
└── 📄 tsconfig.json                 # TypeScript configuration
```

## 🎯 Key Files Explained

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Lists all dependencies and scripts |
| `tsconfig.json` | TypeScript compiler settings |
| `tailwind.config.js` | Tailwind CSS theme customization |
| `next.config.js` | Next.js framework settings |
| `.env.local` | Environment variables (API keys, URLs) |

### Application Entry Points

| File | Route | Description |
|------|-------|-------------|
| `app/page.tsx` | `/` | Landing page (marketing site) |
| `app/auth/login/page.tsx` | `/auth/login` | User login page |
| `app/dashboard/page.tsx` | `/dashboard` | Main dashboard home |

### Core Utilities

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Authentication and user management |
| `lib/openai.ts` | AI content generation and image analysis |
| `types/index.ts` | TypeScript interfaces for all data |

## 🔄 Data Flow

### Authentication Flow

```
1. User visits /auth/login
2. User enters credentials or clicks Google OAuth
3. lib/supabase.ts handles authentication
4. Supabase validates and creates session
5. User redirected to /dashboard
6. All protected pages check authentication
```

### Project Creation Flow

```
1. User clicks "New Project" in dashboard
2. Navigates to /dashboard/projects/new
3. Fills out property information form
4. Submits form → POST /api/projects
5. API route validates and saves to database
6. Redirects to /dashboard/projects/:id
```

### AI Content Generation Flow

```
1. User opens project detail page
2. Uploads property images
3. Clicks "Generate Content" button
4. Frontend calls POST /api/ai/generate-content
5. API route calls lib/openai.ts functions
6. OpenAI generates marketing content
7. Content displayed on page for editing
8. User saves → PUT /api/projects/:id
```

## 🎨 Component Hierarchy

### Dashboard Layout Structure

```
app/dashboard/layout.tsx
├── Sidebar (fixed left)
│   ├── Logo
│   ├── Navigation Links
│   │   ├── Dashboard
│   │   ├── Projects
│   │   ├── Brand Kit
│   │   └── Account
│   └── Sign Out Button
│
└── Main Content Area
    ├── Header (top bar)
    │   ├── Page Title
    │   └── User Profile
    │
    └── Page Content
        └── {children} (current page)
```

### Projects List Page Structure

```
app/dashboard/projects/page.tsx
├── Header
│   └── "Projects" title
│
└── Content
    ├── Toolbar
    │   ├── Search Input
    │   ├── Status Filter Dropdown
    │   └── "New Project" Button
    │
    └── Projects Grid
        └── ProjectCard (repeated)
            ├── Thumbnail Image
            ├── Title
            ├── Description
            ├── Property Type
            └── Status Badge
```

## 🚀 Page Routing

### Public Routes (No Authentication Required)

- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Sign up page

### Protected Routes (Authentication Required)

- `/dashboard` - Dashboard home
- `/dashboard/projects` - Projects list
- `/dashboard/projects/new` - Create project
- `/dashboard/projects/:id` - Project details
- `/dashboard/brand-kit` - Brand customization
- `/dashboard/account` - Account settings

### API Routes

- `POST /api/auth/callback` - OAuth callback
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/ai/generate-content` - Generate content
- `POST /api/ai/analyze-image` - Analyze image
- `GET /api/brand-kit` - Get brand kit
- `PUT /api/brand-kit` - Update brand kit

## 📦 Dependencies Overview

### Core Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend Services
- **Supabase** - Authentication and database
- **OpenAI** - AI content generation

### Utilities
- **clsx** - Conditional className utility

## 🎓 Where to Start Learning

### For Complete Beginners

1. Start with `app/page.tsx` - Simple landing page
2. Look at `components/ui/Button.tsx` - Basic component
3. Check `types/index.ts` - Understand data structures

### For Frontend Developers

1. Explore `components/` folder - See component patterns
2. Study `app/dashboard/page.tsx` - Page structure
3. Review `app/globals.css` - Tailwind customization

### For Backend Developers

1. Check `lib/supabase.ts` - Authentication logic
2. Study `app/api/projects/route.ts` - API endpoints
3. Review `supabase-schema.sql` - Database schema

### For Full-Stack Developers

1. Follow the data flow from UI → API → Database
2. Understand authentication in `lib/supabase.ts`
3. Study API routes and their corresponding UI pages

## 💡 File Naming Conventions

- `page.tsx` - Page component (defines a route)
- `layout.tsx` - Layout component (wraps pages)
- `route.ts` - API route handler
- `PascalCase.tsx` - React components
- `camelCase.ts` - Utility files
- `kebab-case/` - Folder names

---

Need help? All files have extensive comments explaining what they do! 📝


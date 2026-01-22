# RealEstate SaaS - AI-Powered Marketing Platform for Real Estate Agents

A modern SaaS web application built with Next.js 14, TypeScript, and Tailwind CSS that helps real estate agents create stunning property listings with AI-generated content.

## 🎯 Features

- **User Authentication**: Email/password and Google OAuth login powered by Supabase
- **Dashboard**: Overview of projects, statistics, and quick actions
- **Projects Management**: Create, view, edit, and organize property listing projects
- **Calendar Integration**: Connect Google Calendar and Outlook to sync showings, open houses, and appointments
- **AI Content Generation**: Automatically generate compelling property descriptions and social media posts using OpenAI
- **Image Analysis**: AI-powered analysis of property photos to identify features and generate captions
- **Brand Kit**: Customize your brand with logos, colors, and fonts for consistent marketing
- **Responsive Design**: Beautiful, modern UI that works on all devices

## 📁 Project Structure

```
real-estate-saas/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI-related endpoints
│   │   │   ├── analyze-image/    # Image analysis
│   │   │   └── generate-content/ # Content generation
│   │   ├── brand-kit/            # Brand kit management
│   │   ├── projects/             # Project CRUD operations
│   │   └── auth/                 # Authentication callback
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login page
│   │   └── signup/               # Sign up page
│   ├── dashboard/                # Dashboard pages
│   │   ├── account/              # Account settings
│   │   ├── brand-kit/            # Brand kit customization
│   │   ├── projects/             # Projects list and details
│   │   └── page.tsx              # Dashboard home
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # Page header
│   │   └── Sidebar.tsx           # Navigation sidebar
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx            # Button component
│   │   ├── Card.tsx              # Card component
│   │   └── Input.tsx             # Input component
│   └── ProjectCard.tsx           # Project card component
├── lib/                          # Utility libraries
│   ├── openai.ts                 # OpenAI client and helpers
│   └── supabase.ts               # Supabase client and helpers
├── types/                        # TypeScript type definitions
│   └── index.ts                  # All type definitions
├── .env.local.example            # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- An OpenAI API key (available at [platform.openai.com](https://platform.openai.com))

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Set up environment variables**:

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then fill in your credentials in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up Supabase**:

Create the following tables in your Supabase database:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT,
  property_info JSONB,
  images JSONB DEFAULT '[]',
  ai_content JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand kits table
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0ea5e9',
  secondary_color TEXT,
  accent_color TEXT,
  font_family TEXT NOT NULL DEFAULT 'Inter',
  font_weight INTEGER DEFAULT 400,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own brand kit" ON brand_kits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kit" ON brand_kits
  FOR ALL USING (auth.uid() = user_id);
```

4. **Run the development server**:

```bash
npm run dev
```

5. **Open your browser**:

Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Key Components

### UI Components

- **Button**: Flexible button component with multiple variants (primary, secondary, outline, danger) and sizes
- **Input**: Text input with label, error, and helper text support
- **Card**: Container component with shadow and padding options
- **ProjectCard**: Displays project information in a card format

### Layout Components

- **Sidebar**: Main navigation sidebar with active link highlighting
- **Header**: Top bar with page title and user information

### Pages

- **Landing Page**: Marketing page with features and call-to-action
- **Authentication**: Login and sign up pages with email and Google OAuth
- **Dashboard**: Overview with statistics and recent projects
- **Projects**: List, create, and manage property listing projects
- **Brand Kit**: Customize brand identity with colors, fonts, and logo
- **Account**: User profile and settings

## 🔧 API Routes

### Authentication
- `POST /api/auth/callback` - OAuth callback handler

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### AI Features
- `POST /api/ai/generate-content` - Generate property marketing content
- `POST /api/ai/analyze-image` - Analyze property images

### Brand Kit
- `GET /api/brand-kit` - Get user's brand kit
- `PUT /api/brand-kit` - Update brand kit

## 🎓 Learning Resources

This project is beginner-friendly with extensive comments throughout the codebase. Key concepts:

- **Next.js 14 App Router**: Modern React framework with server and client components
- **TypeScript**: Type-safe JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Supabase**: Backend-as-a-Service for authentication and database
- **OpenAI**: AI-powered content generation and image analysis

## 📚 Next Steps

1. **Enable Google OAuth in Supabase**:
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider and add your OAuth credentials

2. **Set up file storage**:
   - Create a storage bucket in Supabase for project images
   - Update the upload functionality to use Supabase Storage

3. **Deploy to production**:
   - Deploy to Vercel, Netlify, or your preferred hosting platform
   - Update environment variables for production
   - Configure custom domain

4. **Add more features**:
   - Email templates for property listings
   - PDF generation for listing flyers
   - Integration with MLS systems
   - Analytics and reporting

## 🤝 Contributing

This is a starter template. Feel free to customize and extend it for your needs!

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🐛 Troubleshooting

### Common Issues

1. **Supabase connection errors**: Make sure your environment variables are set correctly
2. **OpenAI API errors**: Verify your API key has sufficient credits
3. **Build errors**: Run `npm install` to ensure all dependencies are installed
4. **TypeScript errors**: Check that your `tsconfig.json` is configured correctly

## 💡 Tips for Beginners

1. Start by exploring the `app/page.tsx` (landing page) to understand the structure
2. Look at `components/ui/Button.tsx` to see how reusable components work
3. Check `lib/supabase.ts` to understand authentication
4. Examine `types/index.ts` to see how TypeScript types are defined
5. Read the comments in each file - they explain what the code does!

---

Built with ❤️ for real estate agents who want to leverage AI in their marketing.


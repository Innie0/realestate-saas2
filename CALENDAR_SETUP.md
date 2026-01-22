# Calendar Integration Setup Guide

This guide will walk you through setting up Google Calendar and Outlook Calendar integrations for the RealEstate SaaS application.

## 📋 Overview

The calendar feature allows real estate agents to:
- Connect their Google Calendar and/or Outlook Calendar
- View all events in a unified calendar view
- Create property showings and open house events
- Link events to specific projects
- Automatically sync events bi-directionally

## 🔧 Setup Requirements

Before you can use the calendar feature, you need to:
1. Set up Google Cloud Console project (for Google Calendar)
2. Set up Microsoft Azure app registration (for Outlook Calendar)
3. Update your environment variables
4. Run the updated database schema

---

## 1️⃣ Google Calendar Setup (30 minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "RealEstate SaaS Calendar"
4. Click "Create"

### Step 2: Enable Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and click **"Enable"**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (or Internal if you have Google Workspace)
   - App name: **RealEstate SaaS**
   - User support email: Your email
   - Developer contact: Your email
   - Add scope: `../auth/calendar.readonly` and `../auth/calendar.events`
   - Add your email as a test user
   - Click **"Save and Continue"**

4. Back to Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **RealEstate SaaS Web Client**
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/calendar/google/callback` (for local development)
     - `https://yourdomain.com/api/calendar/google/callback` (for production)
   - Click **"Create"**

5. **Copy your credentials:**
   - Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123...`)

### Step 4: Add to Environment Variables

Add to your `.env.local`:

```env
# Google Calendar Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 2️⃣ Outlook Calendar Setup (30 minutes)

### Step 1: Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for **"Azure Active Directory"** or **"Microsoft Entra ID"**
3. Click **"App registrations"** in the left sidebar
4. Click **"New registration"**

### Step 2: Configure App Registration

1. Fill in the form:
   - Name: **RealEstate SaaS**
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI:
     - Platform: **Web**
     - URI: `http://localhost:3000/api/calendar/outlook/callback`
   - Click **"Register"**

2. **Copy your credentials** from the Overview page:
   - Application (client) ID (looks like: `12345678-1234-1234-1234-123456789012`)

### Step 3: Create Client Secret

1. In your app registration, go to **"Certificates & secrets"**
2. Click **"New client secret"**
3. Description: **RealEstate SaaS Secret**
4. Expires: Choose duration (24 months recommended)
5. Click **"Add"**
6. **Copy the secret VALUE immediately** (you won't be able to see it again!)

### Step 4: Configure API Permissions

1. Go to **"API permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add these permissions:
   - `Calendars.ReadWrite`
   - `offline_access` (to get refresh token)
6. Click **"Add permissions"**

7. **(Optional)** Click **"Grant admin consent"** if you have admin rights

### Step 5: Add Redirect URI for Production

1. Go to **"Authentication"**
2. Under **"Web"** redirect URIs, click **"Add URI"**
3. Add: `https://yourdomain.com/api/calendar/outlook/callback`
4. Click **"Save"**

### Step 6: Add to Environment Variables

Add to your `.env.local`:

```env
# Microsoft/Outlook Calendar Configuration
MICROSOFT_CLIENT_ID=your_application_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_value_here
```

---

## 3️⃣ Update Environment Variables

Your complete `.env.local` should now include:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Google Calendar Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft/Outlook Calendar Configuration
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4️⃣ Install New Dependencies

Run this command to install the calendar-related packages:

```bash
npm install
```

This will install:
- `googleapis` - Google Calendar API client
- `@microsoft/microsoft-graph-client` - Microsoft Graph API client
- `date-fns` - Date manipulation library

---

## 5️⃣ Update Database Schema

### Option A: Fresh Installation

If this is a new installation, just run the updated `supabase-schema.sql`:

1. Go to your Supabase dashboard
2. Click **SQL Editor** → **New Query**
3. Copy all contents from `supabase-schema.sql`
4. Paste and click **"Run"**

### Option B: Existing Installation

If you already have the database set up, you only need to add the calendar tables.

Run this SQL in your Supabase SQL Editor:

```sql
-- Calendar connections table
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_type TEXT DEFAULT 'other' CHECK (event_type IN ('showing', 'open_house', 'meeting', 'other')),
  attendees TEXT[],
  google_event_id TEXT,
  outlook_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);

-- Enable RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own calendar connections" 
  ON calendar_connections FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own calendar events" 
  ON calendar_events FOR ALL 
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 6️⃣ Test the Integration

### Start the Development Server

```bash
npm run dev
```

### Test Google Calendar

1. Log in to your app
2. Navigate to **Dashboard** → **Calendar**
3. Click **"Connect Google Calendar"**
4. You'll be redirected to Google's authorization page
5. Grant the requested permissions
6. You should be redirected back to the calendar page with a success message

### Test Outlook Calendar

1. On the Calendar page, click **"Connect Outlook Calendar"**
2. Sign in with your Microsoft account
3. Grant the requested permissions
4. You should be redirected back with a success message

### Test Event Sync

1. Once connected, click the **"Sync"** button
2. Events from your connected calendars should appear in the calendar view
3. Try creating a new event and it should sync to your connected calendars!

---

## 🔒 Security Best Practices

### Important Security Notes:

1. **Never commit `.env.local`** - It's already in `.gitignore`

2. **Encrypt tokens in production** - The current implementation stores tokens as plain text. For production, you should:
   - Use Supabase's `vault` feature to encrypt sensitive data
   - Or implement your own encryption for `access_token` and `refresh_token` fields

3. **Use HTTPS in production** - Update `NEXT_PUBLIC_APP_URL` to your HTTPS domain

4. **Rotate secrets regularly** - Change your OAuth secrets every 6-12 months

5. **Limit OAuth scopes** - Only request the minimum permissions needed

---

## 🐛 Troubleshooting

### "redirect_uri_mismatch" error

**Problem**: OAuth redirect URI doesn't match what's configured

**Solution**:
- Double-check your redirect URI in Google Cloud Console / Azure Portal
- Make sure it exactly matches: `http://localhost:3000/api/calendar/google/callback` (or outlook)
- No trailing slashes!
- Check your `NEXT_PUBLIC_APP_URL` in `.env.local`

### "invalid_client" error

**Problem**: Client ID or Secret is incorrect

**Solution**:
- Copy your credentials again from Google Cloud Console / Azure Portal
- Make sure there are no extra spaces or characters
- Restart your development server after updating `.env.local`

### Events not syncing

**Problem**: Events aren't appearing after clicking "Sync"

**Solution**:
- Check browser console for error messages
- Verify your API permissions in Google Cloud Console / Azure Portal
- Try disconnecting and reconnecting the calendar
- Check if your access token has expired

### Database connection errors

**Problem**: Can't save calendar connections

**Solution**:
- Make sure you ran the updated database schema
- Check that `calendar_connections` and `calendar_events` tables exist
- Verify RLS policies are set up correctly

---

## 📚 API Documentation

### Endpoints Created

**Google Calendar:**
- `POST /api/calendar/google/connect` - Initiate OAuth flow
- `GET /api/calendar/google/callback` - OAuth callback handler
- `POST /api/calendar/google/disconnect` - Disconnect calendar

**Outlook Calendar:**
- `POST /api/calendar/outlook/connect` - Initiate OAuth flow
- `GET /api/calendar/outlook/callback` - OAuth callback handler
- `POST /api/calendar/outlook/disconnect` - Disconnect calendar

**Calendar Events:**
- `GET /api/calendar/events` - List all events
- `POST /api/calendar/events` - Create new event
- `GET /api/calendar/events/[id]` - Get event details
- `PUT /api/calendar/events/[id]` - Update event
- `DELETE /api/calendar/events/[id]` - Delete event
- `POST /api/calendar/sync` - Sync events from connected calendars

---

## 🎉 Success!

You now have fully functional calendar integration! Your users can:
- ✅ Connect Google Calendar and/or Outlook Calendar
- ✅ View all events in one place
- ✅ Create events that sync automatically
- ✅ Link events to property projects
- ✅ Schedule showings and open houses

For more help, check the code comments in:
- `lib/google-calendar.ts` - Google Calendar functions
- `lib/outlook-calendar.ts` - Outlook Calendar functions
- `app/dashboard/calendar/page.tsx` - Calendar UI
- `components/CalendarView.tsx` - Calendar grid component

Happy scheduling! 📅



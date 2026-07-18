# 🔧 Google Calendar Connection - Troubleshooting Guide

## Issue: Calendar shows "Not Connected" after connecting

I've fixed the main issue (unnecessary API call causing 401 error), but let's verify your setup is complete.

---

## ✅ Setup Checklist

### 1. **Environment Variables** (Most Common Issue)

Check your `.env.local` file has these 4 required variables:

```env
# Required for Google Calendar
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ IMPORTANT:** After adding/changing `.env.local`, **RESTART your dev server**:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

### 2. **Google Cloud Console Setup**

Go to [Google Cloud Console](https://console.cloud.google.com/) and verify:

#### A. OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Make sure you added yourself as a test user:
   - Email: `builtbyallali@gmail.com` ✅
3. Verify scopes are added:
   - `../auth/calendar.readonly`
   - `../auth/calendar.events`

#### B. OAuth Client ID (Credentials)
1. Go to **APIs & Services → Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify **Authorized redirect URIs** includes:
   ```
   http://localhost:3000/api/calendar/google/callback
   ```
   **Note:** No trailing slash! Must be exact.

#### C. Enable Google Calendar API
1. Go to **APIs & Services → Enabled APIs & services**
2. Make sure **"Google Calendar API"** is in the list
3. If not, go to **Library** → Search "Google Calendar API" → Enable

---

### 3. **Database Setup**

Run the calendar sync migration in Supabase:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Click **SQL Editor** → **New query**
3. Copy and paste this entire script:

```sql
-- Add unique constraints for calendar sync
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'calendar_events_google_event_id_key'
    ) THEN
        ALTER TABLE calendar_events 
        ADD CONSTRAINT calendar_events_google_event_id_key 
        UNIQUE (google_event_id);
        
        RAISE NOTICE '✅ Added unique constraint for google_event_id';
    ELSE
        RAISE NOTICE 'ℹ️ Unique constraint already exists';
    END IF;
END $$;

-- Verify calendar_connections table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'calendar_connections'
    ) THEN
        RAISE NOTICE '✅ calendar_connections table exists';
    ELSE
        RAISE EXCEPTION '❌ calendar_connections table is missing! Run supabase-schema.sql';
    END IF;
END $$;
```

4. Click **Run**
5. You should see: ✅ Success messages

---

## 🧪 Testing Steps

### Test 1: Verify Environment Variables
Open browser console (F12) and run:
```javascript
fetch('/api/calendar/google/connect', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected:** `{ success: true, data: { authUrl: "https://accounts.google.com/..." } }`

**If you get an error:** Your `.env.local` is missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`

---

### Test 2: Connect Google Calendar
1. Go to **Dashboard → Calendar**
2. Click **"Connect Google Calendar"**
3. Watch your dev server terminal for these logs:

**Expected logs:**
```
✅ User authenticated: [user-id]
✅ Got Google tokens: { hasAccessToken: true, hasRefreshToken: true, ... }
✅ Calendar connection saved to database
✅ Fetched X events from Google Calendar
✅ Imported X events to database
```

**If you see errors:**
- `401 Unauthorized` → Google credentials are wrong
- `not_authenticated` → You're not signed in
- `save_failed` → Database issue (check RLS policies)

---

### Test 3: Check Database
1. Go to **Supabase → Table Editor → calendar_connections**
2. You should see a row with:
   - `provider`: `google`
   - `email`: Your email
   - `is_active`: `true` ✅

3. Go to **calendar_events** table
   - Should have rows if you have Google Calendar events

---

## 🐛 Common Errors & Fixes

### Error: "redirect_uri_mismatch"
**Cause:** Redirect URI in Google Cloud Console doesn't match what the app sends. The app
builds it at runtime as `NEXT_PUBLIC_APP_URL + '/api/calendar/google/callback'`
(`lib/google-calendar.ts`), so it changes depending on which environment you're in.

**Fix:**
1. On Google's error page, click **"Error details"** to see the exact `redirect_uri` value that
   was actually sent — this tells you precisely what to register.
2. Go to Google Cloud Console → Credentials → your OAuth Client ID
3. Add exactly (both are needed):
   - `http://localhost:3000/api/calendar/google/callback` (local dev)
   - `https://oikaro.ai/api/calendar/google/callback` (production)
4. Confirm `NEXT_PUBLIC_APP_URL` is set to `https://oikaro.ai` in Vercel's Production
   environment variables (no trailing slash). Since it's a `NEXT_PUBLIC_` var, redeploy after
   changing it for the new value to take effect.
5. Save and try again

**Note:** If a connection that was previously working suddenly disconnects on its own (not from
you clicking Disconnect), it's usually because the OAuth consent screen is still in "Testing"
publishing status — Google expires refresh tokens after 7 days in that mode, and the app
automatically marks the connection inactive when a refresh fails. Move Publishing status to
"In production" in Google Cloud Console to stop this from recurring.

---

### Error: "Access blocked: Realestate Saas has not completed Google verification"
**Cause:** You're not added as a test user

**Fix:**
1. Go to Google Cloud Console → OAuth consent screen
2. Scroll to **Test users** section
3. Click **+ ADD USERS**
4. Add: `builtbyallali@gmail.com`
5. Save and try connecting again

---

### Error: Connection shows but no events
**Cause:** Events might not be in the current month view

**Fix:**
1. Use the month navigation arrows (◀ ▶) to check other months
2. Check your Google Calendar has events in that date range
3. Click the **"Sync"** button manually
4. Check browser console for errors (F12 → Console)

---

### Connection shows "Not Connected" after connecting
**Cause:** Database not updated or page not refreshing

**Fix:**
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Verify database has a row in `calendar_connections` table
4. Try disconnecting and reconnecting

---

## 🔍 Debug Mode

Want to see detailed logs? Check your **dev server terminal** (where you ran `npm run dev`).

You should see lines like:
```
✅ User authenticated: abc123...
✅ Got Google tokens: { hasAccessToken: true, ... }
✅ Calendar connection saved to database
✅ Fetched 5 events from Google Calendar
✅ Imported 5 events to database
```

If you see ❌ or error messages, that tells you exactly what failed!

---

## 📞 Still Having Issues?

If you've tried all the above:

1. **Share the error from terminal:**
   - Copy the error message from your dev server terminal
   - Look for lines starting with `❌` or `Error`

2. **Check browser console:**
   - Press F12 → Console tab
   - Look for red error messages
   - Share those too

3. **Verify basics:**
   - [ ] Restarted dev server after adding `.env.local`
   - [ ] Added yourself as test user in Google Cloud Console
   - [ ] Redirect URI is exactly: `http://localhost:3000/api/calendar/google/callback`
   - [ ] Google Calendar API is enabled
   - [ ] Database migration was run successfully

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Calendar page shows "Connected" with your email
2. ✅ Events from Google Calendar appear on the web app calendar
3. ✅ Terminal shows success logs (✅ messages)
4. ✅ Database has a row in `calendar_connections`
5. ✅ Adding an event to Google Calendar → Sync button → Event appears

Good luck! 🚀







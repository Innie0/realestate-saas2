# 🔥 QUICK FIX - Calendar Events Not Showing

## The Problem
Your Google Calendar event "Meta Way" was **fetched** but **not imported** (0 events imported).

Terminal showed:
```
✅ Fetched 1 events from Google Calendar
✅ Imported 0 events to database  ❌ THIS IS THE ISSUE
```

## 🚀 Solution (Do These 3 Steps)

### Step 1: Run This SQL in Supabase
The database constraint might be missing or there's a conflict. Run this:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Open **SQL Editor** → **New query**
3. Paste this entire script:

```sql
-- First, check if the unique constraint exists
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'calendar_events_google_event_id_key'
    ) THEN
        ALTER TABLE calendar_events 
        DROP CONSTRAINT calendar_events_google_event_id_key;
        RAISE NOTICE '✅ Dropped old constraint';
    END IF;
    
    -- Add it back properly
    ALTER TABLE calendar_events 
    ADD CONSTRAINT calendar_events_google_event_id_key 
    UNIQUE NULLS NOT DISTINCT (google_event_id);
    
    RAISE NOTICE '✅ Added unique constraint (allows NULL)';
END $$;

-- Also, clear any orphaned/test events
DELETE FROM calendar_events WHERE google_event_id IS NULL AND title LIKE '%test%';

RAISE NOTICE '✅ Database ready!';
```

4. Click **Run**
5. You should see ✅ success messages

---

### Step 2: Disconnect & Reconnect Google Calendar

1. Go to your web app **Dashboard → Calendar**
2. **Scroll down** to "Calendar Connections" section
3. If you see "Connected" under Google Calendar:
   - Click **"Disconnect"** button
   - Wait 2 seconds
4. Click **"Connect Google Calendar"** button
5. Sign in and authorize again

---

### Step 3: Watch The Terminal

After reconnecting, watch your terminal. You should now see:

```
✅ User authenticated: [your-id]
✅ Got Google tokens: { hasAccessToken: true, ... }
✅ Calendar connection saved to database
✅ Fetched 1 events from Google Calendar
✅ Imported: Meta Way  ← THIS SHOULD APPEAR NOW!
✅ Imported 1 events to database  ← NOT 0!
```

---

## ✅ Verify It Worked

1. Refresh your calendar page
2. Your "Meta Way" event should now appear on November 30th
3. The "Calendar Connections" section should show "Connected" with your email

---

## 🔍 If Still Not Working

Run this query in Supabase to check if events are in the database:

```sql
SELECT 
  id,
  title,
  start_time,
  google_event_id,
  user_id
FROM calendar_events
ORDER BY created_at DESC
LIMIT 10;
```

**Expected result:** You should see your "Meta Way" event

**If empty:** The import is still failing. Check terminal for specific error messages (lines starting with ❌)

---

## 💡 Quick Test

After Step 1 & 2, you can also manually trigger a sync:

1. Go to Calendar page
2. Click the **"Sync"** button (circular arrow icon)
3. Watch terminal logs
4. Refresh page

Your event should appear!

---

## 📞 Troubleshooting

**If you see errors in terminal like:**
- `duplicate key value violates unique constraint` → The constraint issue, Step 1 should fix it
- `null value in column "google_event_id"` → The event ID isn't being passed correctly
- `insert or update on table "calendar_events" violates foreign key constraint` → User ID mismatch

Share the exact error message and I'll help fix it!


# 📅 Calendar Sync Fix Instructions

## Issues Found

1. **Database Constraint Error**: The `calendar_events` table only allowed event types: `['showing', 'open_house', 'meeting', 'other']`, but the code was trying to insert `'transaction'`
2. **Expired Google Token**: Your Google Calendar connection needs to be reconnected

---

## ✅ Fixes Applied

### Code Fix (Already Done)
✅ Updated `lib/transaction-calendar-sync.ts` to:
- Add fallback logic for constraint violations
- Use `event_type: 'other'` as fallback if `'transaction'` is not allowed
- Better error handling for check constraint violations (error code 23514)

**Result**: Calendar sync will now work immediately with events created as type `'other'`

---

## 🗄️ Database Fix (You Need to Run This)

To properly support transaction events, run the SQL script I created:

### Option 1: Full Support (Recommended)

**Run this in Supabase SQL Editor:**

```sql
-- Open fix-calendar-event-type.sql and run it
```

This will:
- Update the constraint to include `'transaction'` as a valid event_type
- Allow proper categorization of transaction-related events
- Make events show up with the correct type in your calendar

**File location:** `fix-calendar-event-type.sql`

### Option 2: Keep Using Fallback
If you don't run the SQL script, the code will automatically use `event_type: 'other'` for all transaction dates. This works fine but events won't be categorized specifically as "transaction" events.

---

## 🔗 Google Calendar Reconnection (Required)

Your Google Calendar token has expired. To sync to Google Calendar:

1. **Go to your Calendar page** in the web app
2. **Disconnect Google Calendar** (if connected)
3. **Click "Connect Google Calendar"**
4. **Authorize the connection**

This will get a fresh token that can sync events properly.

---

## 🧪 Testing

After running the SQL script and reconnecting Google Calendar:

1. **Create a new transaction** with dates
2. **Check terminal logs** for:
   ```
   ✅ Calendar event inserted with ID: ...
   ✅ Synced to Google Calendar: ...
   ```
3. **Verify in web app Calendar page**
4. **Check your Google Calendar**

---

## 📊 What to Expect

After fixes:
- ✅ Transaction dates appear in web app calendar
- ✅ Events sync to Google Calendar (after reconnection)
- ✅ All important dates get their own calendar events
- ✅ Proper categorization with event_type: 'transaction'

---

## 🔍 Current Status

**Code**: ✅ Fixed (fallback working now)
**Database**: ⚠️ Needs SQL script run (optional but recommended)
**Google Calendar**: ⚠️ Needs reconnection

Try creating a transaction now - it should work with the fallback!

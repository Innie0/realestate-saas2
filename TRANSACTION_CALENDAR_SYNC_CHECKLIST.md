# Transaction Calendar Sync Troubleshooting Checklist

## ✅ Step-by-Step Fix

### 1. **Run the SQL Migration**
First, make sure the calendar_events table has the transaction columns:

```sql
-- Run this in Supabase SQL Editor
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added transaction_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'transaction_date_type'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN transaction_date_type TEXT;
        RAISE NOTICE 'Added transaction_date_type column';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_calendar_events_transaction_id ON calendar_events(transaction_id);
```

### 2. **Restart Dev Server**
Your dev server crashed. Restart it:

```powershell
# In your terminal:
cd "c:\Users\callo\OneDrive\Desktop\Realestate Saas"
npm run dev
```

### 3. **Reconnect Google Calendar (if you want Google Calendar sync)**
- Go to your **Calendar** page in the web app
- Find the **Google Calendar** connection section
- Click **Disconnect** (if connected)
- Click **Connect** to reconnect
- This will refresh your Google Calendar token

### 4. **Create a Test Transaction**
- Go to **Transactions** → **New Transaction**
- Fill in the required fields:
  - Property Address
  - Buyer Name
  - Seller Name
  - Offer Price
- **IMPORTANT**: Add at least one date (like **Closing Date**)
- Click **Submit**

### 5. **Check the Logs**
Watch your terminal/console for these messages:

```
📅 Starting transaction calendar sync for: [your property address]
📅 Found [X] dates to sync
✅ Created web app calendar event: 🏠 CLOSING DAY - [address]
📤 Pushing to Google Calendar: 🏠 CLOSING DAY - [address]
✅ Synced to Google Calendar: 🏠 CLOSING DAY - [address]
```

### 6. **Verify in Calendar**
- Go to your **Calendar** page
- You should see the transaction dates appear as events
- If Google Calendar is connected, check your Google Calendar too

---

## 🐛 Common Issues

### Issue: "No dates to sync for this transaction"
**Solution**: Make sure you filled in at least ONE date field when creating the transaction (closing_date, inspection_date, etc.)

### Issue: "Transaction columns not found"
**Solution**: You didn't run the SQL migration. Go back to Step 1.

### Issue: "Google Calendar connected but token is invalid"
**Solution**: Your Google Calendar token expired. Reconnect (Step 3).

### Issue: Events appear in web app but not Google Calendar
**Solution**: 
1. Make sure Google Calendar is connected
2. Check terminal for Google Calendar sync errors
3. Try disconnecting and reconnecting Google Calendar

### Issue: No logs appearing in terminal
**Solution**: Your dev server isn't running. Restart it (Step 2).

---

## 📋 Quick Test Script

After completing all steps, run this quick test:

1. ✅ Dev server is running (`npm run dev`)
2. ✅ SQL migration completed
3. ✅ Google Calendar connected (optional)
4. ✅ Create transaction with closing_date = tomorrow
5. ✅ Check terminal for sync logs
6. ✅ Check Calendar page for event
7. ✅ Check Google Calendar (if connected)

---

## 📞 Still Not Working?

If you still have issues after following all steps:

1. Check your terminal for error messages
2. Check browser console (F12) for errors
3. Make sure the transaction was successfully created
4. Verify dates were entered in YYYY-MM-DD format

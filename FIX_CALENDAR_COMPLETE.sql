-- =====================================================
-- COMPLETE CALENDAR FIX - Run this ENTIRE script
-- This fixes ALL issues with transaction calendar sync
-- =====================================================

-- =====================================================
-- STEP 1: Fix the google_event_id unique constraint
-- This constraint is blocking multiple NULL values
-- =====================================================

-- Drop the problematic unique constraints
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_google_event_id_key;
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_outlook_event_id_key;

-- Drop indexes if they exist
DROP INDEX IF EXISTS calendar_events_google_event_id_key;
DROP INDEX IF EXISTS calendar_events_outlook_event_id_key;

-- Create PARTIAL unique indexes that only apply to non-NULL values
-- This allows multiple NULL values while still preventing duplicates for actual IDs
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_google_event_id_unique 
ON calendar_events (google_event_id) 
WHERE google_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_outlook_event_id_unique 
ON calendar_events (outlook_event_id) 
WHERE outlook_event_id IS NOT NULL;

RAISE NOTICE '✅ Fixed google_event_id and outlook_event_id constraints';

-- =====================================================
-- STEP 2: Fix the event_type constraint
-- Add 'transaction' as a valid event type
-- =====================================================

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;

ALTER TABLE calendar_events 
ADD CONSTRAINT calendar_events_event_type_check 
CHECK (event_type IN ('showing', 'open_house', 'meeting', 'transaction', 'other'));

RAISE NOTICE '✅ Fixed event_type constraint - transaction is now allowed';

-- =====================================================
-- STEP 3: Add transaction columns if missing
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN transaction_id UUID;
        RAISE NOTICE '✅ Added transaction_id column';
    ELSE
        RAISE NOTICE 'ℹ️ transaction_id column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'transaction_date_type'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN transaction_date_type TEXT;
        RAISE NOTICE '✅ Added transaction_date_type column';
    ELSE
        RAISE NOTICE 'ℹ️ transaction_date_type column already exists';
    END IF;
END $$;

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_transaction_id ON calendar_events(transaction_id);

-- =====================================================
-- STEP 4: Clean up any duplicate/orphaned events
-- =====================================================

-- Delete events with empty string google_event_id (should be NULL)
UPDATE calendar_events SET google_event_id = NULL WHERE google_event_id = '';
UPDATE calendar_events SET outlook_event_id = NULL WHERE outlook_event_id = '';

RAISE NOTICE '✅ Cleaned up empty string event IDs';

-- =====================================================
-- STEP 5: Delete the stale Google Calendar connection
-- This forces user to reconnect with fresh token
-- =====================================================

-- Mark Google connections as inactive (user will need to reconnect)
UPDATE calendar_connections 
SET is_active = false 
WHERE provider = 'google' 
AND (
    token_expiry < NOW() 
    OR access_token IS NULL 
    OR access_token = ''
);

RAISE NOTICE '✅ Marked stale Google Calendar connections as inactive';

-- =====================================================
-- STEP 6: Verify the fixes
-- =====================================================

-- Show calendar_events table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;

-- Show constraints
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'calendar_events'::regclass;

-- =====================================================
-- COMPLETE!
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL CALENDAR FIXES APPLIED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '1. google_event_id unique constraint (now allows multiple NULLs)';
    RAISE NOTICE '2. event_type constraint (now includes transaction)';
    RAISE NOTICE '3. transaction_id and transaction_date_type columns added';
    RAISE NOTICE '4. Stale Google Calendar connections marked inactive';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Go to Calendar page in your app';
    RAISE NOTICE '2. If Google Calendar shows as connected, DISCONNECT it';
    RAISE NOTICE '3. Click Connect to reconnect with fresh token';
    RAISE NOTICE '4. Create a new transaction with dates';
    RAISE NOTICE '5. Check your Calendar page - events should appear!';
END $$;

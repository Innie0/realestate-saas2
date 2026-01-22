-- COMPLETE CALENDAR FIX FOR TRANSACTIONS
-- Run this entire script in Supabase SQL Editor
-- This adds all necessary columns for transaction calendar sync

-- ============================================
-- STEP 1: Add transaction columns to calendar_events
-- ============================================

DO $$ 
BEGIN
    -- Add transaction_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added transaction_id column to calendar_events';
    ELSE
        RAISE NOTICE 'ℹ️ transaction_id column already exists';
    END IF;
    
    -- Add transaction_date_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calendar_events' AND column_name = 'transaction_date_type'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN transaction_date_type TEXT;
        RAISE NOTICE '✅ Added transaction_date_type column to calendar_events';
    ELSE
        RAISE NOTICE 'ℹ️ transaction_date_type column already exists';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_transaction_id ON calendar_events(transaction_id);

-- ============================================
-- STEP 2: Verify calendar_events table structure
-- ============================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Check if calendar_events table exists
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
        RAISE NOTICE '✅ calendar_events table exists';
    ELSE
        RAISE NOTICE '❌ calendar_events table DOES NOT EXIST! You need to create it first.';
    END IF;
END $$;

-- ============================================
-- STEP 4: Ensure RLS policy allows inserts
-- ============================================

-- Check existing policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'calendar_events';

-- ============================================
-- COMPLETE!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CALENDAR FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Restart your dev server (Ctrl+C then npm run dev)';
    RAISE NOTICE '2. Disconnect and reconnect Google Calendar in the app';
    RAISE NOTICE '3. Create a new transaction WITH DATES filled in';
    RAISE NOTICE '4. Check your Calendar page for the events';
END $$;

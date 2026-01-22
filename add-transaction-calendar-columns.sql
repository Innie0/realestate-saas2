-- Add transaction-related columns to calendar_events table
-- This allows linking calendar events to transactions for automatic syncing
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    -- Add transaction_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added transaction_id column to calendar_events';
    ELSE
        RAISE NOTICE 'Column transaction_id already exists';
    END IF;
    
    -- Add transaction_date_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'transaction_date_type'
    ) THEN
        ALTER TABLE calendar_events 
        ADD COLUMN transaction_date_type TEXT;
        RAISE NOTICE 'Added transaction_date_type column to calendar_events';
    ELSE
        RAISE NOTICE 'Column transaction_date_type already exists';
    END IF;
    
    RAISE NOTICE '=== Transaction calendar columns added successfully! ===';
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_transaction_id 
ON calendar_events(transaction_id);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_events'
AND column_name IN ('transaction_id', 'transaction_date_type')
ORDER BY ordinal_position;

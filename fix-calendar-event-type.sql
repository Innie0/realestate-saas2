-- Fix calendar_events event_type constraint to include 'transaction'
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing check constraint
DO $$ 
BEGIN
    -- Find and drop the constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE calendar_events 
        DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;
        RAISE NOTICE 'Dropped existing event_type constraint';
    END IF;
END $$;

-- Step 2: Add the updated constraint with 'transaction' included
ALTER TABLE calendar_events 
ADD CONSTRAINT calendar_events_event_type_check 
CHECK (event_type IN ('showing', 'open_house', 'meeting', 'transaction', 'other'));

-- Step 3: Verify the constraint was added
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'calendar_events_event_type_check';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Calendar event_type constraint updated!';
    RAISE NOTICE 'Allowed values now: showing, open_house, meeting, transaction, other';
END $$;

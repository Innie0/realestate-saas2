-- Calendar Sync Migration
-- Run this in your Supabase SQL Editor to enable calendar sync
-- This adds unique constraints needed for proper event syncing

-- Add unique constraint to google_event_id if it doesn't exist
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
        RAISE NOTICE 'ℹ️ Unique constraint for google_event_id already exists';
    END IF;
END $$;

-- Add unique constraint to outlook_event_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'calendar_events_outlook_event_id_key'
    ) THEN
        ALTER TABLE calendar_events 
        ADD CONSTRAINT calendar_events_outlook_event_id_key 
        UNIQUE (outlook_event_id);
        
        RAISE NOTICE '✅ Added unique constraint for outlook_event_id';
    ELSE
        RAISE NOTICE 'ℹ️ Unique constraint for outlook_event_id already exists';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Calendar sync migration completed successfully!';
  RAISE NOTICE '🎉 You can now connect Google Calendar and sync events.';
END $$;







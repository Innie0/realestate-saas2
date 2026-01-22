-- Fix missing columns in transaction_reminders table
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    -- Add days_before column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transaction_reminders' 
        AND column_name = 'days_before'
    ) THEN
        ALTER TABLE transaction_reminders 
        ADD COLUMN days_before INTEGER;
        RAISE NOTICE 'Added days_before column to transaction_reminders';
    ELSE
        RAISE NOTICE 'Column days_before already exists';
    END IF;
    
    -- Verify all required columns exist
    RAISE NOTICE '=== Checking all transaction_reminders columns ===';
    
    -- Check other potentially missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'id') THEN
        RAISE EXCEPTION 'Table transaction_reminders does not exist or is missing critical columns. Please run the full schema.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'transaction_id') THEN
        ALTER TABLE transaction_reminders ADD COLUMN transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added transaction_id column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'user_id') THEN
        ALTER TABLE transaction_reminders ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'title') THEN
        ALTER TABLE transaction_reminders ADD COLUMN title TEXT NOT NULL;
        RAISE NOTICE 'Added title column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'description') THEN
        ALTER TABLE transaction_reminders ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'reminder_date') THEN
        ALTER TABLE transaction_reminders ADD COLUMN reminder_date TIMESTAMP WITH TIME ZONE NOT NULL;
        RAISE NOTICE 'Added reminder_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'reminder_type') THEN
        ALTER TABLE transaction_reminders ADD COLUMN reminder_type TEXT CHECK (reminder_type IN ('inspection', 'appraisal', 'financing', 'closing', 'custom'));
        RAISE NOTICE 'Added reminder_type column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'is_sent') THEN
        ALTER TABLE transaction_reminders ADD COLUMN is_sent BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_sent column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'sent_at') THEN
        ALTER TABLE transaction_reminders ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added sent_at column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'is_dismissed') THEN
        ALTER TABLE transaction_reminders ADD COLUMN is_dismissed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_dismissed column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'created_at') THEN
        ALTER TABLE transaction_reminders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_reminders' AND column_name = 'updated_at') THEN
        ALTER TABLE transaction_reminders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
    
    RAISE NOTICE '=== All transaction_reminders columns verified! ===';
END $$;

-- Show all columns in transaction_reminders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transaction_reminders'
ORDER BY ordinal_position;

-- Quick fix to add missing is_dismissed column
-- Run this in Supabase SQL Editor

-- Check if column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transaction_reminders' 
        AND column_name = 'is_dismissed'
    ) THEN
        ALTER TABLE transaction_reminders 
        ADD COLUMN is_dismissed BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Added is_dismissed column to transaction_reminders';
    ELSE
        RAISE NOTICE 'Column is_dismissed already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transaction_reminders'
ORDER BY ordinal_position;

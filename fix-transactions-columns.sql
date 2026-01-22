-- Fix missing columns in transactions table
-- Run this in your Supabase SQL Editor

-- Add project_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'project_id'
    ) THEN
        -- Check if projects table exists before adding foreign key
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
            ALTER TABLE transactions 
            ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added project_id column with foreign key to transactions';
        ELSE
            ALTER TABLE transactions 
            ADD COLUMN project_id UUID;
            RAISE NOTICE 'Added project_id column (no foreign key - projects table does not exist)';
        END IF;
    ELSE
        RAISE NOTICE 'Column project_id already exists';
    END IF;
END $$;

-- Add client_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'client_id'
    ) THEN
        -- Check if clients table exists before adding foreign key
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
            ALTER TABLE transactions 
            ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added client_id column with foreign key to transactions';
        ELSE
            ALTER TABLE transactions 
            ADD COLUMN client_id UUID;
            RAISE NOTICE 'Added client_id column (no foreign key - clients table does not exist)';
        END IF;
    ELSE
        RAISE NOTICE 'Column client_id already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
AND column_name IN ('project_id', 'client_id')
ORDER BY ordinal_position;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE 'Transaction columns fix completed successfully!';
END $$;

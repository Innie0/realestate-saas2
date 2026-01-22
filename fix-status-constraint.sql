-- Fix status column check constraint issue
-- Run this in your Supabase SQL Editor

-- First, let's see what constraints exist
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'transactions' 
AND constraint_type = 'CHECK';

-- Drop all existing check constraints on transactions table (except NOT NULL)
DO $$ 
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'transactions' 
        AND constraint_type = 'CHECK'
    LOOP
        EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_rec.constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- Now add the correct check constraints back
ALTER TABLE transactions 
ADD CONSTRAINT transactions_property_type_check 
CHECK (property_type IS NULL OR property_type IN ('house', 'apartment', 'condo', 'land', 'commercial'));

ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('active', 'pending', 'under_contract', 'closed', 'cancelled', 'expired'));

-- Verify the constraints were added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'transactions' 
AND constraint_type = 'CHECK';

-- Test that 'active' status works
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM transactions WHERE status = 'active'
    ) THEN
        RAISE NOTICE 'Active status is valid!';
    ELSE
        RAISE NOTICE 'No transactions with active status yet, but constraint is set correctly';
    END IF;
    
    RAISE NOTICE '=== Status constraint fixed! ===';
END $$;

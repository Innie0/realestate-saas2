-- Comprehensive fix for ALL missing columns in transactions table
-- Run this in your Supabase SQL Editor

-- Add ALL potentially missing columns
DO $$ 
BEGIN
    -- Property Information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'property_address') THEN
        ALTER TABLE transactions ADD COLUMN property_address TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added property_address column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'property_city') THEN
        ALTER TABLE transactions ADD COLUMN property_city TEXT;
        RAISE NOTICE 'Added property_city column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'property_state') THEN
        ALTER TABLE transactions ADD COLUMN property_state TEXT;
        RAISE NOTICE 'Added property_state column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'property_zip') THEN
        ALTER TABLE transactions ADD COLUMN property_zip TEXT;
        RAISE NOTICE 'Added property_zip column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'property_type') THEN
        ALTER TABLE transactions ADD COLUMN property_type TEXT CHECK (property_type IN ('house', 'apartment', 'condo', 'land', 'commercial'));
        RAISE NOTICE 'Added property_type column';
    END IF;
    
    -- Buyer Information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_name') THEN
        ALTER TABLE transactions ADD COLUMN buyer_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added buyer_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_email') THEN
        ALTER TABLE transactions ADD COLUMN buyer_email TEXT;
        RAISE NOTICE 'Added buyer_email column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_phone') THEN
        ALTER TABLE transactions ADD COLUMN buyer_phone TEXT;
        RAISE NOTICE 'Added buyer_phone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_agent_name') THEN
        ALTER TABLE transactions ADD COLUMN buyer_agent_name TEXT;
        RAISE NOTICE 'Added buyer_agent_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_agent_email') THEN
        ALTER TABLE transactions ADD COLUMN buyer_agent_email TEXT;
        RAISE NOTICE 'Added buyer_agent_email column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_agent_phone') THEN
        ALTER TABLE transactions ADD COLUMN buyer_agent_phone TEXT;
        RAISE NOTICE 'Added buyer_agent_phone column';
    END IF;
    
    -- Seller Information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_name') THEN
        ALTER TABLE transactions ADD COLUMN seller_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added seller_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_email') THEN
        ALTER TABLE transactions ADD COLUMN seller_email TEXT;
        RAISE NOTICE 'Added seller_email column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_phone') THEN
        ALTER TABLE transactions ADD COLUMN seller_phone TEXT;
        RAISE NOTICE 'Added seller_phone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_agent_name') THEN
        ALTER TABLE transactions ADD COLUMN seller_agent_name TEXT;
        RAISE NOTICE 'Added seller_agent_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_agent_email') THEN
        ALTER TABLE transactions ADD COLUMN seller_agent_email TEXT;
        RAISE NOTICE 'Added seller_agent_email column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_agent_phone') THEN
        ALTER TABLE transactions ADD COLUMN seller_agent_phone TEXT;
        RAISE NOTICE 'Added seller_agent_phone column';
    END IF;
    
    -- Financial Information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'offer_price') THEN
        ALTER TABLE transactions ADD COLUMN offer_price DECIMAL(12, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added offer_price column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'earnest_money') THEN
        ALTER TABLE transactions ADD COLUMN earnest_money DECIMAL(12, 2);
        RAISE NOTICE 'Added earnest_money column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'down_payment') THEN
        ALTER TABLE transactions ADD COLUMN down_payment DECIMAL(12, 2);
        RAISE NOTICE 'Added down_payment column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'loan_amount') THEN
        ALTER TABLE transactions ADD COLUMN loan_amount DECIMAL(12, 2);
        RAISE NOTICE 'Added loan_amount column';
    END IF;
    
    -- Key Terms columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'terms') THEN
        ALTER TABLE transactions ADD COLUMN terms JSONB DEFAULT '{}';
        RAISE NOTICE 'Added terms column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'notes') THEN
        ALTER TABLE transactions ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Important Dates columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'offer_date') THEN
        ALTER TABLE transactions ADD COLUMN offer_date DATE;
        RAISE NOTICE 'Added offer_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'acceptance_date') THEN
        ALTER TABLE transactions ADD COLUMN acceptance_date DATE;
        RAISE NOTICE 'Added acceptance_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'inspection_date') THEN
        ALTER TABLE transactions ADD COLUMN inspection_date DATE;
        RAISE NOTICE 'Added inspection_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'inspection_deadline') THEN
        ALTER TABLE transactions ADD COLUMN inspection_deadline DATE;
        RAISE NOTICE 'Added inspection_deadline column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'appraisal_date') THEN
        ALTER TABLE transactions ADD COLUMN appraisal_date DATE;
        RAISE NOTICE 'Added appraisal_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'appraisal_deadline') THEN
        ALTER TABLE transactions ADD COLUMN appraisal_deadline DATE;
        RAISE NOTICE 'Added appraisal_deadline column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'financing_deadline') THEN
        ALTER TABLE transactions ADD COLUMN financing_deadline DATE;
        RAISE NOTICE 'Added financing_deadline column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'title_deadline') THEN
        ALTER TABLE transactions ADD COLUMN title_deadline DATE;
        RAISE NOTICE 'Added title_deadline column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'closing_date') THEN
        ALTER TABLE transactions ADD COLUMN closing_date DATE;
        RAISE NOTICE 'Added closing_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'possession_date') THEN
        ALTER TABLE transactions ADD COLUMN possession_date DATE;
        RAISE NOTICE 'Added possession_date column';
    END IF;
    
    -- Status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'status') THEN
        ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'under_contract', 'closed', 'cancelled', 'expired'));
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- Foreign key columns (project_id and client_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'project_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
            ALTER TABLE transactions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added project_id column with foreign key';
        ELSE
            ALTER TABLE transactions ADD COLUMN project_id UUID;
            RAISE NOTICE 'Added project_id column (no foreign key)';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'client_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
            ALTER TABLE transactions ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added client_id column with foreign key';
        ELSE
            ALTER TABLE transactions ADD COLUMN client_id UUID;
            RAISE NOTICE 'Added client_id column (no foreign key)';
        END IF;
    END IF;
    
    RAISE NOTICE '=== All missing columns have been added! ===';
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

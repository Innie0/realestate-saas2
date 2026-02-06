-- Add property_address field to contracts table
-- Run this in Supabase SQL Editor to add property grouping

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS property_address VARCHAR(500);

-- Add index for property address queries
CREATE INDEX IF NOT EXISTS idx_contracts_property_address ON contracts(property_address);

-- Update comment
COMMENT ON COLUMN contracts.property_address IS 'Property address for grouping contracts (optional, can use transaction.property_address if linked)';

-- Leads inbox vs CRM separation
-- Captured leads (form, open house) stay in the inbox until the agent adds them to CRM.
-- Run in Supabase SQL editor (safe to run multiple times).

ALTER TABLE clients ADD COLUMN IF NOT EXISTS in_crm BOOLEAN NOT NULL DEFAULT false;

-- Existing manual clients belong in CRM
UPDATE clients SET in_crm = true WHERE source = 'manual' OR source IS NULL;

-- Captured leads stay in inbox until promoted
UPDATE clients SET in_crm = false WHERE source IN ('lead_form', 'open_house');

CREATE INDEX IF NOT EXISTS idx_clients_in_crm ON clients(user_id, in_crm);

DO $$
BEGIN
  RAISE NOTICE 'Leads inbox / CRM column ready.';
END $$;

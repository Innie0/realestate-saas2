-- Lead Capture Feature Migration
-- Adds optional columns to the existing `clients` table so that publicly
-- submitted leads can be stored alongside manually created clients.
--
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Run this in your Supabase SQL editor.

-- Where the client/lead came from: 'manual' (added by agent) or 'lead_form' (public form)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Inbox vs CRM: captured leads default to inbox until promoted (see leads-inbox-crm.sql)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS in_crm BOOLEAN NOT NULL DEFAULT false;

-- What the lead is interested in: 'buyer', 'seller', 'renter', 'browsing', or NULL
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_type TEXT;

-- Free-text message the lead left when submitting the form
ALTER TABLE clients ADD COLUMN IF NOT EXISTS message TEXT;

-- Index to quickly filter leads vs. manually added clients
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);

-- NOTE ON SECURITY:
-- The public lead form writes to this table using the Supabase SERVICE ROLE key
-- from a server-side API route (app/api/leads/route.ts). The service role
-- bypasses Row Level Security, so no additional public INSERT policy is needed
-- (and we deliberately avoid one to prevent spam writes directly to the DB).

DO $$
BEGIN
  RAISE NOTICE 'Lead capture columns added to clients table successfully!';
END $$;

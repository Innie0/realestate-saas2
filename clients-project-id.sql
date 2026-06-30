-- Link listing-page leads to the project they inquired about.
-- Run in Supabase SQL Editor.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_project_id
  ON clients(project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_listing_inquiries
  ON clients(user_id, created_at DESC)
  WHERE source = 'listing_page';

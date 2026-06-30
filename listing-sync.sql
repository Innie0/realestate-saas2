-- Rentcast listing sync: track MLS-style status on marketplace projects.
-- Run in Supabase SQL Editor.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_published_sync
  ON projects(published, last_synced_at)
  WHERE published = TRUE;

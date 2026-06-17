-- Publish listing pages: public shareable URLs for agent projects.
-- Run in Supabase SQL Editor if not already applied.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_published
  ON projects(user_id, published)
  WHERE published = TRUE;

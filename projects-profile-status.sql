-- Agents choose which projects show on their public agent profile.
-- NULL (the default) = not shown, so nothing changes for existing projects.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS profile_status TEXT
  CHECK (profile_status IN ('active', 'pending', 'sold'));

CREATE INDEX IF NOT EXISTS idx_projects_profile_listings
  ON projects (user_id, updated_at DESC)
  WHERE profile_status IS NOT NULL;

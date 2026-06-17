-- Optional agent profile fields for public profile page.
-- Run in Supabase SQL Editor if not already applied.

ALTER TABLE agent_settings
  ADD COLUMN IF NOT EXISTS profile_brokerage TEXT,
  ADD COLUMN IF NOT EXISTS profile_license TEXT,
  ADD COLUMN IF NOT EXISTS profile_website TEXT,
  ADD COLUMN IF NOT EXISTS profile_years_experience INTEGER;

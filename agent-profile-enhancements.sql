-- Optional agent profile fields for public profile page.
-- Run in Supabase SQL Editor if not already applied.

ALTER TABLE agent_settings
  ADD COLUMN IF NOT EXISTS profile_brokerage TEXT,
  ADD COLUMN IF NOT EXISTS profile_license TEXT,
  ADD COLUMN IF NOT EXISTS profile_website TEXT,
  ADD COLUMN IF NOT EXISTS profile_years_experience INTEGER;

-- Ensure users can insert/update their own settings row (fixes profile toggle not saving).
DROP POLICY IF EXISTS "Users can manage own agent settings" ON agent_settings;
CREATE POLICY "Users can manage own agent settings"
  ON agent_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

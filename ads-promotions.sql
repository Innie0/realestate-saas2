-- Listing ad promotions + lead attribution from paid ads
-- Run in Supabase SQL editor after ads-management.sql

ALTER TABLE clients ADD COLUMN IF NOT EXISTS ad_source TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_ad_source
  ON clients(user_id, ad_source)
  WHERE ad_source IS NOT NULL;

CREATE TABLE IF NOT EXISTS ad_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('google', 'meta')),
  daily_budget_cents INTEGER NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'ended', 'failed')),
  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  meta_ad_id TEXT,
  headline TEXT,
  primary_text TEXT,
  landing_url TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_promotions_user_id ON ad_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_promotions_project_id ON ad_promotions(project_id);

ALTER TABLE ad_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ad promotions" ON ad_promotions;
CREATE POLICY "Users can view own ad promotions"
  ON ad_promotions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own ad promotions" ON ad_promotions;
CREATE POLICY "Users can manage own ad promotions"
  ON ad_promotions FOR ALL
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ad_promotions_updated_at ON ad_promotions;
CREATE TRIGGER update_ad_promotions_updated_at
  BEFORE UPDATE ON ad_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

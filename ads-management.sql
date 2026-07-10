-- Ads Management — Google Ads & Meta Ads OAuth connections
-- Run in Supabase SQL editor before using /dashboard/ads

CREATE TABLE IF NOT EXISTS ad_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'meta')),
  account_id TEXT,
  account_name TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_user_id ON ad_platform_connections(user_id);

ALTER TABLE ad_platform_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ad connections" ON ad_platform_connections;
CREATE POLICY "Users can view own ad connections"
  ON ad_platform_connections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own ad connections" ON ad_platform_connections;
CREATE POLICY "Users can manage own ad connections"
  ON ad_platform_connections FOR ALL
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_ad_platform_connections_updated_at ON ad_platform_connections;
CREATE TRIGGER update_ad_platform_connections_updated_at
  BEFORE UPDATE ON ad_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

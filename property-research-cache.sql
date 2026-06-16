-- Cached property research results (per user) to reduce Rentcast/BatchData API calls.
-- Run in Supabase SQL Editor if not already applied.

CREATE TABLE IF NOT EXISTS property_research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('property_lookup', 'market_analysis', 'market_prefill')),
  cache_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, cache_type, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_property_research_cache_user
  ON property_research_cache(user_id, cache_type, cache_key);

CREATE INDEX IF NOT EXISTS idx_property_research_cache_expires
  ON property_research_cache(expires_at);

ALTER TABLE property_research_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own research cache" ON property_research_cache;
CREATE POLICY "Users manage own research cache"
  ON property_research_cache
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

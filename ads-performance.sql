-- Ad performance metrics + AI insights (Part 2)
-- Run in Supabase SQL editor after ads-promotions.sql

ALTER TABLE ad_promotions ADD COLUMN IF NOT EXISTS ad_type TEXT;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS ad_promotion_id UUID REFERENCES ad_promotions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_ad_promotion_id
  ON clients(user_id, ad_promotion_id)
  WHERE ad_promotion_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS ad_performance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES ad_promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google', 'meta')),
  date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  spend_cents INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  frequency NUMERIC(8, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (promotion_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ad_performance_promotion_date
  ON ad_performance_daily(promotion_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_ad_performance_user_date
  ON ad_performance_daily(user_id, date DESC);

ALTER TABLE ad_performance_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ad performance" ON ad_performance_daily;
CREATE POLICY "Users can view own ad performance"
  ON ad_performance_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ad_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('winner', 'underperformer', 'creative_fatigue', 'budget_reallocation', 'audience_tuning')
  ),
  message TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  related_ad_ids UUID[] NOT NULL DEFAULT '{}',
  ad_type TEXT,
  platform TEXT CHECK (platform IS NULL OR platform IN ('google', 'meta')),
  metadata JSONB DEFAULT '{}',
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_ai_insights_user_active
  ON ad_ai_insights(user_id, created_at DESC)
  WHERE dismissed = FALSE;

ALTER TABLE ad_ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ad insights" ON ad_ai_insights;
CREATE POLICY "Users can view own ad insights"
  ON ad_ai_insights FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own ad insights" ON ad_ai_insights;
CREATE POLICY "Users can manage own ad insights"
  ON ad_ai_insights FOR ALL
  USING (auth.uid() = user_id);

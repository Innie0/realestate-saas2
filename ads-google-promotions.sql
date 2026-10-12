-- Google Ads publishing: store the Google campaign created for each promotion.
-- Run once in the Supabase SQL editor (after ads-promotions.sql).

ALTER TABLE ad_promotions
  ADD COLUMN IF NOT EXISTS google_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS google_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS google_ad_group_id TEXT,
  ADD COLUMN IF NOT EXISTS google_ad_id TEXT;

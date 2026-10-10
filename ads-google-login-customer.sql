-- Google Ads accounts reached through a manager (MCC) account need the manager's
-- id sent with every API call. Run once in the Supabase SQL editor.

ALTER TABLE ad_platform_connections
  ADD COLUMN IF NOT EXISTS login_customer_id TEXT;

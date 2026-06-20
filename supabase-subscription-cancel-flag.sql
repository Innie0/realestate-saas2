-- Track Stripe cancel-at-period-end on users (run in Supabase SQL Editor)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

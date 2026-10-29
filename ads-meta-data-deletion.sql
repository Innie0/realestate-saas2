-- Meta deauthorize + data deletion callbacks.
-- 1) Remember which Facebook user each Meta connection belongs to, so Meta's
--    callbacks (which only send the Facebook user ID) can find the right account.
ALTER TABLE ad_platform_connections ADD COLUMN IF NOT EXISTS external_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ad_platform_connections_external_user
  ON ad_platform_connections (provider, external_user_id)
  WHERE external_user_id IS NOT NULL;

-- 2) Deletion requests Meta sends us, with a code Meta and the person can use to check status.
--    Only the server (service role) reads or writes this table.
CREATE TABLE IF NOT EXISTS meta_data_deletion_requests (
  confirmation_code TEXT PRIMARY KEY,
  meta_user_id TEXT NOT NULL,
  oikaro_user_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE meta_data_deletion_requests ENABLE ROW LEVEL SECURITY;

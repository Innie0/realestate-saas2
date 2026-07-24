-- Client activity log (calls, emails, showings)

CREATE TABLE IF NOT EXISTS client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'showing')),
  title TEXT NOT NULL,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_activities_client
  ON client_activities(client_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_activities_user
  ON client_activities(user_id);

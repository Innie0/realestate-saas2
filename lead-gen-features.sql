-- Lead Generation Features Migration
-- Adds: agent_settings, email_sequences, open_houses tables
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Run this in your Supabase SQL editor.

-- ─── Agent Settings ──────────────────────────────────────────────────────────
-- Per-agent preferences for lead gen tools (email follow-ups, SMS, profile).
CREATE TABLE IF NOT EXISTS agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  auto_followup_enabled BOOLEAN DEFAULT FALSE,
  sms_alerts_enabled BOOLEAN DEFAULT FALSE,
  sms_phone TEXT,
  profile_enabled BOOLEAN DEFAULT FALSE,
  profile_headline TEXT,
  profile_bio TEXT,
  profile_photo_url TEXT,
  profile_specialties TEXT[] DEFAULT '{}',
  profile_areas TEXT[] DEFAULT '{}',
  profile_phone TEXT,
  profile_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_settings_user_id ON agent_settings(user_id);

ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent settings" ON agent_settings;
CREATE POLICY "Users can view own agent settings"
  ON agent_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own agent settings" ON agent_settings;
CREATE POLICY "Users can manage own agent settings"
  ON agent_settings FOR ALL
  USING (auth.uid() = user_id);

-- ─── Email Sequences ─────────────────────────────────────────────────────────
-- Scheduled outbound follow-up emails for leads.
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template TEXT NOT NULL CHECK (template IN ('welcome', 'follow_up_1', 'follow_up_2')),
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_status_send_at ON email_sequences(status, send_at);
CREATE INDEX IF NOT EXISTS idx_email_sequences_agent ON email_sequences(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_client ON email_sequences(client_id);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email sequences" ON email_sequences;
CREATE POLICY "Users can view own email sequences"
  ON email_sequences FOR SELECT
  USING (auth.uid() = agent_user_id);

DROP POLICY IF EXISTS "Users can manage own email sequences" ON email_sequences;
CREATE POLICY "Users can manage own email sequences"
  ON email_sequences FOR ALL
  USING (auth.uid() = agent_user_id);

-- ─── Open Houses ─────────────────────────────────────────────────────────────
-- Agent-created open house events with public sign-in pages.
CREATE TABLE IF NOT EXISTS open_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_open_houses_user_id ON open_houses(user_id);
CREATE INDEX IF NOT EXISTS idx_open_houses_date ON open_houses(date);
CREATE INDEX IF NOT EXISTS idx_open_houses_status ON open_houses(status);

ALTER TABLE open_houses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own open houses" ON open_houses;
CREATE POLICY "Users can view own open houses"
  ON open_houses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own open houses" ON open_houses;
CREATE POLICY "Users can manage own open houses"
  ON open_houses FOR ALL
  USING (auth.uid() = user_id);

-- ─── Allow 'open_house' as a client source ───────────────────────────────────
-- The source column on clients was added by add-leads-feature.sql as a TEXT
-- column (no CHECK constraint), so 'open_house' is already valid. No ALTER
-- needed — just documenting the convention.

-- ─── Triggers ────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS update_agent_settings_updated_at ON agent_settings;
CREATE TRIGGER update_agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_open_houses_updated_at ON open_houses;
CREATE TRIGGER update_open_houses_updated_at
  BEFORE UPDATE ON open_houses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE 'Lead generation feature tables created successfully!';
END $$;

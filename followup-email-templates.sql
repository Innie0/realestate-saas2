-- Custom follow-up email templates and send timing (agent_settings)
-- Safe to run multiple times.

ALTER TABLE agent_settings
  ADD COLUMN IF NOT EXISTS followup_email_1_day INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followup_email_2_day INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS followup_email_3_day INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS followup_email_1_subject TEXT,
  ADD COLUMN IF NOT EXISTS followup_email_1_body TEXT,
  ADD COLUMN IF NOT EXISTS followup_email_2_subject TEXT,
  ADD COLUMN IF NOT EXISTS followup_email_2_body TEXT,
  ADD COLUMN IF NOT EXISTS followup_email_3_subject TEXT,
  ADD COLUMN IF NOT EXISTS followup_email_3_body TEXT;

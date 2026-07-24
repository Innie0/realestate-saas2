-- Hot / Warm / Cold multi-step lead sequences (email + task) with AI personalization.
-- Run in Supabase SQL editor after lead-gen-features.sql.

-- Per-agent sequence templates by lead temperature
CREATE TABLE IF NOT EXISTS sequence_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature TEXT NOT NULL CHECK (temperature IN ('hot', 'warm', 'cold')),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_user_id, temperature)
);

CREATE TABLE IF NOT EXISTS sequence_template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES sequence_templates(id) ON DELETE CASCADE,
  step_order INT NOT NULL CHECK (step_order >= 0),
  step_type TEXT NOT NULL CHECK (step_type IN ('email', 'task')),
  delay_minutes INT NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  subject_template TEXT,
  body_template TEXT,
  task_title TEXT,
  task_description TEXT,
  requires_agent_approval BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, step_order)
);

-- One active enrollment per lead at a time
CREATE TABLE IF NOT EXISTS lead_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES sequence_templates(id) ON DELETE RESTRICT,
  temperature_at_enroll TEXT NOT NULL CHECK (temperature_at_enroll IN ('hot', 'warm', 'cold')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_sequence_enrollments_one_active
  ON lead_sequence_enrollments (client_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_lead_sequence_enrollments_agent
  ON lead_sequence_enrollments (agent_user_id, status);

-- Materialized due work for each enrollment step
CREATE TABLE IF NOT EXISTS lead_sequence_step_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES lead_sequence_enrollments(id) ON DELETE CASCADE,
  step_index INT NOT NULL CHECK (step_index >= 0),
  step_type TEXT NOT NULL CHECK (step_type IN ('email', 'task')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'awaiting_approval', 'pending', 'sent', 'completed',
      'skipped', 'cancelled', 'failed'
    )),
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  subject TEXT,
  body TEXT,
  task_title TEXT,
  task_description TEXT,
  reminder_id UUID REFERENCES reminders(id) ON DELETE SET NULL,
  agent_approved_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_lead_sequence_steps_due
  ON lead_sequence_step_instances (status, due_at)
  WHERE status IN ('pending', 'awaiting_approval');

CREATE INDEX IF NOT EXISTS idx_lead_sequence_steps_enrollment
  ON lead_sequence_step_instances (enrollment_id, step_index);

-- Cached AI analysis for lead personalization
CREATE TABLE IF NOT EXISTS lead_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_read TEXT,
  recommended_tone TEXT,
  talking_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  email_angle TEXT,
  stale BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_ai_insights_agent
  ON lead_ai_insights (agent_user_id);

-- RLS
ALTER TABLE sequence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sequence_step_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents manage own sequence templates" ON sequence_templates;
CREATE POLICY "Agents manage own sequence templates"
  ON sequence_templates FOR ALL
  USING (auth.uid() = agent_user_id)
  WITH CHECK (auth.uid() = agent_user_id);

DROP POLICY IF EXISTS "Agents manage own template steps" ON sequence_template_steps;
CREATE POLICY "Agents manage own template steps"
  ON sequence_template_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sequence_templates t
      WHERE t.id = template_id AND t.agent_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sequence_templates t
      WHERE t.id = template_id AND t.agent_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents manage own enrollments" ON lead_sequence_enrollments;
CREATE POLICY "Agents manage own enrollments"
  ON lead_sequence_enrollments FOR ALL
  USING (auth.uid() = agent_user_id)
  WITH CHECK (auth.uid() = agent_user_id);

DROP POLICY IF EXISTS "Agents manage own step instances" ON lead_sequence_step_instances;
CREATE POLICY "Agents manage own step instances"
  ON lead_sequence_step_instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lead_sequence_enrollments e
      WHERE e.id = enrollment_id AND e.agent_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lead_sequence_enrollments e
      WHERE e.id = enrollment_id AND e.agent_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agents manage own lead insights" ON lead_ai_insights;
CREATE POLICY "Agents manage own lead insights"
  ON lead_ai_insights FOR ALL
  USING (auth.uid() = agent_user_id)
  WITH CHECK (auth.uid() = agent_user_id);

import type { LeadTemperature } from '@/lib/lead-temperature';

export type SequenceStepType = 'email' | 'task';

export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type StepInstanceStatus =
  | 'awaiting_approval'
  | 'pending'
  | 'sent'
  | 'completed'
  | 'skipped'
  | 'cancelled'
  | 'failed';

export type DefaultStepDefinition = {
  step_type: SequenceStepType;
  delay_minutes: number;
  subject_template?: string;
  body_template?: string;
  task_title?: string;
  task_description?: string;
  requires_agent_approval?: boolean;
};

export type LeadAiInsight = {
  lead_read: string;
  recommended_tone: string;
  talking_points: string[];
  email_angle: string;
};

export type LeadSequenceContext = {
  clientId: string;
  agentId: string;
  leadName: string;
  leadEmail: string;
  leadType?: string | null;
  message?: string | null;
  source?: string | null;
  area?: string;
  budget?: string;
  timeline?: string;
  temperature: LeadTemperature;
};

export type SequenceTemplateRow = {
  id: string;
  agent_user_id: string;
  temperature: LeadTemperature;
  name: string;
  is_active: boolean;
};

export type SequenceTemplateStepRow = {
  id: string;
  template_id: string;
  step_order: number;
  step_type: SequenceStepType;
  delay_minutes: number;
  subject_template: string | null;
  body_template: string | null;
  task_title: string | null;
  task_description: string | null;
  requires_agent_approval: boolean;
};

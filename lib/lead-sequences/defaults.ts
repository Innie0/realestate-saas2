import type { DefaultStepDefinition } from '@/lib/lead-sequences/types';
import type { LeadTemperature } from '@/lib/lead-temperature';
import type { FollowupSettings } from '@/lib/followup-emails';
import {
  FOLLOWUP_TEMPLATE_DEFINITIONS,
  getTemplateDraft,
} from '@/lib/followup-emails';

const WELCOME = FOLLOWUP_TEMPLATE_DEFINITIONS[0];
const CHECKIN = FOLLOWUP_TEMPLATE_DEFINITIONS[1];
const NUDGE = FOLLOWUP_TEMPLATE_DEFINITIONS[2];

function emailStep(
  subject: string,
  body: string,
  delay_minutes: number,
  requires_agent_approval = false,
): DefaultStepDefinition {
  return {
    step_type: 'email',
    delay_minutes,
    subject_template: subject,
    body_template: body,
    requires_agent_approval,
  };
}

function taskStep(
  title: string,
  description: string,
  delay_minutes: number,
): DefaultStepDefinition {
  return {
    step_type: 'task',
    delay_minutes,
    task_title: title,
    task_description: description,
  };
}

/** Built-in sequences — first email always requires agent approval. */
export const DEFAULT_SEQUENCE_STEPS: Record<LeadTemperature, DefaultStepDefinition[]> = {
  hot: [
    emailStep(WELCOME.defaultSubject, WELCOME.defaultBody, 0, true),
    taskStep('Call {{first_name}}', 'Hot lead — follow up by phone within a few hours.', 240),
    emailStep(CHECKIN.defaultSubject, CHECKIN.defaultBody, 1200),
    taskStep('Check in with {{first_name}}', 'Confirm interest and next steps.', 1440),
    emailStep(NUDGE.defaultSubject, NUDGE.defaultBody, 2880),
  ],
  warm: [
    emailStep(WELCOME.defaultSubject, WELCOME.defaultBody, 0, true),
    emailStep(CHECKIN.defaultSubject, CHECKIN.defaultBody, 1440),
    taskStep('Call {{first_name}}', 'Warm lead — schedule a discovery call.', 2880),
    emailStep(
      'Quick update for {{first_name}}',
      `Hi {{first_name}},

I wanted to share a few options that might fit what you're looking for{{area_in}}. Happy to walk through them whenever works for you.

{{agent_name}}`,
      5760,
    ),
    emailStep(NUDGE.defaultSubject, NUDGE.defaultBody, 10080),
  ],
  cold: [
    emailStep(WELCOME.defaultSubject, WELCOME.defaultBody, 0, true),
    emailStep(CHECKIN.defaultSubject, CHECKIN.defaultBody, 4320),
    emailStep(NUDGE.defaultSubject, NUDGE.defaultBody, 5760),
    taskStep('Re-engage {{first_name}}', 'Cold lead — light touch call or voicemail.', 10080),
    emailStep(
      'Still here if you need help, {{first_name}}',
      `Hi {{first_name}},

No pressure — I'm here whenever you're ready to pick things back up{{area_in}}.

{{agent_name}}`,
      10080,
    ),
  ],
};

export const SEQUENCE_TEMPLATE_NAMES: Record<LeadTemperature, string> = {
  hot: 'Hot lead sequence',
  warm: 'Warm lead sequence',
  cold: 'Cold lead sequence',
};

/** Overlay legacy 3-email agent settings onto default warm sequence emails. */
export function mergeLegacyFollowupSettings(
  temperature: LeadTemperature,
  steps: DefaultStepDefinition[],
  settings?: FollowupSettings | null,
): DefaultStepDefinition[] {
  if (!settings || temperature !== 'warm') return steps;

  const welcome = getTemplateDraft(settings, 1);
  const checkin = getTemplateDraft(settings, 2);
  const nudge = getTemplateDraft(settings, 3);

  return steps.map((step, index) => {
    if (step.step_type !== 'email') return step;
    if (index === 0) {
      return {
        ...step,
        subject_template: welcome.subject,
        body_template: welcome.body,
      };
    }
    if (index === 1) {
      return {
        ...step,
        subject_template: checkin.subject,
        body_template: checkin.body,
      };
    }
    if (index === steps.length - 1) {
      return {
        ...step,
        subject_template: nudge.subject,
        body_template: nudge.body,
      };
    }
    return step;
  });
}

export function parseLeadFieldsFromMessage(message = ''): {
  area?: string;
  budget?: string;
  timeline?: string;
} {
  const lines = message.split('\n');
  const pick = (prefix: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
    return line ? line.replace(/^[^:]+:\s*/i, '').trim() : undefined;
  };
  return {
    timeline: pick('Timeline'),
    budget: pick('Budget'),
    area: pick('Area'),
  };
}

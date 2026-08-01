import { formatReplyToHeader } from '@/lib/agent-reply-email';
import type { OutboundEmail } from '@/lib/resend';
import { SITE_FONT_STACK } from '@/lib/site-config';
import { getSupportFrom } from '@/lib/support-email';

const FROM_EMAIL = getSupportFrom();

export type FollowupTemplateKey = 'welcome' | 'follow_up_1' | 'follow_up_2';

export type FollowupTemplateSlot = 1 | 2 | 3;

export type FollowupSettings = {
  followup_email_1_day?: number | null;
  followup_email_2_day?: number | null;
  followup_email_3_day?: number | null;
  followup_email_1_subject?: string | null;
  followup_email_1_body?: string | null;
  followup_email_2_subject?: string | null;
  followup_email_2_body?: string | null;
  followup_email_3_subject?: string | null;
  followup_email_3_body?: string | null;
};

export type LeadFollowupContext = {
  leadName: string;
  leadEmail: string;
  agentName: string;
  agentReplyEmail?: string | null;
  leadType?: string | null;
  area?: string;
};

export type FollowupTemplateDefinition = {
  slot: FollowupTemplateSlot;
  key: FollowupTemplateKey;
  label: string;
  defaultDay: number;
  defaultSubject: string;
  defaultBody: string;
};

export const FOLLOWUP_MERGE_TAGS = [
  '{{first_name}}',
  '{{lead_name}}',
  '{{agent_name}}',
  '{{agent_first_name}}',
  '{{lead_type}}',
  '{{area}}',
  '{{area_in}}',
] as const;

export const FOLLOWUP_MERGE_TAG_OPTIONS = [
  { tag: '{{first_name}}', label: 'Lead first name' },
  { tag: '{{lead_name}}', label: 'Lead full name' },
  { tag: '{{agent_first_name}}', label: 'Your first name' },
  { tag: '{{agent_name}}', label: 'Your full name' },
  { tag: '{{lead_type}}', label: 'Lead type' },
  { tag: '{{area}}', label: 'Lead area' },
  { tag: '{{area_in}}', label: 'Area phrase' },
] as const;

export function insertTextAtSelection(
  value: string,
  insert: string,
  selectionStart: number,
  selectionEnd: number,
): { nextValue: string; cursor: number } {
  const nextValue = `${value.slice(0, selectionStart)}${insert}${value.slice(selectionEnd)}`;
  return { nextValue, cursor: selectionStart + insert.length };
}

export const FOLLOWUP_TEMPLATE_DEFINITIONS: FollowupTemplateDefinition[] = [
  {
    slot: 1,
    key: 'welcome',
    label: 'Welcome email',
    defaultDay: 0,
    defaultSubject: 'Thanks for reaching out, {{first_name}}!',
    defaultBody: `Hi {{first_name}},

Thanks for reaching out! {{agent_first_name}} received your info and will be in touch shortly.

In the meantime, feel free to reply to this email if you have any questions about {{lead_type}}.

Best,
{{agent_name}}`,
  },
  {
    slot: 2,
    key: 'follow_up_1',
    label: 'Check-in email',
    defaultDay: 2,
    defaultSubject: 'Still thinking about {{lead_type}}{{area_in}}?',
    defaultBody: `Hi {{first_name}},

Just checking in — I hope you're doing well! I wanted to follow up on your interest in {{lead_type}}{{area_in}}.

The market moves fast, and I'd love to help you stay ahead. Whether you have questions or are ready to take the next step, I'm here for you.

Just reply to this email — I typically respond within a few hours.

Talk soon,
{{agent_name}}`,
  },
  {
    slot: 3,
    key: 'follow_up_2',
    label: 'Final nudge',
    defaultDay: 5,
    defaultSubject: 'Any questions I can answer, {{first_name}}?',
    defaultBody: `Hi {{first_name}},

I know life gets busy, so I just wanted to send a quick note. If {{lead_type}} is still on your mind, I'm happy to answer any questions — no pressure at all.

Even if you're just exploring, I can send you some useful market info for your area. Just say the word!

All the best,
{{agent_name}}`,
  },
];

const TEMPLATE_BY_KEY = Object.fromEntries(
  FOLLOWUP_TEMPLATE_DEFINITIONS.map((definition) => [definition.key, definition]),
) as Record<FollowupTemplateKey, FollowupTemplateDefinition>;

const TEMPLATE_BY_SLOT = Object.fromEntries(
  FOLLOWUP_TEMPLATE_DEFINITIONS.map((definition) => [definition.slot, definition]),
) as Record<FollowupTemplateSlot, FollowupTemplateDefinition>;

function getLeadTypeLabel(leadType?: string | null): string {
  const labels: Record<string, string> = {
    buyer: 'buying',
    seller: 'selling',
    renter: 'renting',
    browsing: 'exploring',
  };
  return leadType ? labels[leadType] || leadType : 'your real estate search';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMergeValues(context: LeadFollowupContext): Record<string, string> {
  const firstName = context.leadName.trim().split(/\s+/)[0] || context.leadName;
  const agentFirst = context.agentName.trim().split(/\s+/)[0] || context.agentName;
  const leadType = getLeadTypeLabel(context.leadType);
  const area = context.area?.trim() || '';
  const areaIn = area ? ` in ${area}` : '';

  return {
    first_name: firstName,
    lead_name: context.leadName,
    agent_name: context.agentName,
    agent_first_name: agentFirst,
    lead_type: leadType,
    area,
    area_in: areaIn,
  };
}

export function applyMergeTags(template: string, context: LeadFollowupContext): string {
  const values = buildMergeValues(context);
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => values[key] ?? '');
}

function textToEmailHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return '';
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('');
}

function baseHtml(body: string, agentName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${SITE_FONT_STACK};">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:32px 28px;">
      ${body}
    </div>
    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent on behalf of ${escapeHtml(agentName)} via Oikaro</p>
    </div>
  </div>
</body>
</html>`;
}

function getTemplateField<T extends string | number>(
  settings: FollowupSettings | null | undefined,
  slot: FollowupTemplateSlot,
  field: 'day' | 'subject' | 'body',
): T | null | undefined {
  if (field === 'day') {
    return settings?.[`followup_email_${slot}_day` as keyof FollowupSettings] as T | null | undefined;
  }
  return settings?.[`followup_email_${slot}_${field}` as keyof FollowupSettings] as T | null | undefined;
}

export function getFollowupDaySchedule(settings?: FollowupSettings | null): Record<FollowupTemplateKey, number> {
  const normalized = normalizeFollowupDays(settings);
  return {
    welcome: normalized[1],
    follow_up_1: normalized[2],
    follow_up_2: normalized[3],
  };
}

export function normalizeFollowupDays(settings?: FollowupSettings | null): Record<FollowupTemplateSlot, number> {
  const defaults = {
    1: FOLLOWUP_TEMPLATE_DEFINITIONS[0].defaultDay,
    2: FOLLOWUP_TEMPLATE_DEFINITIONS[1].defaultDay,
    3: FOLLOWUP_TEMPLATE_DEFINITIONS[2].defaultDay,
  } as const;

  const checkin = clampFollowupCheckinDay(getTemplateField<number>(settings, 2, 'day'), defaults[2]);
  const nudge = clampFollowupNudgeDay(
    getTemplateField<number>(settings, 3, 'day'),
    checkin,
    defaults[3],
  );

  return {
    1: 0,
    2: checkin,
    3: nudge,
  };
}

export const MIN_FOLLOWUP_CHECKIN_DAY = 1;

export function clampFollowupCheckinDay(value: unknown, fallback = FOLLOWUP_TEMPLATE_DEFINITIONS[1].defaultDay): number {
  const parsed = clampDay(value, fallback);
  return Math.min(60, Math.max(MIN_FOLLOWUP_CHECKIN_DAY, parsed));
}

export function clampFollowupNudgeDay(
  value: unknown,
  checkinDay: number,
  fallback = FOLLOWUP_TEMPLATE_DEFINITIONS[2].defaultDay,
): number {
  const min = clampFollowupCheckinDay(checkinDay) + 1;
  const parsed = clampDay(value, fallback);
  return Math.min(60, Math.max(min, parsed));
}

export function clampDay(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(60, Math.max(0, Math.round(parsed)));
}

export function sanitizeFollowupSubject(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 200);
  return trimmed || null;
}

export function sanitizeFollowupBody(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 5000);
  return trimmed || null;
}

export function getTemplateDraft(
  settings: FollowupSettings | null | undefined,
  slot: FollowupTemplateSlot,
): { day: number; subject: string; body: string } {
  const definition = TEMPLATE_BY_SLOT[slot];
  const days = normalizeFollowupDays(settings);
  const customSubject = getTemplateField<string>(settings, slot, 'subject');
  const customBody = getTemplateField<string>(settings, slot, 'body');

  return {
    day: days[slot],
    subject: customSubject?.trim() || definition.defaultSubject,
    body: customBody?.trim() || definition.defaultBody,
  };
}

export function buildFollowupEmail(
  templateKey: FollowupTemplateKey,
  context: LeadFollowupContext,
  settings?: FollowupSettings | null,
): OutboundEmail {
  const definition = TEMPLATE_BY_KEY[templateKey];
  const draft = getTemplateDraft(settings, definition.slot);
  const subject = applyMergeTags(draft.subject, context);
  const bodyText = applyMergeTags(draft.body, context);
  const htmlBody = textToEmailHtml(bodyText);

  const email: OutboundEmail = {
    from: FROM_EMAIL,
    to: context.leadEmail,
    subject,
    html: baseHtml(htmlBody, context.agentName),
  };

  if (context.agentReplyEmail) {
    email.reply_to = formatReplyToHeader(context.agentReplyEmail, context.agentName);
  }

  return email;
}

export function computeFollowupSendAt(baseDate: Date, dayOffset: number): string {
  return new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString();
}

export function getFollowupScheduleSummary(settings?: FollowupSettings | null): string {
  const days = normalizeFollowupDays(settings);
  return `day ${days[1]}, day ${days[2]}, and day ${days[3]}`;
}

export function formatFollowupScheduleHuman(settings?: FollowupSettings | null): string {
  const days = normalizeFollowupDays(settings);
  const welcome = days[1] === 0 ? 'right away' : `day ${days[1]}`;
  return `${welcome}, day ${days[2]}, and day ${days[3]}`;
}

export const FOLLOWUP_PREVIEW_CONTEXT: LeadFollowupContext = {
  leadName: 'Sarah Johnson',
  leadEmail: 'sarah@example.com',
  agentName: 'You',
  leadType: 'buyer',
  area: 'Riverside',
};

export function getFollowupPreview(
  slot: FollowupTemplateSlot,
  settings?: FollowupSettings | null,
  context: LeadFollowupContext = FOLLOWUP_PREVIEW_CONTEXT,
): { subject: string; body: string; label: string } {
  const definition = TEMPLATE_BY_SLOT[slot];
  const draft = getTemplateDraft(settings, slot);
  return {
    label: definition.label,
    subject: applyMergeTags(draft.subject, context),
    body: applyMergeTags(draft.body, context),
  };
}

export function getDefaultFollowupSettingsPayload(): FollowupSettings {
  return {
    followup_email_1_day: FOLLOWUP_TEMPLATE_DEFINITIONS[0].defaultDay,
    followup_email_2_day: FOLLOWUP_TEMPLATE_DEFINITIONS[1].defaultDay,
    followup_email_3_day: FOLLOWUP_TEMPLATE_DEFINITIONS[2].defaultDay,
    followup_email_1_subject: null,
    followup_email_1_body: null,
    followup_email_2_subject: null,
    followup_email_2_body: null,
    followup_email_3_subject: null,
    followup_email_3_body: null,
  };
}

export function hasCustomFollowupCopy(settings?: FollowupSettings | null): boolean {
  if (!settings) return false;
  return FOLLOWUP_TEMPLATE_DEFINITIONS.some((definition) => {
    const subject = settings[`followup_email_${definition.slot}_subject` as keyof FollowupSettings];
    const body = settings[`followup_email_${definition.slot}_body` as keyof FollowupSettings];
    return Boolean(typeof subject === 'string' && subject.trim()) ||
      Boolean(typeof body === 'string' && body.trim());
  });
}

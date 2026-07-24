import OpenAI from 'openai';
import type { LeadAiInsight, LeadSequenceContext } from '@/lib/lead-sequences/types';
import type { LeadTemperature } from '@/lib/lead-temperature';
import { applyMergeTags, type LeadFollowupContext } from '@/lib/followup-emails';

const apiKey = process.env.OPENAI_API_KEY;

let openaiInstance: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!apiKey) return null;
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

function fallbackInsight(context: LeadSequenceContext): LeadAiInsight {
  const tone =
    context.temperature === 'hot'
      ? 'direct and responsive'
      : context.temperature === 'warm'
        ? 'helpful and consultative'
        : 'patient and low-pressure';

  return {
    lead_read: `${context.leadName} is a ${context.temperature} lead interested in ${context.leadType || 'real estate'}${context.area ? ` in ${context.area}` : ''}.`,
    recommended_tone: tone,
    talking_points: [
      context.timeline ? `Timeline: ${context.timeline}` : 'Ask about their timeline',
      context.budget ? `Budget: ${context.budget}` : 'Clarify budget and financing',
      context.area ? `Focus area: ${context.area}` : 'Confirm preferred neighborhoods',
    ].filter(Boolean),
    email_angle: 'Acknowledge their inquiry and offer a clear, low-friction next step.',
  };
}

function fallbackEmail(
  context: LeadSequenceContext,
  insight: LeadAiInsight,
  mergeContext: LeadFollowupContext,
  subjectTemplate: string,
  bodyTemplate: string,
): { subject: string; body: string } {
  const subject = applyMergeTags(subjectTemplate, mergeContext);
  const body = applyMergeTags(bodyTemplate, mergeContext);
  return { subject, body };
}

export async function generateLeadInsights(
  context: LeadSequenceContext,
  agentName: string,
): Promise<LeadAiInsight> {
  const client = getClient();
  if (!client) return fallbackInsight(context);

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You analyze real estate leads for agents. Return concise, actionable JSON. No markdown.',
        },
        {
          role: 'user',
          content: `Analyze this lead for a real estate agent follow-up sequence.

Lead: ${context.leadName}
Email: ${context.leadEmail}
Type: ${context.leadType || 'unknown'}
Temperature: ${context.temperature}
Source: ${context.source || 'unknown'}
Timeline: ${context.timeline || 'unknown'}
Budget: ${context.budget || 'unknown'}
Area: ${context.area || 'unknown'}
Message: ${context.message || 'none'}
Agent: ${agentName}

Return JSON:
{
  "lead_read": "one sentence summary for agent inbox",
  "recommended_tone": "2-4 words",
  "talking_points": ["3-5 short bullets"],
  "email_angle": "one sentence strategy for first outreach email"
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackInsight(context);
    const parsed = JSON.parse(raw) as Partial<LeadAiInsight>;
    return {
      lead_read: parsed.lead_read || fallbackInsight(context).lead_read,
      recommended_tone: parsed.recommended_tone || fallbackInsight(context).recommended_tone,
      talking_points: Array.isArray(parsed.talking_points)
        ? parsed.talking_points.map(String).slice(0, 5)
        : fallbackInsight(context).talking_points,
      email_angle: parsed.email_angle || fallbackInsight(context).email_angle,
    };
  } catch (err) {
    console.error('[AI] generateLeadInsights failed:', err);
    return fallbackInsight(context);
  }
}

export async function generatePersonalizedSequenceEmail(options: {
  context: LeadSequenceContext;
  insight: LeadAiInsight;
  mergeContext: LeadFollowupContext;
  subjectTemplate: string;
  bodyTemplate: string;
  stepIndex: number;
}): Promise<{ subject: string; body: string }> {
  const { context, insight, mergeContext, subjectTemplate, bodyTemplate, stepIndex } = options;
  const client = getClient();

  if (!client) {
    return fallbackEmail(context, insight, mergeContext, subjectTemplate, bodyTemplate);
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.65,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You write short, human real estate follow-up emails for agents. Plain text body with paragraph breaks. No HTML. Under 120 words.',
        },
        {
          role: 'user',
          content: `Write follow-up email #${stepIndex + 1} for this lead.

Lead: ${context.leadName} (${context.leadType || 'buyer/seller'})
Temperature: ${context.temperature}
Lead read: ${insight.lead_read}
Tone: ${insight.recommended_tone}
Angle: ${insight.email_angle}
Talking points: ${insight.talking_points.join('; ')}
Agent name: ${mergeContext.agentName}
Area: ${context.area || 'unspecified'}

Template subject (adapt, keep merge tags like {{first_name}}): ${subjectTemplate}
Template body (adapt): ${bodyTemplate}

Return JSON: { "subject": "...", "body": "plain text with \\n\\n between paragraphs" }`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return fallbackEmail(context, insight, mergeContext, subjectTemplate, bodyTemplate);
    }
    const parsed = JSON.parse(raw) as { subject?: string; body?: string };
    const subject = applyMergeTags(parsed.subject || subjectTemplate, mergeContext);
    const body = applyMergeTags(parsed.body || bodyTemplate, mergeContext);
    return { subject, body };
  } catch (err) {
    console.error('[AI] generatePersonalizedSequenceEmail failed:', err);
    return fallbackEmail(context, insight, mergeContext, subjectTemplate, bodyTemplate);
  }
}

export async function upsertLeadAiInsights(
  supabase: { from: (table: string) => any },
  agentId: string,
  clientId: string,
  insight: LeadAiInsight,
): Promise<void> {
  await supabase.from('lead_ai_insights').upsert(
    {
      client_id: clientId,
      agent_user_id: agentId,
      lead_read: insight.lead_read,
      recommended_tone: insight.recommended_tone,
      talking_points: insight.talking_points,
      email_angle: insight.email_angle,
      stale: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id' },
  );
}

export function markLeadInsightsStale(
  supabase: { from: (table: string) => any },
  clientId: string,
): Promise<unknown> {
  return supabase
    .from('lead_ai_insights')
    .update({ stale: true, updated_at: new Date().toISOString() })
    .eq('client_id', clientId);
}

export type { LeadTemperature };

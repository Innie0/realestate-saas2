/**
 * Decide what, if anything, is holding an ad back — from its numbers, before any
 * AI is involved. Rewriting copy only helps when people see the ad but don't
 * click; every other problem has a different fix.
 */

/** Days and views an ad needs before its numbers mean anything. */
export const LEARNING_DAYS = 7;
export const LEARNING_IMPRESSIONS = 300;

/** Below this click-through rate, a search ad's wording is the likely problem. */
const LOW_CTR_PERCENT = 2;
/** Clicks without a single lead point at the landing page or offer. */
const CLICKS_WITHOUT_LEADS = 30;
/** Above this, leads are expensive enough to look for wasted clicks. */
const HIGH_COST_PER_LEAD_CENTS = 15000;

export type AdProblem =
  | 'learning'
  | 'not_approved'
  | 'no_views'
  | 'low_ctr'
  | 'no_leads'
  | 'high_cost'
  | 'healthy'
  | 'ended';

export interface AdDiagnosisInput {
  status: string;
  createdAt: string;
  impressions: number;
  clicks: number;
  leads: number;
  spendCents: number;
  /** Set when the ad platform rejected the ad */
  issue?: string | null;
  now?: Date;
}

export interface AdDiagnosis {
  problem: AdProblem;
  title: string;
  /** Plain explanation of what the numbers say */
  explanation: string;
  /** What the agent should do, most useful first */
  advice: string[];
  /** Whether new headlines are the right fix (the only case worth an AI rewrite) */
  suggestNewHeadlines: boolean;
  /** For ads still learning: when to look again (YYYY-MM-DD) */
  checkBackOn?: string;
  stats: { days: number; impressions: number; clicks: number; leads: number; ctr: number };
}

function formatMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

export function diagnoseAd(input: AdDiagnosisInput): AdDiagnosis {
  const now = input.now ?? new Date();
  const started = Date.parse(input.createdAt);
  const days = Number.isFinite(started) ? Math.max(0, Math.floor((now.getTime() - started) / 86_400_000)) : 0;
  const ctr = input.impressions > 0 ? Math.round((input.clicks / input.impressions) * 1000) / 10 : 0;
  const stats = { days, impressions: input.impressions, clicks: input.clicks, leads: input.leads, ctr };
  const base = { stats, suggestNewHeadlines: false };

  if (input.issue) {
    return {
      ...base,
      problem: 'not_approved',
      title: 'Google didn’t approve this ad',
      explanation: input.issue,
      advice: [
        'Change the wording that was flagged and publish a new ad — a rejected ad can’t show to anyone.',
        'The wording check in the ad builder catches most common problems before you publish.',
      ],
    };
  }

  const learning = days < LEARNING_DAYS || input.impressions < LEARNING_IMPRESSIONS;

  if (learning && days < LEARNING_DAYS) {
    const checkBack = new Date((Number.isFinite(started) ? started : now.getTime()) + LEARNING_DAYS * 86_400_000);
    return {
      ...base,
      problem: 'learning',
      title: 'Too early to judge — your ad is still learning',
      explanation: `It has run ${days} day${days === 1 ? '' : 's'} with ${input.impressions.toLocaleString('en-US')} views so far. New ads need about a week and a few hundred views before the numbers show what’s working.`,
      advice: [
        'Leave it running — changing it now resets what Google has learned.',
        'Reply to any lead within 5 minutes; that matters more than any change to the ad.',
      ],
      checkBackOn: checkBack.toISOString().slice(0, 10),
    };
  }

  if (input.status === 'ended') {
    return {
      ...base,
      problem: 'ended',
      title: 'This ad has ended',
      explanation: `Over ${days} days it was seen ${input.impressions.toLocaleString('en-US')} times, clicked ${input.clicks} times, and brought ${input.leads} lead${input.leads === 1 ? '' : 's'}.`,
      advice: ['If it brought leads at a cost you’re happy with, run a similar ad again.'],
    };
  }

  // A week in and still barely seen: it isn't reaching people at all
  if (input.impressions < LEARNING_IMPRESSIONS) {
    return {
      ...base,
      problem: 'no_views',
      title: 'Few people are seeing this ad',
      explanation: `After ${days} days it has only ${input.impressions.toLocaleString('en-US')} views. That usually means the area is too small, the budget is too low, or few people search for these terms.`,
      advice: [
        'Start a new ad with a wider area (“Whole city” instead of “Near the home”) or a higher daily budget.',
        'For listing ads, “What’s your home worth?” and “Meet the agent” usually reach far more people on Google.',
      ],
    };
  }

  if (ctr < LOW_CTR_PERCENT) {
    return {
      ...base,
      problem: 'low_ctr',
      title: 'People see it, but few click',
      explanation: `${input.impressions.toLocaleString('en-US')} views but only ${input.clicks} clicks (${ctr}%). Strong real estate search ads usually get 3–6%. The wording isn’t grabbing attention.`,
      advice: [
        'Add a few sharper headlines — Google mixes them in and keeps the ones that work.',
        'Lead with what the searcher wants: the price, the area, or a free report.',
      ],
      suggestNewHeadlines: true,
    };
  }

  if (input.clicks >= CLICKS_WITHOUT_LEADS && input.leads === 0) {
    return {
      ...base,
      problem: 'no_leads',
      title: 'People click, but nobody gets in touch',
      explanation: `${input.clicks} people clicked but none left their details. The ad is working; the page they land on, or the offer, isn’t.`,
      advice: [
        'Start a new ad that sends clicks to your contact form, so the page shows the home and asks for details.',
        'Make the offer clearer — a free home value report or a private showing gives people a reason to reply.',
      ],
    };
  }

  const costPerLead = input.leads > 0 ? input.spendCents / input.leads : null;
  if (costPerLead !== null && costPerLead > HIGH_COST_PER_LEAD_CENTS) {
    return {
      ...base,
      problem: 'high_cost',
      title: 'Leads are coming in, but they’re expensive',
      explanation: `Each lead is costing about ${formatMoney(costPerLead)}. That can still pay off if one becomes a client, but there’s likely wasted spend.`,
      advice: [
        'Try “Whole city” rather than a wide region so clicks come from nearby buyers and sellers.',
        'Home value and agent ads usually bring cheaper leads than listing ads.',
      ],
    };
  }

  return {
    ...base,
    problem: 'healthy',
    title: 'This ad is doing well',
    explanation:
      input.leads > 0
        ? `${input.leads} lead${input.leads === 1 ? '' : 's'} from ${input.clicks} clicks${costPerLead !== null ? `, about ${formatMoney(costPerLead)} each` : ''}. No changes needed.`
        : `${input.clicks} clicks at ${ctr}% — a healthy rate. Give it time to turn into leads.`,
    advice: ['Keep it running. Changing a working ad can make it worse while Google relearns.'],
  };
}

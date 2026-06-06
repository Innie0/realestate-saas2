import { SupabaseClient } from '@supabase/supabase-js';
import { getPaidPlanName, hasAppAccess, PRO_PRICE_ID, STARTER_PRICE_ID } from '@/lib/subscription';

type Feature = 'projects' | 'property_lookups' | 'ai_messages' | 'clients' | 'transactions' | 'calendar_events' | 'market_analyses';
export type PlanName = 'starter' | 'pro';

interface PlanLimits {
  projects: number;
  property_lookups: number;
  ai_messages: number;
  clients: number;
  transactions: number;
  calendar_events: number;
  market_analyses: number;
}

const STARTER_LIMITS: PlanLimits = {
  projects: 10,
  property_lookups: 10,
  ai_messages: 50,
  clients: 25,
  transactions: 10,
  calendar_events: Infinity,
  market_analyses: 5,
};

const PRO_LIMITS: PlanLimits = {
  projects: Infinity,
  property_lookups: Infinity,
  ai_messages: Infinity,
  clients: Infinity,
  transactions: Infinity,
  calendar_events: Infinity,
  market_analyses: Infinity,
};

const MONTHLY_FEATURES: Feature[] = ['projects', 'property_lookups', 'ai_messages', 'market_analyses'];
const TOTAL_FEATURES: Feature[] = ['clients', 'transactions', 'calendar_events'];

export function getPlanName(
  subscriptionPlan: string | null,
  subscriptionStatus?: string | null
): PlanName | null {
  if (!hasAppAccess(subscriptionStatus)) {
    return null;
  }
  return getPaidPlanName(subscriptionPlan);
}

function getLimits(plan: PlanName): PlanLimits {
  return plan === 'pro' ? PRO_LIMITS : STARTER_LIMITS;
}

function getPeriod(feature: Feature): string {
  if (TOTAL_FEATURES.includes(feature)) return 'total';
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  feature: Feature
): Promise<{ allowed: boolean; current: number; limit: number; plan: PlanName | null }> {
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = getPlanName(userData?.subscription_plan, userData?.subscription_status);

  if (!plan) {
    return { allowed: false, current: 0, limit: 0, plan: null };
  }

  const limits = getLimits(plan);
  const limit = limits[feature];

  if (limit === Infinity) return { allowed: true, current: 0, limit: -1, plan };

  const period = getPeriod(feature);

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', period)
    .single();

  const current = usage?.usage_count || 0;
  return { allowed: current < limit, current, limit, plan };
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: Feature
): Promise<void> {
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = getPlanName(userData?.subscription_plan, userData?.subscription_status);
  if (!plan) return;

  const period = getPeriod(feature);

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('id, usage_count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', period)
    .single();

  if (existing) {
    await supabase
      .from('usage_tracking')
      .update({ usage_count: existing.usage_count + 1 })
      .eq('id', existing.id);
  } else {
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      feature,
      period,
      usage_count: 1,
    });
  }
}

export async function getAllUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<Feature, { current: number; limit: number }>> {
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = getPlanName(userData?.subscription_plan, userData?.subscription_status);
  const limits = plan ? getLimits(plan) : STARTER_LIMITS;

  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  const { data: usageRows } = await supabase
    .from('usage_tracking')
    .select('feature, period, usage_count')
    .eq('user_id', userId)
    .in('period', [currentMonth, 'total']);

  const features: Feature[] = [...MONTHLY_FEATURES, ...TOTAL_FEATURES];
  const result = {} as Record<Feature, { current: number; limit: number }>;

  for (const feature of features) {
    const period = getPeriod(feature);
    const row = usageRows?.find((r) => r.feature === feature && r.period === period);
    const limit = plan ? limits[feature] : 0;
    result[feature] = {
      current: row?.usage_count || 0,
      limit: limit === Infinity ? -1 : limit,
    };
  }

  return result;
}

export function usageLimitError(
  feature: string,
  current: number,
  limit: number,
  plan: PlanName | null = 'starter'
) {
  const featureNames: Record<string, string> = {
    projects: 'projects',
    property_lookups: 'property lookups',
    ai_messages: 'AI messages',
    clients: 'clients',
    transactions: 'transactions',
    calendar_events: 'calendar events',
    market_analyses: 'market analyses',
  };
  const name = featureNames[feature] || feature;

  if (!plan) {
    return 'A subscription is required to use this feature. Choose a plan to continue.';
  }
  if (plan === 'starter') {
    return `You've reached your Starter plan limit of ${limit} ${name}. Upgrade to Pro for unlimited access.`;
  }
  return `You've reached your limit of ${limit} ${name}.`;
}

export { STARTER_PRICE_ID, PRO_PRICE_ID };

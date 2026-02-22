import { SupabaseClient } from '@supabase/supabase-js';

const STARTER_PRICE_ID = 'price_1Sw9B7Enz9g2d62xiHw3wYn5';
const PRO_PRICE_ID = 'price_1Sw9MdEnz9g2d62xlyjilIoq';

type Feature = 'projects' | 'property_lookups' | 'ai_messages' | 'clients' | 'transactions' | 'calendar_events';

interface PlanLimits {
  projects: number;
  property_lookups: number;
  ai_messages: number;
  clients: number;
  transactions: number;
  calendar_events: number;
}

const STARTER_LIMITS: PlanLimits = {
  projects: 10,
  property_lookups: 10,
  ai_messages: 50,
  clients: 25,
  transactions: 10,
  calendar_events: 50,
};

const PRO_LIMITS: PlanLimits = {
  projects: Infinity,
  property_lookups: Infinity,
  ai_messages: Infinity,
  clients: Infinity,
  transactions: Infinity,
  calendar_events: Infinity,
};

const MONTHLY_FEATURES: Feature[] = ['projects', 'property_lookups', 'ai_messages'];
const TOTAL_FEATURES: Feature[] = ['clients', 'transactions', 'calendar_events'];

function getLimits(subscriptionPlan: string | null): PlanLimits {
  if (subscriptionPlan === PRO_PRICE_ID) return PRO_LIMITS;
  return STARTER_LIMITS;
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
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const limits = getLimits(userData?.subscription_plan);
  const limit = limits[feature];

  if (limit === Infinity) return { allowed: true, current: 0, limit: -1 };

  const period = getPeriod(feature);

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', period)
    .single();

  const current = usage?.usage_count || 0;
  return { allowed: current < limit, current, limit };
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: Feature
): Promise<void> {
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
    await supabase
      .from('usage_tracking')
      .insert({
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
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const limits = getLimits(userData?.subscription_plan);
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
    const period = TOTAL_FEATURES.includes(feature) ? 'total' : currentMonth;
    const row = usageRows?.find(r => r.feature === feature && r.period === period);
    const limit = limits[feature];
    result[feature] = {
      current: row?.usage_count || 0,
      limit: limit === Infinity ? -1 : limit,
    };
  }

  return result;
}

export function usageLimitError(feature: string, current: number, limit: number) {
  const featureNames: Record<string, string> = {
    projects: 'projects',
    property_lookups: 'property lookups',
    ai_messages: 'AI messages',
    clients: 'clients',
    transactions: 'transactions',
    calendar_events: 'calendar events',
  };
  const name = featureNames[feature] || feature;
  return `You've reached your Starter plan limit of ${limit} ${name}. Upgrade to Pro for unlimited access.`;
}

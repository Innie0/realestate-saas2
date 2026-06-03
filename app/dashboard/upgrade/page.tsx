'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, ArrowLeft, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import SubscribeButton from '@/components/SubscribeButton';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const STARTER_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1Sw9B7Enz9g2d62xiHw3wYn5';
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq';

const STARTER_LIMITS: Record<string, number> = {
  projects: 10,
  property_lookups: 10,
  ai_messages: 50,
  clients: 25,
  transactions: 10,
  calendar_events: -1,
};

const COMPARISON_ROWS = [
  { label: 'Projects',         starter: '10 / mo',  pro: 'Unlimited' },
  { label: 'Property Lookups', starter: '10 / mo',  pro: 'Unlimited' },
  { label: 'AI Messages',      starter: '50 / mo',  pro: 'Unlimited' },
  { label: 'Clients',          starter: '25 total', pro: 'Unlimited' },
  { label: 'Transactions',     starter: '10 total', pro: 'Unlimited' },
  { label: 'Calendar Events',  starter: 'Unlimited', pro: 'Unlimited' },
  { label: 'Priority Support', starter: false,      pro: true },
];

const PRO_HIGHLIGHTS = [
  'Unlimited Property Listings & Lookups',
  'Unlimited AI Assistant Messages',
  'Unlimited Clients & Transactions',
  'Unlimited Calendar Events',
  'AI-Powered Descriptions (3 Tones)',
  'Advanced Image Analysis',
  'Google Calendar Integration',
  'Transaction Checklists & Reminders',
  'Priority Support',
];

type PlanType = 'starter' | 'pro';

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="w-4 h-4 text-green-400 mx-auto" />
      : <span className="text-gray-600 text-sm">—</span>;
  }
  return (
    <span className="text-sm text-gray-300 flex items-center justify-center gap-1">
      {value === 'Unlimited' && <InfinityIcon className="w-3.5 h-3.5 text-white/60" />}
      {value !== 'Unlimited' && value}
    </span>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('starter');
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number }> | null>(null);

  useEffect(() => {
    document.title = 'Upgrade Plan - Realestic';
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('subscription_plan, subscription_status')
        .eq('id', user.id)
        .single();

      const hasAccess =
        userData?.subscription_status === 'active' ||
        userData?.subscription_status === 'trialing';

      if (!hasAccess) {
        router.push('/pricing');
        return;
      }

      let plan: PlanType = 'starter';
      if (userData?.subscription_plan === PRO_PRICE_ID) {
        plan = 'pro';
      }
      setCurrentPlan(plan);

      if (plan === 'starter') {
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const { data: usageRows } = await supabase
          .from('usage_tracking')
          .select('feature, usage_count, period')
          .eq('user_id', user.id);

        if (usageRows) {
          const map: Record<string, { current: number; limit: number }> = {};
          for (const [feature, limit] of Object.entries(STARTER_LIMITS)) {
            const isTotal = ['clients', 'transactions'].includes(feature);
            const row = usageRows.find(r =>
              r.feature === feature && r.period === (isTotal ? 'total' : period)
            );
            map[feature] = { current: row?.usage_count || 0, limit };
          }
          setUsage(map);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  if (currentPlan === 'pro') {
    return (
      <div>
        <Header title="Upgrade Plan" subtitle="Manage your subscription" />
        <div className="p-6 max-w-2xl mx-auto text-center mt-16">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white/60" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re on Pro</h2>
          <p className="text-gray-400 mb-6">You already have full access to everything Realestic offers.</p>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = 'Upgrade to Pro';
  const pageSubtitle = 'Unlock unlimited access to every feature';

  return (
    <div className="min-h-screen">
      <Header title={pageTitle} subtitle={pageSubtitle} />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">

        {/* Current usage summary */}
        {usage && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-white/60" />
              <span className="text-sm font-semibold text-white capitalize">
                Your Current Usage (Starter Plan)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: 'projects', label: 'Projects' },
                { key: 'property_lookups', label: 'Lookups' },
                { key: 'ai_messages', label: 'AI Messages' },
                { key: 'clients', label: 'Clients' },
                { key: 'transactions', label: 'Transactions' },
                { key: 'calendar_events', label: 'Events' },
              ].map(({ key, label }) => {
                const item = usage[key];
                const isUnlimited = item?.limit === -1;
                const pct = isUnlimited ? 0 : item ? Math.min((item.current / item.limit) * 100, 100) : 0;
                const nearLimit = !isUnlimited && pct >= 80;
                return (
                  <div key={key} className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-lg font-bold ${nearLimit ? 'text-red-400' : 'text-white'}`}>
                      {isUnlimited ? '∞' : item?.current ?? 0}
                      {!isUnlimited && (
                        <span className="text-xs font-normal text-gray-500">/{item?.limit ?? '—'}</span>
                      )}
                    </p>
                    {!isUnlimited && (
                      <div className="mt-1.5 h-1 rounded-full bg-white/10">
                        <div
                          className={`h-1 rounded-full transition-all ${nearLimit ? 'bg-red-500' : 'bg-white/50'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upgrade cards */}
        <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">

          {/* Pro card */}
          <div className="rounded-2xl border-2 border-white/30 bg-[#111111] p-6 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white text-black text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </span>
            </div>
            <div className="mb-5 mt-2">
              <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
              <p className="text-gray-500 text-sm">Everything you need to scale your real estate business</p>
            </div>
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$39.99</span>
                <span className="text-gray-500 text-sm">/ month</span>
              </div>
            </div>
            <div className="mb-6">
              <SubscribeButton priceId={PRO_PRICE_ID} planName="Pro" className="w-full" />
            </div>
            <div className="border-t border-white/10 mb-5" />
            <ul className="space-y-2.5 flex-1">
              {PRO_HIGHLIGHTS.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 overflow-x-auto">
          <h3 className="text-lg font-bold text-white mb-5">Plan Comparison</h3>
          <div className="min-w-[480px]">
            {/* Header */}
            <div className="grid grid-cols-3 mb-3">
              <div />
              <div className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Starter</div>
              <div className="text-center text-xs font-semibold text-white uppercase tracking-wider">Pro</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 py-3 ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <span className="text-sm text-gray-400">{row.label}</span>
                <div className="text-center"><ComparisonCell value={row.starter} /></div>
                <div className="text-center"><ComparisonCell value={row.pro} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center pb-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}

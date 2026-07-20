'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, ArrowLeft, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import DashboardPage from '@/components/layout/DashboardPage';
import PageLoadingSkeleton from '@/components/dashboard/PageLoadingSkeleton';
import UpgradeButton from '@/components/UpgradeButton';
import SetupStarterButton from '@/components/SetupStarterButton';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import PricingFeatureList from '@/components/PricingFeatureList';
import { hasAppAccess, isAdminEmail } from '@/lib/subscription';
import {
  PRO_MONTHLY_PRICE_ID,
  PLAN_COMPARISON_ROWS,
  getPlanDisplayPrice,
  isAnyAnnualBillingAvailable,
  isProPriceId,
  isStarterPriceId,
} from '@/lib/pricing';

const STARTER_LIMITS: Record<string, number> = {
  projects: 20,
  property_lookups: 20,
  ai_messages: 75,
  clients: 50,
  transactions: 20,
  calendar_events: -1,
  market_analyses: 5,
};

const COMPARISON_ROWS = PLAN_COMPARISON_ROWS;

type PlanType = 'starter' | 'pro';

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="w-4 h-4 text-green-400 mx-auto" />
      : <X className="w-4 h-4 text-red-400 mx-auto" />;
  }
  return (
    <span className="text-sm text-gray-600 flex items-center justify-center gap-1">
      {value === 'Unlimited' && <InfinityIcon className="w-3.5 h-3.5 text-gray-900/60" />}
      {value !== 'Unlimited' && value}
    </span>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('starter');
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number }> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasStripeStarter, setHasStripeStarter] = useState(false);
  const [starterReady, setStarterReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('starter=ready')) {
      setStarterReady(true);
      window.history.replaceState({}, '', '/dashboard/upgrade');
    }
  }, []);

  useEffect(() => {
    document.title = 'Upgrade Plan - Oikaro';
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('subscription_plan, subscription_status, stripe_subscription_id')
        .eq('id', user.id)
        .single();

      const admin = isAdminEmail(user.email);
      setIsAdmin(admin);

      if (!hasAppAccess(userData?.subscription_status, user.email)) {
        router.push('/pricing');
        return;
      }

      const stripeStarter =
        !!userData?.stripe_subscription_id &&
        isStarterPriceId(userData?.subscription_plan) &&
        (userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing');
      setHasStripeStarter(stripeStarter);

      const plan: PlanType = isProPriceId(userData?.subscription_plan) ? 'pro' : 'starter';
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
            const isTotal = feature === 'clients';
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
    return <PageLoadingSkeleton variant="account" />;
  }

  if (currentPlan === 'pro') {
    return (
      <DashboardPage title="Your plan" subtitle="Manage your subscription" size="medium">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-900/60" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re on Pro</h2>
          <p className="text-gray-700 mb-6">You already have full access to everything Oikaro offers.</p>
          <Link href="/dashboard" className="text-sm text-gray-700 hover:text-brand-600 transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Upgrade to Pro" subtitle="Unlock unlimited access to every feature" size="medium">
        {starterReady && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-gray-700">
            Starter is connected in Stripe. Click <strong>Upgrade to Pro</strong> below to test the prorated upgrade.
          </div>
        )}

        {isAdmin && !hasStripeStarter && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Admin: test the upgrade flow</p>
            <p className="text-sm text-gray-600 mb-4">
              Your admin account skips normal billing. Connect a real Starter subscription in Stripe first,
              then upgrade to Pro to test what customers experience.
            </p>
            <SetupStarterButton />
          </div>
        )}

        {usage && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-gray-900/60" />
              <span className="text-sm font-semibold text-gray-900 capitalize">
                Your Current Usage (Starter Plan)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { key: 'projects', label: 'Projects' },
                { key: 'property_lookups', label: 'Lookups' },
                { key: 'market_analyses', label: 'CMA' },
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
                  <div key={key} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-700 mb-1">{label}</p>
                    <p className={`text-lg font-bold ${nearLimit ? 'text-red-400' : 'text-gray-900'}`}>
                      {isUnlimited ? '∞' : item?.current ?? 0}
                      {!isUnlimited && (
                        <span className="text-xs font-normal text-gray-700">/{item?.limit ?? '—'}</span>
                      )}
                    </p>
                    {!isUnlimited && (
                      <div className="mt-1.5 h-1 rounded-full bg-gray-100">
                        <div
                          className={`h-1 rounded-full transition-all ${nearLimit ? 'bg-red-500' : 'bg-gray-500'}`}
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

        <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
          <div className="rounded-2xl border-2 border-gray-400 bg-[var(--surface)] p-6 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </span>
            </div>
            <div className="mb-5 mt-2">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
              <p className="text-gray-700 text-sm">Everything you need to scale your real estate business</p>
            </div>
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">{getPlanDisplayPrice('pro', 'monthly')}</span>
                <span className="text-gray-700 text-sm">/ month</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                {isAnyAnnualBillingAvailable()
                  ? `or ${getPlanDisplayPrice('pro', 'annual')}/year on annual billing`
                  : 'Billed monthly after trial'}
              </p>
            </div>
            <div className="mb-6">
              <UpgradeButton
                priceId={PRO_MONTHLY_PRICE_ID}
                className="w-full"
                disabled={isAdmin && !hasStripeStarter}
              />
            </div>
            <div className="border-t border-gray-200 mb-5" />
            <PricingFeatureList plan="pro" icon="check" className="space-y-2.5 flex-1" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 overflow-x-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Plan Comparison</h3>
          <div className="min-w-[480px]">
            <div className="grid grid-cols-3 mb-3">
              <div />
              <div className="text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Starter</div>
              <div className="text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">Pro</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 py-3 ${i < COMPARISON_ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-sm text-gray-700">{row.label}</span>
                <div className="text-center"><ComparisonCell value={row.starter} /></div>
                <div className="text-center"><ComparisonCell value={row.pro} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pb-4">
          <Link href="/dashboard" className="text-sm text-gray-700 hover:text-brand-600 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
    </DashboardPage>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, ArrowLeft, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import SubscribeButton from '@/components/SubscribeButton';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq';

const CURRENT_PLAN_FEATURES = [
  { label: 'Projects', starter: '10 / mo', pro: 'Unlimited' },
  { label: 'Property Lookups', starter: '10 / mo', pro: 'Unlimited' },
  { label: 'AI Messages', starter: '50 / mo', pro: 'Unlimited' },
  { label: 'Clients', starter: '25', pro: 'Unlimited' },
  { label: 'Transactions', starter: '10', pro: 'Unlimited' },
  { label: 'Calendar Events', starter: '50', pro: 'Unlimited' },
  { label: 'Priority Support', starter: false, pro: true },
  { label: 'Custom Branding', starter: false, pro: true },
  { label: 'Advanced Analytics', starter: false, pro: true },
];

const PRO_HIGHLIGHTS = [
  'Unlimited Property Listings & Lookups',
  'Unlimited AI Assistant Messages',
  'Unlimited Clients & Transactions',
  'Unlimited Calendar Events',
  'AI-Powered Descriptions with Multiple Tones',
  'Advanced Image Analysis',
  'Calendar Integration (Google + Outlook)',
  'Transaction Checklists & Reminders',
  'Priority Support',
  'Custom Branding & Advanced Analytics',
];

export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<'starter' | 'pro' | 'none'>('none');
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number }> | null>(null);

  useEffect(() => {
    document.title = 'Upgrade Plan - Realestic';
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/signin'); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('subscription_plan, subscription_status')
        .eq('id', user.id)
        .single();

      const PRO_ID = 'price_1Sw9MdEnz9g2d62xlyjilIoq';
      if (userData?.subscription_plan === PRO_ID) {
        setCurrentPlan('pro');
      } else if (userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing') {
        setCurrentPlan('starter');
      } else {
        setCurrentPlan('none');
      }

      // Load usage
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const { data: usageRows } = await supabase
        .from('usage_tracking')
        .select('feature, usage_count, period')
        .eq('user_id', user.id);

      if (usageRows) {
        const map: Record<string, { current: number; limit: number }> = {};
        const limits: Record<string, number> = {
          projects: 10, property_lookups: 10, ai_messages: 50,
          clients: 25, transactions: 10, calendar_events: 50,
        };
        for (const [feature, limit] of Object.entries(limits)) {
          const isMonthly = ['projects', 'property_lookups', 'ai_messages'].includes(feature);
          const row = usageRows.find(r =>
            r.feature === feature && r.period === (isMonthly ? period : 'total')
          );
          map[feature] = { current: row?.usage_count || 0, limit };
        }
        setUsage(map);
      }

      setIsLoading(false);
    };

    loadData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (currentPlan === 'pro') {
    return (
      <div>
        <Header title="Upgrade Plan" subtitle="Manage your subscription" />
        <div className="p-6 max-w-2xl mx-auto text-center mt-16">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're on Pro</h2>
          <p className="text-gray-400 mb-6">You already have full access to everything Realestic offers.</p>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Upgrade to Pro" subtitle="Unlock unlimited access to every feature" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">

        {/* Current plan usage summary */}
        {usage && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Your Current Usage (Starter)</span>
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
                const pct = item ? Math.min((item.current / item.limit) * 100, 100) : 0;
                const nearLimit = pct >= 80;
                return (
                  <div key={key} className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-lg font-bold ${nearLimit ? 'text-red-400' : 'text-white'}`}>
                      {item?.current ?? 0}
                      <span className="text-xs font-normal text-gray-500">/{item?.limit ?? '—'}</span>
                    </p>
                    <div className="mt-1.5 h-1 rounded-full bg-white/10">
                      <div
                        className={`h-1 rounded-full transition-all ${nearLimit ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main upgrade card + comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pro plan card */}
          <div className="relative rounded-2xl border-2 border-purple-500 bg-gradient-to-br from-purple-900/20 to-gray-900/50 p-6 shadow-2xl shadow-purple-500/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Most Popular
              </div>
            </div>

            <div className="text-center mb-6 mt-2">
              <h3 className="text-2xl font-bold text-white mb-1">Pro Plan</h3>
              <p className="text-gray-400 text-sm mb-4">Everything you need to scale your business</p>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-5xl font-bold text-white">$39.99</span>
                <span className="text-gray-400 text-sm">/ month</span>
              </div>
              <p className="text-xs text-green-400 font-medium">7-day free trial included</p>
            </div>

            <div className="mb-6">
              <SubscribeButton
                priceId={PRO_PRICE_ID}
                planName="Pro"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              {PRO_HIGHLIGHTS.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-bold text-white mb-5">Starter vs Pro</h3>
            <div className="space-y-0">
              {/* Header row */}
              <div className="grid grid-cols-3 mb-3">
                <div />
                <div className="text-center text-xs font-semibold text-gray-500 uppercase">Starter</div>
                <div className="text-center text-xs font-semibold text-purple-400 uppercase">Pro</div>
              </div>
              {CURRENT_PLAN_FEATURES.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 py-3 ${i < CURRENT_PLAN_FEATURES.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <span className="text-sm text-gray-400">{row.label}</span>
                  <div className="text-center">
                    {typeof row.starter === 'boolean' ? (
                      row.starter
                        ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                        : <span className="text-gray-600 text-sm">—</span>
                    ) : (
                      <span className="text-sm text-gray-400">{row.starter}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof row.pro === 'boolean' ? (
                      row.pro
                        ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                        : <span className="text-gray-600 text-sm">—</span>
                    ) : (
                      <span className="text-sm text-purple-300 font-semibold flex items-center justify-center gap-1">
                        {row.pro === 'Unlimited' && <InfinityIcon className="w-3.5 h-3.5" />}
                        {row.pro}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

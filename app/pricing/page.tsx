'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import SubscribeButton from '@/components/SubscribeButton';
import PricingFeatureList from '@/components/PricingFeatureList';
import { supabase } from '@/lib/supabase';
import {
  type BillingInterval,
  type PlanSlug,
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  getAnnualSavings,
  getPlanDisplayPrice,
  getPlanPeriodLabel,
  getPricingFootnote,
  getStripePriceId,
  isAnyAnnualBillingAvailable,
} from '@/lib/pricing';

const PLANS: { slug: PlanSlug; name: string; description: string; popular: boolean }[] = [
  {
    slug: 'starter',
    name: 'Starter',
    description: STARTER_PLAN_DESCRIPTION,
    popular: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: PRO_PLAN_DESCRIPTION,
    popular: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const showAnnual = isAnyAnnualBillingAvailable();

  useEffect(() => {
    document.title = 'Pricing - Realestic';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');

        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();

        const hasActiveSubscription =
          userData?.subscription_status === 'active' ||
          userData?.subscription_status === 'trialing';

        if (hasActiveSubscription) {
          router.push('/dashboard');
          return;
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gray-50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Realestic" width={160} height={48} priority className="h-10 w-auto" />
        </Link>
        {!isLoading && (
          <div className="text-sm">
            {isAuthenticated ? (
              <span className="text-gray-500 truncate max-w-[220px] block">✓ {userEmail}</span>
            ) : (
              <Link href="/auth/signup" className="text-gray-500 hover:text-brand-600 transition-colors">
                Sign in to subscribe →
              </Link>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
          <div className="text-center pt-12 pb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              7-day free trial on every plan
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Choose your plan
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Start your free trial today. You won&apos;t be charged until the trial ends.
            </p>

            {showAnnual && (
              <div className="inline-flex items-center gap-1 p-1 mt-8 bg-gray-100 border border-gray-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('annual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === 'annual'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Annual
                  <span className="ml-1.5 text-xs text-brand-600 font-semibold">Save 2 months</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.popular
                    ? 'bg-white border-2 border-gray-400'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {getPlanDisplayPrice(plan.slug, billingInterval)}
                    </span>
                    <span className="text-gray-500 text-sm">{getPlanPeriodLabel(billingInterval)}</span>
                  </div>
                  {billingInterval === 'annual' && (
                    <p className="text-xs text-brand-600 font-medium mt-2">
                      Save ${getAnnualSavings(plan.slug)}/year vs paying monthly
                    </p>
                  )}
                  {billingInterval === 'monthly' && showAnnual && (
                    <p className="text-xs text-gray-500 mt-2">
                      or {getPlanDisplayPrice(plan.slug, 'annual')}/year (2 months free)
                    </p>
                  )}
                </div>

                <div className="mb-7">
                  <SubscribeButton
                    priceId={getStripePriceId(plan.slug, billingInterval)}
                    planName={plan.name}
                    planSlug={plan.slug}
                    className="w-full"
                  />
                </div>

                <div className="border-t border-gray-200 mb-5" />

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">What&apos;s included</p>
                <PricingFeatureList plan={plan.slug} icon="check" />
              </div>
            ))}
          </div>

          {!isAuthenticated && (
            <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-2xl text-center">
              <p className="text-gray-500 text-sm mb-4">You need an account to subscribe</p>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-6 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Create your account
              </button>
            </div>
          )}

          <p className="text-center text-gray-600 text-sm mt-10">
            {getPricingFootnote()}
          </p>
        </div>
      )}
    </div>
  );
}

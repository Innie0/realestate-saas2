'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import SubscribeButton from '@/components/SubscribeButton';
import PricingFeatureList from '@/components/PricingFeatureList';
import PricingComparisonTable from '@/components/PricingComparisonTable';
import { supabase } from '@/lib/supabase';
import { hasRealStripeSubscription, isAdminEmail } from '@/lib/subscription';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';
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
  const reduced = useMotionReduced();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const showAnnual = isAnyAnnualBillingAvailable();

  useEffect(() => {
    document.title = 'Pricing - Oikaro';
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');

        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status, stripe_subscription_id')
          .eq('id', session.user.id)
          .single();

        const hasPaidSubscription = hasRealStripeSubscription(
          userData?.subscription_status,
          userData?.stripe_subscription_id,
        );

        if (!isAdminEmail(session.user.email) && hasPaidSubscription) {
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
    <div className="marketing-root min-h-screen font-sans" style={{ backgroundColor: MKT.background }}>
      <MarketingSubpageHeader />

      {isLoading && (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: MKT.textPrimary }} />
        </div>
      )}

      {!isLoading && (
        <main>
          <section className="border-b py-16 lg:py-24" style={{ borderColor: MKT.border, backgroundColor: MKT.surface }}>
            <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
              <motion.div {...mktEnterReveal(reduced)} className="mx-auto max-w-3xl text-center">
                <span
                  className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
                  style={{ borderColor: MKT.border, color: MKT.textSecondary, backgroundColor: MKT.background }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  7-day free trial on every plan
                </span>
                <h1
                  className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl lg:text-6xl"
                  style={{ color: MKT.textPrimary }}
                >
                  Choose your plan
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
                  Start your free trial today. You won&apos;t be charged until the trial ends.
                </p>

                {!isAuthenticated ? (
                  <p className="mt-6 text-sm" style={{ color: MKT.textSecondary }}>
                    <Link href="/auth/signup" className="font-medium underline-offset-2 hover:underline" style={{ color: MKT.textPrimary }}>
                      Sign in to subscribe
                    </Link>
                  </p>
                ) : (
                  <p className="mt-6 truncate text-sm" style={{ color: MKT.textSecondary }}>
                    Signed in as {userEmail}
                  </p>
                )}

                {showAnnual && (
                  <div
                    className="mt-8 inline-flex items-center gap-1 p-1"
                    style={{ borderRadius: MKT.radius.card, border: `1px solid ${MKT.border}`, backgroundColor: MKT.background }}
                  >
                    <button
                      type="button"
                      onClick={() => setBillingInterval('monthly')}
                      className="px-4 py-2 text-sm font-medium transition-colors"
                      style={
                        billingInterval === 'monthly'
                          ? { borderRadius: MKT.radius.button, backgroundColor: MKT.background, color: MKT.textPrimary }
                          : { color: MKT.textSecondary }
                      }
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingInterval('annual')}
                      className="px-4 py-2 text-sm font-medium transition-colors"
                      style={
                        billingInterval === 'annual'
                          ? { borderRadius: MKT.radius.button, backgroundColor: MKT.background, color: MKT.textPrimary }
                          : { color: MKT.textSecondary }
                      }
                    >
                      Annual
                      <span className="ml-1.5 text-xs font-medium" style={{ color: MKT.textPrimary }}>
                        Save 2 months
                      </span>
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          <section className="py-16 lg:py-20" style={{ backgroundColor: MKT.background }}>
            <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
                {PLANS.map((plan, i) => (
                  <motion.div
                    key={plan.slug}
                    {...mktEnterReveal(reduced, i * 0.08)}
                    className="relative p-7"
                    style={{
                      borderRadius: MKT.radius.card,
                      backgroundColor: MKT.background,
                      border: plan.popular ? `2px solid ${MKT.accent}` : `1px solid ${MKT.border}`,
                    }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span
                          className="mkt-cta inline-flex items-center gap-1.5 px-4 py-1 text-xs font-medium"
                          style={{ borderRadius: MKT.radius.button }}
                        >
                          <Sparkles className="h-3 w-3" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-5">
                      <h3 className="text-xl font-medium" style={{ color: MKT.textPrimary }}>
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-price text-4xl" style={{ color: MKT.textPrimary }}>
                          {getPlanDisplayPrice(plan.slug, billingInterval)}
                        </span>
                        <span className="text-sm" style={{ color: MKT.textSecondary }}>
                          {getPlanPeriodLabel(billingInterval)}
                        </span>
                      </div>
                      {billingInterval === 'annual' && (
                        <p className="mt-2 text-xs font-medium" style={{ color: MKT.textSecondary }}>
                          Save ${getAnnualSavings(plan.slug)}/year vs paying monthly
                        </p>
                      )}
                      {billingInterval === 'monthly' && showAnnual && (
                        <p className="mt-2 text-xs" style={{ color: MKT.textSecondary }}>
                          or {getPlanDisplayPrice(plan.slug, 'annual')}/year (2 months free)
                        </p>
                      )}
                    </div>

                    <div className="mb-7">
                      <SubscribeButton
                        priceId={getStripePriceId(plan.slug, billingInterval)}
                        planName={plan.name}
                        planSlug={plan.slug}
                        tone="marketing"
                        variant={plan.popular ? 'primary' : 'secondary'}
                        className="w-full"
                      />
                    </div>

                    <div className="mb-5 border-t" style={{ borderColor: MKT.border }} />

                    <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                      What&apos;s included
                    </p>
                    <PricingFeatureList plan={plan.slug} icon="check" tone="marketing" />
                  </motion.div>
                ))}
              </div>

              <div id="compare" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
                <PricingComparisonTable />
              </div>

              {!isAuthenticated && (
                <div
                  className="mx-auto mt-8 max-w-3xl p-5 text-center"
                  style={{
                    borderRadius: MKT.radius.card,
                    border: `1px solid ${MKT.border}`,
                    backgroundColor: MKT.background,
                  }}
                >
                  <p className="mb-4 text-sm" style={{ color: MKT.textSecondary }}>
                    You need an account to subscribe
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/auth/signup')}
                    className="mkt-cta px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ borderRadius: MKT.radius.button }}
                  >
                    Create your account
                  </button>
                </div>
              )}

              <p className="mt-10 text-center text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
                {getPricingFootnote()}
              </p>
            </div>
          </section>
        </main>
      )}

      {!isLoading && <MarketingSubpageFooter />}
    </div>
  );
}

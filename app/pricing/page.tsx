'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
import SubscribeButton from '@/components/SubscribeButton';
import PricingFeatureList from '@/components/PricingFeatureList';
import PricingComparisonTable from '@/components/PricingComparisonTable';
import { supabase } from '@/lib/supabase';
import { hasRealStripeSubscription, isAdminEmail } from '@/lib/subscription';
import { mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';
import {
  type BillingInterval,
  type PlanSlug,
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  getAnnualSavings,
  getMonthlyEquivalent,
  getPlanDisplayPrice,
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

/** "or $41/mo billed yearly" — shown under monthly prices. */
function formatYearlyHint(plan: PlanSlug): string {
  return `or $${getMonthlyEquivalent(plan, 'annual')}/month billed yearly`;
}

export default function PricingPage() {
  const router = useRouter();
  const reduced = useMotionReduced();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const showAnnual = isAnyAnnualBillingAvailable();
  // Yearly first: the per-month price is lower, and most agents never switch
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(showAnnual ? 'annual' : 'monthly');
  // Phones: feature lists start folded so the price and button are on the first screen
  const [openFeatures, setOpenFeatures] = useState<Record<PlanSlug, boolean>>({ starter: false, pro: false });
  // Phones: a bar with the trial button appears once the Pro card's own button scrolls away
  const proButtonRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    document.title = 'Pricing - Oikaro';
  }, []);

  useEffect(() => {
    const el = proButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

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
    <div className="marketing-root min-h-screen bg-white text-mkt-foreground">
      <MarketingSubpageHeader />

      {isLoading && (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-mkt-foreground" />
        </div>
      )}

      {!isLoading && (
        <main>
          <section className="border-b border-mkt-border bg-mkt-surface py-8 sm:py-16 lg:py-24">
            <div className="mx-auto max-w-mkt-content px-5 sm:px-6 lg:px-8">
              <motion.div {...mktEnterReveal(reduced)} className="mx-auto max-w-3xl text-center">
                {isAuthenticated ? (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-medium text-[#065F46] sm:mb-6">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Account created
                  </span>
                ) : (
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-mkt-border bg-mkt-background px-3 py-1 text-xs font-medium text-mkt-secondary sm:mb-6 sm:px-4 sm:py-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    7-day free trial on every plan
                  </span>
                )}
                <h1 className="font-display text-[28px] font-medium leading-tight tracking-[-0.02em] text-mkt-foreground sm:text-5xl lg:text-6xl">
                  {isAuthenticated ? 'Last step: start your free trial' : 'Choose your plan'}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-[1.55] text-mkt-secondary sm:mt-4 sm:text-lg">
                  {isAuthenticated
                    ? 'Pick a plan to unlock everything. $0 today, nothing is charged for 7 days.'
                    : "Start your free trial today. You won't be charged until the trial ends."}
                </p>

                {!isAuthenticated && (
                  <p className="mt-3 text-sm text-mkt-secondary sm:mt-6">
                    <Link href="/auth/login" className="font-medium text-mkt-foreground underline-offset-2 hover:underline">
                      Already have an account? Sign in
                    </Link>
                  </p>
                )}

                {showAnnual && (
                  <div className="mt-5 inline-flex items-center gap-1 rounded-mkt-card border border-mkt-border bg-mkt-background p-1 sm:mt-8">
                    <button
                      type="button"
                      onClick={() => setBillingInterval('annual')}
                      className={`rounded-mkt-button px-4 py-2 text-sm font-medium transition-colors ${
                        billingInterval === 'annual' ? 'bg-[#0668E1] text-white' : 'text-mkt-secondary'
                      }`}
                    >
                      Yearly
                      <span
                        className={`ml-1.5 text-xs font-semibold ${
                          billingInterval === 'annual' ? 'text-white/90' : 'text-[#047857]'
                        }`}
                      >
                        2 months free
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingInterval('monthly')}
                      className={`rounded-mkt-button px-4 py-2 text-sm font-medium transition-colors ${
                        billingInterval === 'monthly' ? 'bg-[#0668E1] text-white' : 'text-mkt-secondary'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          <section className="bg-white pb-28 pt-8 sm:pb-16 sm:pt-16 lg:py-20">
            <div className="mx-auto max-w-mkt-content px-5 sm:px-6 lg:px-8">
              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
                {PLANS.map((plan, i) => (
                  <motion.div
                    key={plan.slug}
                    {...mktEnterReveal(reduced, i * 0.08)}
                    className={`relative rounded-mkt-card bg-mkt-background p-5 sm:p-7 ${
                      plan.popular ? 'order-first border-2 border-mkt-accent md:order-none' : 'border border-mkt-border'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1.5 rounded-mkt-button bg-[#0668E1] px-4 py-1 text-xs font-medium text-white">
                          <Sparkles className="h-3 w-3" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-4 sm:mb-5">
                      <h3 className="text-xl font-medium text-mkt-foreground">{plan.name}</h3>
                      <p className="mt-1 text-sm leading-[1.6] text-mkt-secondary">{plan.description}</p>
                    </div>

                    <div className="mb-5 sm:mb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-price text-4xl text-mkt-foreground">
                          ${getMonthlyEquivalent(plan.slug, billingInterval)}
                        </span>
                        <span className="text-sm text-mkt-secondary">/month</span>
                      </div>
                      {billingInterval === 'annual' ? (
                        <p className="mt-1.5 text-xs text-mkt-secondary">
                          Billed {getPlanDisplayPrice(plan.slug, 'annual')} yearly after your trial
                          <span className="ml-1.5 font-semibold text-[#047857]">
                            Save ${getAnnualSavings(plan.slug)}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-mkt-secondary">
                          Billed monthly after your trial
                          {showAnnual && <> · {formatYearlyHint(plan.slug)}</>}
                        </p>
                      )}
                    </div>

                    <div className="mb-5 sm:mb-7" ref={plan.slug === 'pro' ? proButtonRef : undefined}>
                      <SubscribeButton
                        priceId={getStripePriceId(plan.slug, billingInterval)}
                        planName={plan.name}
                        planSlug={plan.slug}
                        tone="marketing"
                        variant={plan.popular ? 'primary' : 'secondary'}
                        className="w-full"
                      />
                      <p className="mt-2 text-center text-xs text-mkt-secondary">
                        $0 due today · Cancel anytime before day 8
                      </p>
                    </div>

                    <div className="mb-4 border-t border-mkt-border sm:mb-5" />

                    {/* Phones: fold the feature list behind a tap so the plans stay short */}
                    <button
                      type="button"
                      onClick={() => setOpenFeatures((prev) => ({ ...prev, [plan.slug]: !prev[plan.slug] }))}
                      aria-expanded={openFeatures[plan.slug]}
                      className="flex w-full items-center justify-between text-sm font-medium text-mkt-foreground md:hidden"
                    >
                      See what&apos;s included
                      <ChevronDown
                        className={`h-4 w-4 text-mkt-secondary transition-transform ${openFeatures[plan.slug] ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div className={`${openFeatures[plan.slug] ? 'mt-4 block' : 'hidden'} md:mt-0 md:block`}>
                      <p className="mb-4 hidden text-xs font-medium uppercase tracking-[0.12em] text-mkt-secondary md:block">
                        What&apos;s included
                      </p>
                      <PricingFeatureList plan={plan.slug} icon="check" tone="marketing" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div id="compare" className="mx-auto mt-14 max-w-3xl scroll-mt-24">
                <PricingComparisonTable />
              </div>

              {!isAuthenticated && (
                <div className="mx-auto mt-8 max-w-3xl rounded-mkt-card border border-mkt-border bg-mkt-background p-5 text-center">
                  <p className="mb-4 text-sm text-mkt-secondary">You need an account to subscribe</p>
                  <button
                    type="button"
                    onClick={() => router.push('/auth/signup')}
                    className="rounded-mkt-button bg-[#0668E1] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0450b0]"
                  >
                    Create your account
                  </button>
                </div>
              )}

              <p className="mt-10 text-center text-sm leading-[1.6] text-mkt-secondary">
                {getPricingFootnote()}
              </p>
            </div>
          </section>

          {/* Phones: keep the trial button one tap away while scrolling */}
          <div
            className={`fixed inset-x-0 bottom-0 z-50 border-t border-mkt-border bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-200 md:hidden ${
              showStickyBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'
            }`}
            aria-hidden={!showStickyBar}
          >
            <div className="mb-2 flex items-baseline justify-between text-xs text-mkt-secondary">
              <span>
                <span className="font-semibold text-mkt-foreground">Pro</span> · ${getMonthlyEquivalent('pro', billingInterval)}/month
                {billingInterval === 'annual' ? ', billed yearly' : ''}
              </span>
              <span>$0 due today</span>
            </div>
            <SubscribeButton
              priceId={getStripePriceId('pro', billingInterval)}
              planName="Pro"
              planSlug="pro"
              tone="marketing"
              variant="primary"
              className="w-full"
            />
          </div>
        </main>
      )}

      {!isLoading && <MarketingSubpageFooter />}
    </div>
  );
}

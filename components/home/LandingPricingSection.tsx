'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import PricingFeatureList from '@/components/PricingFeatureList';
import {
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  getPlanDisplayPrice,
  getPricingFootnote,
  isAnyAnnualBillingAvailable,
} from '@/lib/pricing';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

const PLANS = [
  {
    name: 'Starter',
    price: getPlanDisplayPrice('starter', 'monthly'),
    description: STARTER_PLAN_DESCRIPTION,
    plan: 'starter' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: getPlanDisplayPrice('pro', 'monthly'),
    description: PRO_PLAN_DESCRIPTION,
    plan: 'pro' as const,
    popular: true,
  },
];

export default function LandingPricingSection() {
  const reduced = useMotionReduced();

  return (
    <section
      className="relative z-10 border-t py-24 lg:py-32"
      style={{ borderColor: MKT.border, backgroundColor: MKT.surface }}
    >
      <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <motion.div {...mktEnterReveal(reduced)} className="mb-16 text-center">
          <p
            className="mb-4 font-mono text-[12px] font-medium uppercase tracking-[0.14em]"
            style={{ color: MKT.textSecondary }}
          >
            Pricing
          </p>
          <h2
            className="font-sans text-3xl font-medium tracking-[-0.02em] sm:text-4xl lg:text-5xl"
            style={{ color: MKT.textPrimary }}
          >
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-[1.6]" style={{ color: MKT.textSecondary }}>
            7-day free trial on every plan. No setup fees. Cancel anytime.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              {...mktEnterReveal(reduced, i * 0.08)}
              className="relative p-7"
              style={{
                borderRadius: MKT.radius.lg,
                backgroundColor: MKT.surface,
                border: plan.popular ? `2px solid ${MKT.textPrimary}` : `1px solid ${MKT.border}`,
                boxShadow: MKT.shadow,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="mkt-cta inline-flex items-center gap-1.5 px-4 py-1 text-xs font-semibold" style={{ borderRadius: MKT.radius.sm }}>
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
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: MKT.textSecondary }}>
                    / mo after trial
                  </span>
                </div>
                {isAnyAnnualBillingAvailable() && (
                  <p className="mt-2 text-xs" style={{ color: MKT.textSecondary }}>
                    or {getPlanDisplayPrice(plan.plan, 'annual')}/year — save 2 months
                  </p>
                )}
              </div>

              <Link href="/auth/signup" className="mb-7 block">
                <span
                  className={`block w-full py-3 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                    plan.popular ? 'mkt-cta' : ''
                  }`}
                  style={
                    plan.popular
                      ? { borderRadius: MKT.radius.md }
                      : {
                          borderRadius: MKT.radius.md,
                          backgroundColor: MKT.background,
                          color: MKT.textPrimary,
                          border: `1px solid ${MKT.border}`,
                        }
                  }
                >
                  Start free trial
                </span>
              </Link>

              <div className="mb-5 border-t" style={{ borderColor: MKT.border }} />
              <p
                className="mb-4 font-mono text-[12px] font-medium uppercase tracking-[0.12em]"
                style={{ color: MKT.textSecondary }}
              >
                What&apos;s included
              </p>
                <PricingFeatureList plan={plan.plan} tone="marketing" />
            </motion.div>
          ))}
        </div>

        <motion.p
          {...mktEnterReveal(reduced, 0.2)}
          className="mt-8 text-center text-sm"
          style={{ color: MKT.textSecondary }}
        >
          <Link
            href="/pricing#compare"
            className="font-medium transition-opacity hover:opacity-70"
            style={{ color: MKT.textPrimary }}
          >
            Compare all features →
          </Link>
        </motion.p>

        <motion.p
          {...mktEnterReveal(reduced, 0.24)}
          className="mt-10 text-center text-sm"
          style={{ color: MKT.textSecondary }}
        >
          {getPricingFootnote()}
        </motion.p>
      </div>
    </section>
  );
}

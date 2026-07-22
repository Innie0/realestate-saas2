'use client';

import Link from 'next/link';
import PricingFeatureList from '@/components/PricingFeatureList';
import { CountUpPrice } from '@/components/home/CountUpMetric';
import HoverMotionCard from '@/components/home/HoverMotionCard';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import {
  STARTER_PLAN_DESCRIPTION,
  PRO_PLAN_DESCRIPTION,
  PLAN_PRICES,
  getPlanDisplayPrice,
  getPricingFootnote,
  isAnyAnnualBillingAvailable,
} from '@/lib/pricing';
import { MKT } from '@/lib/marketing-design';

const PLANS = [
  {
    name: 'Starter',
    amount: PLAN_PRICES.starter.monthly,
    description: STARTER_PLAN_DESCRIPTION,
    plan: 'starter' as const,
    popular: false,
  },
  {
    name: 'Pro',
    amount: PLAN_PRICES.pro.monthly,
    description: PRO_PLAN_DESCRIPTION,
    plan: 'pro' as const,
    popular: true,
  },
];

export default function LandingPricingSection() {
  return (
    <section className="border-t py-24 lg:py-32" style={{ borderColor: MKT.border, backgroundColor: MKT.background }}>
      <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <LandingStaggerReveal className="mx-auto mb-16 max-w-2xl text-center">
          <p data-reveal className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: MKT.textSecondary }}>
            Pricing
          </p>
          <h2
            data-reveal
            className="font-display mt-4 text-3xl font-medium tracking-[-0.03em] sm:text-4xl"
            style={{ color: MKT.textPrimary }}
          >
            Simple, transparent pricing
          </h2>
          <p data-reveal className="mt-4 text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
            7-day free trial on every plan. No setup fees. Cancel anytime.
          </p>
        </LandingStaggerReveal>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          {PLANS.map((plan) => (
            <HoverMotionCard
              key={plan.name}
              className="relative flex flex-col p-7 sm:p-8"
              style={{
                borderRadius: MKT.radius.card,
                backgroundColor: MKT.surface,
                border: plan.popular ? `1.5px solid ${MKT.accent}` : `1px solid ${MKT.border}`,
              }}
            >
              {plan.popular ? (
                <span
                  className="absolute -top-3 left-6 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{
                    borderRadius: 9999,
                    backgroundColor: MKT.tag.green.bg,
                    color: MKT.tag.green.text,
                  }}
                >
                  Most popular
                </span>
              ) : null}

              <div className="mb-6">
                <h3 className="text-xl font-medium" style={{ color: MKT.textPrimary }}>
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1.5">
                  <CountUpPrice
                    amount={plan.amount}
                    className="text-4xl font-medium tabular-nums tracking-tight"
                    style={{ color: MKT.textPrimary }}
                  />
                  <span className="text-sm" style={{ color: MKT.textSecondary }}>
                    / mo after trial
                  </span>
                </div>
                {isAnyAnnualBillingAvailable() ? (
                  <p className="mt-2 text-xs" style={{ color: MKT.textSecondary }}>
                    or {getPlanDisplayPrice(plan.plan, 'annual')}/year — save 2 months
                  </p>
                ) : null}
              </div>

              <MarketingButton
                href="/auth/signup"
                variant={plan.popular ? 'primary' : 'secondary'}
                className="mb-8 w-full"
              >
                Start your 7-day free trial
              </MarketingButton>

              <div className="mb-5 border-t" style={{ borderColor: MKT.border }} />
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: MKT.textSecondary }}>
                What&apos;s included
              </p>
              <PricingFeatureList plan={plan.plan} tone="marketing" />
            </HoverMotionCard>
          ))}
        </div>

        <LandingStaggerReveal className="mt-10 text-center" stagger={0.05}>
          <Link
            data-reveal
            href="/pricing#compare"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: MKT.textPrimary }}
          >
            Compare all features
          </Link>
          <p data-reveal className="mt-8 text-sm" style={{ color: MKT.textSecondary }}>
            {getPricingFootnote()}
          </p>
        </LandingStaggerReveal>
      </div>
    </section>
  );
}

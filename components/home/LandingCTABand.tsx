'use client';

import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';

export default function LandingCTABand() {
  return (
    <section className="bg-mkt-background pb-[var(--mkt-section-pb)] pt-[var(--mkt-section-gap)]">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <MarketingBlurFade inView>
          <div className="rounded-mkt-card border border-mkt-border bg-mkt-surface px-6 py-14 shadow-[var(--mkt-shadow-card)] ring-1 ring-black/[0.04] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
              <h2
                data-reveal
                className="font-mkt-display text-3xl font-semibold leading-[1.12] tracking-[-0.05em] text-mkt-foreground sm:text-4xl lg:text-[2.75rem]"
              >
                Unlock the power of AI with Oikaro
              </h2>
              <p data-reveal className="mt-5 text-base leading-relaxed text-mkt-secondary">
                Join agents who manage listings, leads, and transactions in one place — with a 7-day
                trial to see if Oikaro fits how you work.
              </p>
              <div
                data-reveal
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <MarketingShimmerCta href="/auth/signup" size="lg">
                  Start your 7-day free trial
                </MarketingShimmerCta>
                <a
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-mkt-button border border-mkt-border bg-mkt-surface px-7 text-[15px] font-medium text-mkt-foreground transition-colors duration-200 hover:bg-mkt-surface-muted"
                >
                  See pricing
                </a>
              </div>
              <p data-reveal className="mt-4 text-sm text-mkt-muted">
                No credit card required to explore
              </p>
            </LandingStaggerReveal>
          </div>
        </MarketingBlurFade>
      </div>
    </section>
  );
}

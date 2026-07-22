'use client';

import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';

export default function LandingCTABand() {
  return (
    <section className="bg-mkt-surface-muted">
      <div className="mx-auto max-w-mkt-content px-5 py-24 sm:px-8 sm:py-28 lg:py-32">
        <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
          <h2
            data-reveal
            className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.03em] text-mkt-foreground sm:text-4xl"
          >
            Ready to simplify your workflow?
          </h2>
          <p data-reveal className="mt-5 text-base leading-[1.65] text-mkt-secondary">
            Join agents who manage listings, leads, and transactions in one place — with a 7-day
            trial to see if Oikaro fits how you work.
          </p>
          <div data-reveal className="mt-10 flex flex-col items-center gap-3">
            <MarketingButton href="/auth/signup" size="lg">
              Start your 7-day free trial
            </MarketingButton>
            <p className="text-sm text-mkt-secondary">
              Starter and Pro plans · No credit card required to explore
            </p>
          </div>
        </LandingStaggerReveal>
      </div>
    </section>
  );
}

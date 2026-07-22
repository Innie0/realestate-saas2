'use client';

import LandingScrollReveal from '@/components/home/LandingScrollReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import { MKT } from '@/lib/marketing-design';

export default function LandingCTABand() {
  return (
    <section style={{ backgroundColor: MKT.surfaceMuted }}>
      <div className="mx-auto px-5 py-24 sm:px-8 sm:py-28 lg:py-32" style={{ maxWidth: MKT.maxContentWidth }}>
        <LandingScrollReveal className="mx-auto max-w-2xl text-center">
          <h2
            className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.03em] sm:text-4xl"
            style={{ color: MKT.textPrimary }}
          >
            Ready to simplify your workflow?
          </h2>
          <p className="mt-5 text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
            Join agents who manage listings, leads, and transactions in one place — with a 7-day
            trial to see if Oikaro fits how you work.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <MarketingButton href="/auth/signup" size="lg">
              Start your 7-day free trial
            </MarketingButton>
            <p className="text-sm" style={{ color: MKT.textSecondary }}>
              Starter and Pro plans · No credit card required to explore
            </p>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}

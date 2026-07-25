'use client';

import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import LandingGradientPanel from '@/components/home/LandingGradientPanel';
import MarketingButton from '@/components/marketing/MarketingButton';

export default function LandingCTABand() {
  return (
    <section className="bg-mkt-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingGradientPanel
          variant="hero"
          elevated="hero"
          innerClassName="px-6 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20"
        >
          <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
            <h2
              data-reveal
              className="font-display text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.75rem]"
            >
              Unlock the power of AI with Oikaro
            </h2>
            <p data-reveal className="mt-5 text-base leading-[1.65] text-white/80">
              Join agents who manage listings, leads, and transactions in one place — with a 7-day
              trial to see if Oikaro fits how you work.
            </p>
            <div
              data-reveal
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <MarketingButton href="/auth/signup" variant="light" size="lg">
                Start your 7-day free trial
              </MarketingButton>
              <MarketingButton
                href="/pricing"
                variant="secondary"
                size="lg"
                className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
              >
                See pricing
              </MarketingButton>
            </div>
            <p data-reveal className="mt-4 text-sm text-white/60">
              No credit card required to explore
            </p>
          </LandingStaggerReveal>
        </LandingGradientPanel>
      </div>
    </section>
  );
}

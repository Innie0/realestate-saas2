'use client';

import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';

export default function LandingCTABand() {
  return (
    <section className="bg-[#0668E1] py-20 text-white sm:py-24 lg:py-28">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <MarketingBlurFade inView>
          <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
            <h2
              data-reveal
              className="font-mkt-display text-3xl font-semibold leading-[1.12] tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.75rem]"
            >
              Unlock the power of AI with Oikaro
            </h2>
            <p data-reveal className="mt-5 text-base leading-relaxed text-white/75">
              Join agents who manage listings, leads, and transactions in one place — with a 7-day
              trial to see if Oikaro fits how you work.
            </p>
            <div
              data-reveal
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <MarketingShimmerCta href="/auth/signup" size="lg" inverted>
                Start your 7-day free trial
              </MarketingShimmerCta>
              <a
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-mkt-button border border-white/30 bg-transparent px-7 text-[15px] font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
              >
                See pricing
              </a>
            </div>
            <p data-reveal className="mt-4 text-sm text-white/60">
              No credit card required to explore
            </p>
          </LandingStaggerReveal>
        </MarketingBlurFade>
      </div>
    </section>
  );
}

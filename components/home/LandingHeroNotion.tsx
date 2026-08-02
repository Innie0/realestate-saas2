'use client';

import Link from 'next/link';
import { LandingHeroGradient } from '@/components/home/LandingHeroGradient';
import { LandingTypingDemo } from '@/components/home/LandingTypingDemo';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import { HERO_TRUST_BRANDS } from '@/lib/landing-hero-prompts';
import { LANDING_HERO } from '@/lib/landing-showcase';

export default function LandingHeroNotion() {
  return (
    <section className="relative overflow-hidden bg-white pt-[calc(var(--mkt-nav-height)+2.5rem)] pb-10 sm:pb-14 lg:pb-16">
      <LandingHeroGradient />

      <div className="relative z-10 mx-auto max-w-mkt-content px-5 sm:px-8">
        <MarketingBlurFade>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-display text-[clamp(2.25rem,6vw,4.25rem)] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#0A0A0A]">
              {LANDING_HERO.headlineLead}{' '}
              <span className="text-[#0A0A0A]">{LANDING_HERO.headlineAccent}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#0A0A0A]/60 sm:text-xl">
              {LANDING_HERO.subheadline}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 min-w-[168px] items-center justify-center rounded-mkt-button bg-[#0A0A0A] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 min-w-[168px] items-center justify-center rounded-mkt-button border border-black/10 bg-white px-7 text-[15px] font-semibold text-[#0A0A0A] transition-colors hover:border-black/20 hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#0A0A0A]/50">7 days free · No setup fees · Cancel anytime</p>
          </div>
        </MarketingBlurFade>

        <div className="relative z-10 mx-auto mt-12 flex justify-center sm:mt-14 lg:mt-16">
          <LandingTypingDemo />
        </div>

        <div className="relative z-10 mt-12 border-t border-black/10 pt-8 sm:mt-14 sm:pt-10">
          <p className="text-center font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#0A0A0A]/45">
            Trusted by agents at leading brokerages
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">
            {HERO_TRUST_BRANDS.map((brand) => (
              <li
                key={brand}
                className="text-sm font-semibold tracking-[-0.02em] text-[#0A0A0A]/30 sm:text-[15px]"
              >
                {brand}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

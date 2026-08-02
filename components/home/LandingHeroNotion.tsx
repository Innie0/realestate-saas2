'use client';

import Link from 'next/link';
import {
  LANDING_HERO_FADE_COLOR,
  LandingHeroGradient,
} from '@/components/home/LandingHeroGradient';
import { LandingTypingDemo } from '@/components/home/LandingTypingDemo';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import { LANDING_HERO } from '@/lib/landing-showcase';

export default function LandingHeroNotion() {
  return (
    <section
      className="relative min-h-[min(920px,105vh)] overflow-hidden pt-[calc(var(--mkt-nav-height)+3.5rem)] pb-20 sm:min-h-[min(980px,110vh)] sm:pb-24 lg:pb-28"
      style={{ backgroundColor: LANDING_HERO_FADE_COLOR }}
    >
      <LandingHeroGradient />

      <div className="relative z-10 mx-auto flex min-h-[min(780px,88vh)] max-w-mkt-content flex-col px-5 sm:px-8">
        <MarketingBlurFade>
          <div className="mx-auto max-w-4xl flex-1 text-center">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,4.75rem)] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#0A0A0A]">
              {LANDING_HERO.headlineLead}{' '}
              <span className="text-[#0A0A0A]">{LANDING_HERO.headlineAccent}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#0A0A0A]/60 sm:mt-7 sm:text-xl">
              {LANDING_HERO.subheadline}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 min-w-[168px] items-center justify-center rounded-mkt-button bg-[#0A0A0A] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#C9E0FE]"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 min-w-[168px] items-center justify-center rounded-mkt-button border border-black/10 bg-white px-7 text-[15px] font-semibold text-[#0A0A0A] transition-colors hover:border-black/20 hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#C9E0FE]"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-5 text-sm text-[#0A0A0A]/50">7 days free · No setup fees · Cancel anytime</p>
          </div>
        </MarketingBlurFade>

        <div className="relative z-10 mx-auto mt-auto flex w-full justify-center pb-4 pt-14 sm:pt-16 lg:pt-20">
          <LandingTypingDemo />
        </div>
      </div>
    </section>
  );
}

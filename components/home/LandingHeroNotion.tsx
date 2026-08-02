'use client';

import Link from 'next/link';
import { LandingHeroGradient } from '@/components/home/LandingHeroGradient';
import { LandingTypingDemo } from '@/components/home/LandingTypingDemo';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import { LANDING_HERO } from '@/lib/landing-showcase';

export default function LandingHeroNotion() {
  return (
    <section className="relative overflow-hidden bg-white pt-[calc(var(--mkt-nav-height)+3.5rem)] pb-16 sm:pb-20 lg:pb-24">
      <LandingHeroGradient />

      <div className="relative z-10 mx-auto flex min-h-[min(860px,92vh)] max-w-mkt-content flex-col px-5 sm:min-h-[min(940px,96vh)] sm:px-8">
        <MarketingBlurFade>
          <div className="mx-auto max-w-4xl flex-1 text-center">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,4.75rem)] font-extrabold leading-[1.04] tracking-[-0.045em] text-white [text-shadow:0_1px_24px_rgba(0,0,0,0.12)]">
              {LANDING_HERO.headlineLead}{' '}
              <span className="text-white">{LANDING_HERO.headlineAccent}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:mt-7 sm:text-xl">
              {LANDING_HERO.subheadline}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 min-w-[168px] items-center justify-center rounded-mkt-button bg-[#0A0A0A] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 min-w-[168px] items-center justify-center rounded-mkt-button border border-white/30 bg-white/95 px-7 text-[15px] font-semibold text-[#0A0A0A] backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/70">7 days free · No setup fees · Cancel anytime</p>
          </div>
        </MarketingBlurFade>

        <div className="relative z-10 mx-auto mt-auto flex w-full justify-center pt-16 sm:pt-20 lg:pt-24">
          <LandingTypingDemo />
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import HeroAssistantPreview from '@/components/home/HeroAssistantPreview';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';
import { Marquee } from '@/components/ui/marquee';
import { HERO_TRUST_BRANDS } from '@/lib/landing-hero-prompts';
import { useMotionReduced } from '@/lib/motion';

type LandingHeroAttioProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

export default function LandingHeroAttio({ sectionRef }: LandingHeroAttioProps) {
  const reduced = useMotionReduced();

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative bg-mkt-background pt-[var(--mkt-nav-height)]"
    >
      <div className="mx-auto max-w-mkt-content px-5 pb-[var(--mkt-section-pb)] pt-[var(--mkt-section-pt)] sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <MarketingBlurFade delay={0}>
            <p className="text-mkt-label text-[11px] font-medium uppercase tracking-[0.08em] text-mkt-secondary">
              Built for real estate agents
            </p>
          </MarketingBlurFade>

          <MarketingBlurFade delay={0.06}>
            <h1 className="font-mkt-display mt-4 text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.05em] text-mkt-foreground">
              Your entire business,
              <br />
              <span className="font-mkt-serif font-normal italic text-mkt-secondary">one workspace</span>
            </h1>
          </MarketingBlurFade>

          <MarketingBlurFade delay={0.12}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mkt-secondary sm:text-[17px]">
              Listings, leads, research, and deals — finally in one place. Stop juggling spreadsheets,
              forms, and five different apps.
            </p>
          </MarketingBlurFade>

          <MarketingBlurFade delay={0.18}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MarketingShimmerCta href="/auth/signup" size="lg">
                Start free trial
              </MarketingShimmerCta>
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-mkt-button border border-mkt-border bg-mkt-surface px-7 text-[15px] font-medium text-mkt-foreground transition-colors duration-200 hover:bg-mkt-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent/30"
              >
                See demo
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </Link>
            </div>
            <p className="mt-3 text-sm text-mkt-muted">7 days free · No setup fees · Cancel anytime</p>
          </MarketingBlurFade>
        </div>

        <MarketingBlurFade delay={0.24} inView className="relative mx-auto mt-12 w-full max-w-[880px] sm:mt-14">
          <div
            className="overflow-hidden rounded-mkt-browser bg-mkt-surface shadow-[var(--mkt-shadow-card)] ring-1 ring-black/[0.04]"
          >
            <BrowserWindowFrame>
              <HeroAssistantPreview animateWhenVisible compactChrome />
            </BrowserWindowFrame>
          </div>
        </MarketingBlurFade>

        <MarketingBlurFade delay={0.3} inView className="mt-12 sm:mt-14">
          <p className="mb-5 text-center text-mkt-label text-[10px] font-medium uppercase tracking-[0.12em] text-mkt-muted">
            Used by agents at leading brokerages
          </p>
          {reduced ? (
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {HERO_TRUST_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="text-sm font-medium tracking-[-0.02em] text-mkt-secondary"
                >
                  {brand}
                </span>
              ))}
            </div>
          ) : (
            <Marquee pauseOnHover className="[--duration:32s] [--gap:2.5rem]">
              {HERO_TRUST_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="text-sm font-medium tracking-[-0.02em] text-mkt-secondary"
                >
                  {brand}
                </span>
              ))}
            </Marquee>
          )}
        </MarketingBlurFade>
      </div>
    </section>
  );
}

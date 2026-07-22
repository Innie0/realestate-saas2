'use client';

import { useRef } from 'react';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { LANDING_HERO_SCREENSHOT } from '@/lib/landing-features';
import { MKT } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';
import MarketingButton from '@/components/marketing/MarketingButton';
import ProductScreenshot from '@/components/home/ProductScreenshot';

type LandingHeroProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

ensureGsapRegistered();

export default function LandingHero({ sectionRef }: LandingHeroProps) {
  const reduced = useMotionReduced();
  const copyRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced) return;
      const tl = gsap.timeline({ defaults: { ease: landingRevealDefaults.ease } });
      if (copyRef.current) {
        tl.from(copyRef.current.querySelectorAll('[data-hero-part]'), {
          opacity: 0,
          y: 28,
          duration: 0.85,
          stagger: 0.1,
        });
      }
      if (visualRef.current) {
        tl.from(
          visualRef.current,
          { opacity: 0, y: 36, duration: 1, ease: landingRevealDefaults.ease },
          '-=0.45',
        );
      }
    },
    { dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative overflow-hidden"
      style={{ backgroundColor: MKT.background }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.45]"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(237, 243, 236, 0.9) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative mx-auto px-5 pb-20 pt-28 sm:px-8 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-36"
        style={{ maxWidth: MKT.maxContentWidth }}
      >
        <div ref={copyRef} className="mx-auto max-w-3xl text-center">
          <p
            data-hero-part
            className="mb-5 text-xs font-medium uppercase tracking-[0.14em]"
            style={{ color: MKT.textSecondary }}
          >
            Built for real estate agents
          </p>

          <h1
            data-hero-part
            className="font-display text-[2.35rem] font-medium leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]"
            style={{ color: MKT.textPrimary }}
          >
            Run listings, leads, and deals from one calm workspace
          </h1>

          <p
            data-hero-part
            className="mx-auto mt-6 max-w-xl text-base leading-[1.65] sm:text-[17px]"
            style={{ color: MKT.textSecondary }}
          >
            Oikaro brings your pipeline, client records, and transaction checklists together —
            so you spend less time switching tools and more time with clients.
          </p>

          <div data-hero-part className="mt-10 flex flex-col items-center gap-3">
            <MarketingButton href="/auth/signup" size="lg">
              Start your 7-day free trial
            </MarketingButton>
            <p className="text-sm" style={{ color: MKT.textSecondary }}>
              No setup fees · Cancel anytime
            </p>
          </div>
        </div>

        <div ref={visualRef} className="relative mx-auto mt-14 w-full max-w-[920px] sm:mt-16 lg:mt-20">
          <ProductScreenshot
            src={LANDING_HERO_SCREENSHOT.src}
            alt={LANDING_HERO_SCREENSHOT.alt}
            priority
          />
        </div>
      </div>
    </section>
  );
}

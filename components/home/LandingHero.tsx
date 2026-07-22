'use client';

import { useRef } from 'react';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { LANDING_HERO_SCREENSHOT } from '@/lib/landing-features';
import { splitWords } from '@/lib/landing-motion';
import { useMotionReduced } from '@/lib/motion';
import MarketingButton from '@/components/marketing/MarketingButton';
import ProductScreenshot from '@/components/home/ProductScreenshot';

const HEADLINE = 'Run listings, leads, and deals from one calm workspace';

type LandingHeroProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

ensureGsapRegistered();

export default function LandingHero({ sectionRef }: LandingHeroProps) {
  const reduced = useMotionReduced();
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced || !rootRef.current) return;

      const eyebrow = rootRef.current.querySelector('[data-hero-eyebrow]');
      const words = rootRef.current.querySelectorAll('[data-hero-word]');
      const subcopy = rootRef.current.querySelector('[data-hero-subcopy]');
      const cta = rootRef.current.querySelector('[data-hero-cta]');
      const visual = rootRef.current.querySelector('[data-hero-visual]');

      gsap.set([eyebrow, subcopy, cta, visual], { autoAlpha: 0, y: 16 });
      gsap.set(words, { y: '110%' });

      const tl = gsap.timeline({
        defaults: { ease: landingRevealDefaults.ease, duration: landingRevealDefaults.duration },
      });

      tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.35 })
        .to(
          words,
          {
            y: '0%',
            duration: 0.42,
            stagger: 0.035,
            ease: landingRevealDefaults.ease,
          },
          '-=0.1',
        )
        .to(subcopy, { autoAlpha: 1, y: 0, duration: 0.38 }, '-=0.12')
        .to(cta, { autoAlpha: 1, y: 0, duration: 0.35 }, '-=0.2')
        .to(visual, { autoAlpha: 1, y: 0, duration: 0.48 }, '-=0.25');
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      const root = rootRef.current;
      if (reduced || !section || !root) return;

      const visual = root.querySelector('[data-hero-visual]');
      if (!visual) return;

      const parallaxVisual = gsap.to(visual, {
        y: -72,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      });

      return () => {
        parallaxVisual.scrollTrigger?.kill();
        parallaxVisual.kill();
      };
    },
    { dependencies: [sectionRef, reduced] },
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-mkt-background"
    >
      <div
        ref={rootRef}
        className="relative mx-auto flex w-full max-w-mkt-content flex-1 flex-col justify-center px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:pt-36"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p
            data-hero-eyebrow
            className="mb-5 text-xs font-medium uppercase tracking-[0.14em] text-mkt-secondary"
          >
            Built for real estate agents
          </p>

          <h1 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] font-medium leading-[1.06] tracking-[-0.035em] text-mkt-foreground">
            {splitWords(HEADLINE).map((word, index, arr) => (
              <span key={`${word}-${index}`} className="inline-block overflow-hidden align-top">
                <span data-hero-word className="inline-block">
                  {word}
                  {index < arr.length - 1 ? '\u00A0' : ''}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-hero-subcopy
            className="mx-auto mt-6 max-w-xl text-base leading-[1.65] text-mkt-secondary sm:text-[17px]"
          >
            Oikaro brings your pipeline, client records, and transaction checklists together —
            so you spend less time switching tools and more time with clients.
          </p>

          <div data-hero-cta className="mt-10 flex flex-col items-center gap-3">
            <MarketingButton href="/auth/signup" size="lg">
              Start your 7-day free trial
            </MarketingButton>
            <p className="text-sm text-mkt-secondary">No setup fees · Cancel anytime</p>
          </div>
        </div>

        <div
          data-hero-visual
          className="relative mx-auto mt-12 w-full max-w-[920px] will-change-transform sm:mt-14 lg:mt-16"
        >
          <ProductScreenshot
            src={LANDING_HERO_SCREENSHOT.src}
            alt={LANDING_HERO_SCREENSHOT.alt}
            priority
            className="shadow-raised"
          />
        </div>
      </div>
    </section>
  );
}

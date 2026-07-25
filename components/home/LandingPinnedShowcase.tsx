'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { SHOWCASE_NARRATIVE, SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';
import MarketingButton from '@/components/marketing/MarketingButton';
import GradientShowcaseCard from '@/components/home/GradientShowcaseCard';

const TAG_CLASSES = [
  'bg-mkt-tag-green-bg text-mkt-tag-green-text',
  'bg-mkt-tag-blue-bg text-mkt-tag-blue-text',
  'bg-mkt-tag-amber-bg text-mkt-tag-amber-text',
] as const;

ensureGsapRegistered();

export default function LandingPinnedShowcase() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const pin = pinRef.current;
      if (reduced || !pin) return;

      const slides = gsap.utils.toArray<HTMLElement>('[data-pinned-slide]', pin);
      const indicators = gsap.utils.toArray<HTMLElement>('[data-pinned-indicator]', pin);
      if (slides.length < 2) return;

      gsap.set(slides, { autoAlpha: 0, zIndex: 0 });
      gsap.set(slides[0], { autoAlpha: 1, zIndex: 1 });
      gsap.set(indicators, { scale: 1, opacity: 0.35 });
      gsap.set(indicators[0], { scale: 1.2, opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${window.innerHeight * slides.length * 0.9}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      slides.forEach((slide, index) => {
        if (index === 0) return;

        const prev = slides[index - 1];
        const indicator = indicators[index];

        // Strict sequential crossfade — each slide fully exits before the next enters.
        tl.to(prev, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' })
          .set(slide, { zIndex: index + 1 })
          .fromTo(slide, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
          .to(
            indicators,
            { scale: 1, opacity: 0.35, duration: 0.25, stagger: 0.04 },
            '-=0.15',
          )
          .to(indicator, { scale: 1.2, opacity: 1, duration: 0.25 }, '<');
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  if (reduced) {
    return (
      <section
        aria-label="How Oikaro works"
        className="border-t border-mkt-border bg-mkt-background"
      >
        <div className="mx-auto max-w-mkt-content px-5 py-24 sm:px-8 sm:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-mkt-secondary">
            {SHOWCASE_NARRATIVE.eyebrow}
          </p>
          <h2 className="font-display mt-4 max-w-2xl text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-mkt-foreground sm:text-4xl">
            {SHOWCASE_NARRATIVE.headlineLead}
            <span className="text-mkt-secondary">{SHOWCASE_NARRATIVE.headlineFade}</span>
          </h2>
          <div className="mt-16 flex flex-col gap-24">
            {SHOWCASE_SLIDES.map((slide, index) => (
              <article key={slide.id}>
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${TAG_CLASSES[index % 3]}`}
                >
                  {slide.eyebrow}
                </span>
                <h3 className="font-display mt-4 text-2xl font-medium tracking-[-0.03em] text-mkt-foreground">
                  {slide.headline}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-[1.65] text-mkt-secondary">
                  {slide.description}
                </p>
                <div className="mt-8">
                  <GradientShowcaseCard src={slide.screenshot} alt={slide.screenshotAlt} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="How Oikaro works"
      className="relative isolate border-t border-mkt-border bg-mkt-background"
    >
      <div ref={pinRef} className="relative min-h-[100dvh]">
        <div className="mx-auto flex h-[100dvh] max-w-mkt-content flex-col justify-center px-5 py-16 sm:px-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16 lg:py-0">
          <div className="mb-10 shrink-0 lg:mb-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-mkt-secondary">
              {SHOWCASE_NARRATIVE.eyebrow}
            </p>
            <h2 className="font-display mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-mkt-foreground sm:text-4xl lg:text-[2.75rem]">
              {SHOWCASE_NARRATIVE.headlineLead}
              <span className="text-mkt-secondary">{SHOWCASE_NARRATIVE.headlineFade}</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-[1.65] text-mkt-secondary">
              {SHOWCASE_NARRATIVE.subheadline}
            </p>

            <div className="mt-8 flex items-center gap-2" aria-hidden>
              {SHOWCASE_SLIDES.map((slide) => (
                <span
                  key={slide.id}
                  data-pinned-indicator
                  className="h-1.5 w-6 origin-left rounded-full bg-mkt-accent"
                  title={slide.eyebrow}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-mkt-muted">Scroll to walk through the workflow</p>
          </div>

          {/* Fixed-height stack — overflow hidden prevents slides bleeding during crossfade */}
          <div className="relative h-[min(540px,72vh)] min-h-[420px] overflow-hidden sm:min-h-[460px] lg:min-h-0 lg:h-[min(560px,78vh)]">
            {SHOWCASE_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                data-pinned-slide
                className="absolute inset-0 flex flex-col overflow-hidden"
                style={{ zIndex: index === 0 ? 1 : 0 }}
              >
                <span
                  className={`inline-block w-fit rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${TAG_CLASSES[index % 3]}`}
                >
                  {slide.eyebrow}
                </span>
                <h3 className="font-display mt-4 text-2xl font-medium leading-[1.15] tracking-[-0.03em] text-mkt-foreground sm:text-[1.75rem]">
                  {slide.headline}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-[1.65] text-mkt-secondary">
                  {slide.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <MarketingButton href="/auth/signup" variant="primary">
                    Start free trial
                  </MarketingButton>
                  <Link
                    href={slide.productsHref}
                    className="text-sm font-medium text-mkt-foreground transition-opacity hover:opacity-70"
                  >
                    Learn more
                  </Link>
                </div>
                <div className="mt-8 min-h-0 flex-1">
                  <GradientShowcaseCard src={slide.screenshot} alt={slide.screenshotAlt} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

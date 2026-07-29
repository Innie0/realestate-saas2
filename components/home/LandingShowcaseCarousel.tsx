'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SHOWCASE_SLIDES, type ShowcaseSlide } from '@/lib/landing-showcase';
import {
  ShowcaseAnimation,
  type ShowcaseAnimationId,
} from '@/components/home/showcase-animations/ShowcaseAnimations';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

const indicatorSpring = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.8 };

function isShowcaseAnimationId(id: string): id is ShowcaseAnimationId {
  return ['ask-once', 'win-listing', 'never-lose-lead', 'close-confidence'].includes(id);
}

function ShowcaseNavRail({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Product features" className="lg:py-2">
      <div className="relative">
        <div className="absolute bottom-0 left-0 top-0 w-px bg-mkt-border" aria-hidden />

        <LayoutGroup id="showcase-rail">
          <ul className="flex flex-col pl-5 sm:pl-6">
            {SHOWCASE_SLIDES.map((item, i) => {
              const isActive = i === active;
              return (
                <li key={item.id} className="relative min-h-[4.5rem] sm:min-h-[4.75rem]">
                  {isActive ? (
                    <motion.div
                      layoutId="showcase-active-indicator"
                      className="absolute bottom-0 left-[-1.25rem] top-0 w-0.5 bg-mkt-foreground sm:left-[-1.5rem]"
                      transition={indicatorSpring}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    className="group w-full rounded-mkt-button py-3 text-left transition-colors duration-200 hover:bg-mkt-surface-muted/50 lg:py-3.5"
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <p
                      className={`text-mkt-label text-[10px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 ${
                        isActive ? 'text-mkt-secondary' : 'text-mkt-muted'
                      }`}
                    >
                      {item.eyebrow}
                    </p>
                    <p
                      className={`mt-1.5 text-base leading-snug tracking-[-0.02em] transition-colors duration-200 sm:text-lg ${
                        isActive
                          ? 'font-medium text-mkt-foreground'
                          : 'font-normal text-mkt-muted group-hover:text-mkt-secondary'
                      }`}
                    >
                      {item.headline}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </nav>
  );
}

function ShowcaseSlidePanel({
  slide,
  reduced,
}: {
  slide: ShowcaseSlide;
  reduced: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <h3 className="font-mkt-display max-w-xl text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-mkt-foreground">
        {slide.headline}
      </h3>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-mkt-secondary">{slide.description}</p>

      <div className="relative mt-8 min-h-[min(380px,52vw)] flex-1 lg:min-h-[420px]">
        {isShowcaseAnimationId(slide.id) ? (
          <ShowcaseAnimation id={slide.id} reduced={reduced} />
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {slide.tools.map((tool) => (
          <span
            key={tool}
            className="rounded-mkt-button border border-mkt-border bg-mkt-surface px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-mkt-secondary"
          >
            {tool}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <MarketingShimmerCta href="/auth/signup">Get Started</MarketingShimmerCta>
        <Link
          href={slide.productsHref}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-mkt-foreground transition-opacity duration-200 hover:opacity-70"
        >
          Learn more
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export default function LandingShowcaseCarousel() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);

  const scrollToSlide = useCallback((index: number) => {
    const st = scrollTriggerRef.current;
    if (!st || SHOWCASE_SLIDES.length < 2) return;
    const progress = index / (SHOWCASE_SLIDES.length - 1);
    const y = st.start + progress * (st.end - st.start);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  useGSAP(
    () => {
      const pin = pinRef.current;
      if (reduced || !pin) return;

      const slides = gsap.utils.toArray<HTMLElement>('[data-showcase-slide]', pin);
      if (slides.length < 2) return;

      gsap.set(slides, { autoAlpha: 0, zIndex: 0 });
      gsap.set(slides[0], { autoAlpha: 1, zIndex: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${window.innerHeight * (slides.length - 1) * 0.92}`,
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              slides.length - 1,
              Math.round(self.progress * (slides.length - 1)),
            );
            setActive(idx);
          },
        },
      });

      scrollTriggerRef.current = tl.scrollTrigger ?? null;

      slides.forEach((slide, index) => {
        if (index === 0) return;

        const prev = slides[index - 1];

        tl.to(prev, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' })
          .set(slide, { zIndex: index + 1 })
          .fromTo(slide, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' });
      });

      return () => {
        scrollTriggerRef.current = null;
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  if (reduced) {
    return (
      <section
        aria-label="Product features"
        className="border-t border-mkt-border bg-mkt-background pb-[var(--mkt-section-pb)] pt-[var(--mkt-section-gap)]"
      >
        <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
          <div className="flex flex-col gap-20">
            {SHOWCASE_SLIDES.map((slide) => (
              <article key={slide.id}>
                <p className="text-mkt-label text-[10px] font-medium uppercase tracking-[0.1em] text-mkt-secondary">
                  {slide.eyebrow}
                </p>
                <ShowcaseSlidePanel slide={slide} reduced />
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
      aria-label="Product features"
      className="relative z-10 border-t border-mkt-border bg-mkt-background"
    >
      <div ref={pinRef} className="relative min-h-[calc(100dvh-var(--mkt-nav-height))]">
        <div className="mx-auto flex h-[calc(100dvh-var(--mkt-nav-height))] max-w-mkt-content flex-col justify-center px-5 pb-16 pt-[var(--mkt-nav-height)] sm:px-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-0 xl:gap-16">
          <div className="mb-8 shrink-0 lg:col-span-4 lg:mb-0 lg:pr-4 xl:col-span-4">
            <ShowcaseNavRail active={active} onSelect={scrollToSlide} />
            <p className="mt-8 hidden text-xs text-mkt-muted lg:block">
              Scroll to walk through each workflow
            </p>
          </div>

          <div className="relative min-h-[min(520px,72vh)] flex-1 overflow-hidden lg:col-span-8 xl:col-span-8">
            {SHOWCASE_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                data-showcase-slide
                className="absolute inset-0 overflow-y-auto"
                style={{ zIndex: index === 0 ? 1 : 0 }}
              >
                <ShowcaseSlidePanel slide={slide} reduced={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

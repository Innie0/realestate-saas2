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
import { ensureGsapRegistered, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

const indicatorSpring = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.8 };
const PANEL_CLASS =
  'flex min-h-[calc(100dvh-var(--mkt-nav-height))] flex-col justify-center py-16 lg:py-20';

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
  showEyebrow = false,
}: {
  slide: ShowcaseSlide;
  reduced: boolean;
  showEyebrow?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {showEyebrow ? (
        <p className="mb-4 text-mkt-label text-[10px] font-medium uppercase tracking-[0.1em] text-mkt-secondary lg:hidden">
          {slide.eyebrow}
        </p>
      ) : null}

      <h3 className="font-mkt-display max-w-xl text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-mkt-foreground">
        {slide.headline}
      </h3>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-mkt-secondary">{slide.description}</p>

      <div className="relative mt-8 min-h-[min(340px,50vw)] lg:min-h-[400px]">
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
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const scrollToSlide = useCallback((index: number) => {
    const panel = panelRefs.current[index];
    if (!panel) return;

    const navHeight =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mkt-nav-height')) || 52;
    const y = panel.getBoundingClientRect().top + window.scrollY - navHeight - 24;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const panels = panelRefs.current.filter(Boolean) as HTMLElement[];
      if (panels.length === 0) return;

      const triggers = panels.map((panel, index) =>
        ScrollTrigger.create({
          trigger: panel,
          start: 'top 42%',
          end: 'bottom 42%',
          onEnter: () => setActive(index),
          onEnterBack: () => setActive(index),
          invalidateOnRefresh: true,
        }),
      );

      return () => {
        triggers.forEach((trigger) => trigger.kill());
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
                <ShowcaseSlidePanel slide={slide} reduced showEyebrow={false} />
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
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-[calc(var(--mkt-nav-height)+1.5rem)] pb-16 pt-[var(--mkt-section-gap)]">
              <ShowcaseNavRail active={active} onSelect={scrollToSlide} />
              <p className="mt-8 text-xs text-mkt-muted">Scroll to walk through each workflow</p>
            </div>
          </div>

          <div className="lg:col-span-8">
            {SHOWCASE_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                ref={(node) => {
                  panelRefs.current[index] = node;
                }}
                data-showcase-panel
                className={PANEL_CLASS}
              >
                <ShowcaseSlidePanel slide={slide} reduced={false} showEyebrow />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

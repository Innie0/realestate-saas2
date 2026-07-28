'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SHOWCASE_SLIDES, type ShowcaseSlide } from '@/lib/landing-showcase';
import {
  ShowcaseAnimation,
  type ShowcaseAnimationId,
} from '@/components/home/showcase-animations/ShowcaseAnimations';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';
import { useMotionReduced } from '@/lib/motion';

const indicatorSpring = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.8 };
const slideEase = [0.25, 0.1, 0.25, 1] as const;
const AUTO_ADVANCE_MS = 8000;

function isShowcaseAnimationId(id: string): id is ShowcaseAnimationId {
  return ['ask-once', 'win-listing', 'never-lose-lead', 'close-confidence'].includes(id);
}

function ShowcaseSlideDetails({ slide }: { slide: ShowcaseSlide }) {
  return (
    <div className="mt-6 min-h-[168px] pl-5 sm:pl-6">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: slideEase }}
        >
          <p className="max-w-md text-[15px] leading-relaxed text-mkt-secondary">{slide.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ShowcaseSlideRail({
  active,
  onSelect,
  onPauseAuto,
  onResumeAuto,
}: {
  active: number;
  onSelect: (index: number) => void;
  onPauseAuto: () => void;
  onResumeAuto: () => void;
}) {
  const slide = SHOWCASE_SLIDES[active];

  return (
    <div className="lg:py-2" onMouseEnter={onPauseAuto} onMouseLeave={onResumeAuto}>
      <div className="relative">
        <div className="absolute bottom-0 left-0 top-0 w-px bg-mkt-border" aria-hidden />

        <LayoutGroup id="showcase-rail">
          <div className="flex flex-col pl-5 sm:pl-6">
            {SHOWCASE_SLIDES.map((item, i) => {
              const isActive = i === active;
              return (
                <div key={item.id} className="relative min-h-[4.75rem] sm:min-h-[5rem]">
                  {isActive ? (
                    <motion.div
                      layoutId="showcase-active-indicator"
                      className="absolute bottom-0 left-[-1.25rem] top-0 w-0.5 bg-mkt-accent sm:left-[-1.5rem]"
                      transition={indicatorSpring}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    className="group w-full rounded-mkt-button py-3 text-left transition-colors duration-200 hover:bg-mkt-surface-muted/60 lg:py-3.5"
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <p
                      className={`text-mkt-label text-[10px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 ${
                        isActive ? 'text-mkt-secondary' : 'text-mkt-muted'
                      }`}
                    >
                      {item.eyebrow}
                    </p>
                    <h3
                      className={`mt-1.5 text-lg leading-snug tracking-[-0.02em] transition-colors duration-200 sm:text-xl ${
                        isActive ? 'font-medium text-mkt-foreground' : 'font-normal text-mkt-muted group-hover:text-mkt-secondary'
                      }`}
                    >
                      {item.headline}
                    </h3>
                  </button>
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <ShowcaseSlideDetails slide={slide} />
    </div>
  );
}

export default function LandingShowcaseCarousel() {
  const reduced = useMotionReduced();
  const [active, setActive] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const slide = SHOWCASE_SLIDES[active];

  const goNext = useCallback(
    () => setActive((i) => (i + 1) % SHOWCASE_SLIDES.length),
    [],
  );

  useEffect(() => {
    if (reduced || autoPaused) return;
    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [autoPaused, goNext, reduced]);

  return (
    <section
      aria-label="Product features"
      className="relative z-10 overflow-hidden bg-mkt-background pb-[var(--mkt-section-pb)] pt-[var(--mkt-section-gap)]"
    >
      <div className="relative mx-auto max-w-mkt-content px-5 sm:px-8">
        <div className="grid grid-cols-12 gap-y-12">
          <div className="col-span-12 order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <ShowcaseSlideRail
              active={active}
              onSelect={setActive}
              onPauseAuto={() => setAutoPaused(true)}
              onResumeAuto={() => setAutoPaused(false)}
            />
          </div>

          <div className="col-span-12 order-1 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <MarketingBlurFade inView>
              <div
                className="relative mx-auto h-[min(420px,62vw)] w-full max-w-[560px] lg:mx-0 lg:max-w-none lg:h-[480px]"
                onMouseEnter={() => setAutoPaused(true)}
                onMouseLeave={() => setAutoPaused(false)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={slide.id}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.25, ease: slideEase }}
                    className="absolute inset-0"
                  >
                    {isShowcaseAnimationId(slide.id) ? (
                      <ShowcaseAnimation id={slide.id} reduced={reduced} />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
            </MarketingBlurFade>
          </div>
        </div>
      </div>
    </section>
  );
}

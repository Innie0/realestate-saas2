'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowRight as CtaArrow } from 'lucide-react';
import { SHOWCASE_NARRATIVE, SHOWCASE_SLIDES, type ShowcaseSlide } from '@/lib/landing-showcase';
import ProductScreenshot from '@/components/home/ProductScreenshot';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

const indicatorSpring = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.8 };
const slideEase = [0.25, 0.1, 0.25, 1] as const;

function ShowcaseSlideDetails({ slide }: { slide: ShowcaseSlide }) {
  return (
    <div className="mt-6 min-h-[180px] pl-5 sm:pl-6">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: slideEase }}
        >
          <p className="max-w-md text-[15px] leading-[1.6]" style={{ color: MKT.textSecondary }}>
            {slide.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {slide.tools.map((tool) => (
              <span
                key={tool}
                className="px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                style={{
                  borderRadius: MKT.radius.button,
                  border: `1px solid ${MKT.border}`,
                  backgroundColor: MKT.surface,
                  color: MKT.textSecondary,
                }}
              >
                {tool}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href="/auth/signup">
              <span
                className="group/btn mkt-cta inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
                style={{ borderRadius: MKT.radius.button }}
              >
                Start free trial
                <CtaArrow className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href={slide.productsHref}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: MKT.textPrimary }}
            >
              Learn more →
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
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const slide = SHOWCASE_SLIDES[active];

  return (
    <div className="lg:py-2">
      <div className="relative">
        <div className="absolute bottom-0 left-0 top-0 w-px" style={{ backgroundColor: MKT.border }} aria-hidden />

        <LayoutGroup id="showcase-rail">
          <div className="flex flex-col pl-5 sm:pl-6">
            {SHOWCASE_SLIDES.map((item, i) => {
              const isActive = i === active;
              return (
                <div key={item.id} className="relative min-h-[4.75rem] sm:min-h-[5rem]">
                  {isActive ? (
                    <motion.div
                      layoutId="showcase-active-indicator"
                      className="absolute bottom-0 left-[-1.25rem] top-0 w-0.5 sm:left-[-1.5rem]"
                      style={{ backgroundColor: MKT.textPrimary }}
                      transition={indicatorSpring}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    className="group w-full py-3 text-left transition-colors lg:py-3.5"
                    style={{ borderRadius: MKT.radius.button }}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <p
                      className="text-[10px] font-medium uppercase tracking-[0.1em] transition-colors duration-200"
                      style={{ color: isActive ? MKT.textSecondary : MKT.muted }}
                    >
                      {item.eyebrow}
                    </p>
                    <h3
                      className={`mt-1.5 text-lg leading-snug tracking-[-0.02em] transition-colors duration-200 sm:text-xl ${
                        isActive ? 'font-medium' : 'font-normal'
                      }`}
                      style={{ color: isActive ? MKT.textPrimary : MKT.muted }}
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
  const slide = SHOWCASE_SLIDES[active];

  return (
    <section
      className="relative z-10 overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: MKT.background }}
    >
      <div className="relative mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <motion.div
          {...mktEnterReveal(reduced)}
          className="mx-auto mb-10 max-w-3xl text-center lg:mb-12"
        >
          <p
            className="mb-3 text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: MKT.textSecondary }}
          >
            {SHOWCASE_NARRATIVE.eyebrow}
          </p>
          <h2
            className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
            style={{ color: MKT.textPrimary }}
          >
            {SHOWCASE_NARRATIVE.headlineLead}
            <span style={{ color: MKT.textSecondary }}>{SHOWCASE_NARRATIVE.headlineFade}</span>
          </h2>
          <p className="mt-5 text-base leading-[1.6]" style={{ color: MKT.textSecondary }}>
            {SHOWCASE_NARRATIVE.subheadline}
          </p>
        </motion.div>

        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
          <motion.div
            {...mktEnterReveal(reduced, 0.06)}
            className="relative order-2 mx-auto w-full max-w-[520px] lg:order-1 lg:mx-0 lg:max-w-none"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25, ease: slideEase }}
              >
                <ProductScreenshot src={slide.screenshot} alt={slide.screenshotAlt} />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div {...mktEnterReveal(reduced, 0.1)} className="order-1 lg:order-2">
            <ShowcaseSlideRail active={active} onSelect={setActive} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

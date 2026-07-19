'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowRight as CtaArrow } from 'lucide-react';
import { SHOWCASE_NARRATIVE, SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import { ShowcaseAnimation } from '@/components/home/showcase-animations/ShowcaseAnimations';
import { useMotionReduced } from '@/lib/motion';

const slideEase = [0.25, 0.1, 0.25, 1] as const;
const slideTransition = { duration: 0.28, ease: slideEase };

const SHOWCASE_DISPLAY_HEIGHT = 'h-[400px] sm:h-[420px]';

function ShowcaseSlideRail({
  active,
  onSelect,
  reduced,
}: {
  active: number;
  onSelect: (index: number) => void;
  reduced: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 lg:justify-center lg:py-2">
      <LayoutGroup>
        {SHOWCASE_SLIDES.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(i)}
              className="group w-full rounded-xl px-1 py-3 text-left transition-colors hover:bg-white/60 lg:px-2 lg:py-4"
              aria-current={isActive ? 'true' : undefined}
            >
              <div className="flex gap-4 sm:gap-5">
                <div className="relative w-px shrink-0 self-stretch bg-gray-200 pt-1">
                  {isActive ? (
                    <motion.div
                      layoutId="showcase-active-indicator"
                      className="absolute inset-y-0 left-0 w-px bg-gray-900"
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 pb-0.5">
                  <p
                    className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
                      isActive ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {item.eyebrow}
                  </p>
                  <h3
                    className={`mt-1.5 tracking-tight transition-colors duration-200 ${
                      isActive
                        ? 'text-xl font-semibold leading-snug text-gray-900 sm:text-2xl'
                        : 'text-base font-medium leading-snug text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {item.headline}
                  </h3>

                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.div
                        key={`${item.id}-details`}
                        initial={reduced ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? undefined : { opacity: 0, y: -4 }}
                        transition={slideTransition}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-700">
                          {item.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tools.map((tool) => (
                            <span
                              key={tool}
                              className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-[10px] font-medium text-gray-600"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                        <div className="mt-5">
                          <Link href="/auth/signup" onClick={(e) => e.stopPropagation()}>
                            <span className="group/btn inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
                              Get Started
                              <CtaArrow className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                            </span>
                          </Link>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

export default function LandingShowcaseCarousel() {
  const reduced = useMotionReduced();
  const [active, setActive] = useState(0);
  const slide = SHOWCASE_SLIDES[active];

  return (
    <section className="relative z-10 overflow-hidden bg-[#F5F5F5] py-16 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center lg:mb-16"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            {SHOWCASE_NARRATIVE.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl lg:leading-[1.12]">
            {SHOWCASE_NARRATIVE.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">{SHOWCASE_NARRATIVE.subheadline}</p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
          <div className={`relative mx-auto w-full max-w-[520px] ${SHOWCASE_DISPLAY_HEIGHT} lg:mx-0 lg:max-w-none`}>
            <AnimatePresence initial={false}>
              <motion.div
                key={slide.id}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -10 }}
                transition={slideTransition}
                className={`absolute inset-0 ${SHOWCASE_DISPLAY_HEIGHT}`}
              >
                <ShowcaseAnimation id={slide.animationId} reduced={reduced} />
              </motion.div>
            </AnimatePresence>
          </div>

          <ShowcaseSlideRail active={active} onSelect={setActive} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}

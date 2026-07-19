'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowRight as CtaArrow } from 'lucide-react';
import { SHOWCASE_NARRATIVE, SHOWCASE_SLIDES, type ShowcaseSlide } from '@/lib/landing-showcase';
import { ShowcaseAnimation } from '@/components/home/showcase-animations/ShowcaseAnimations';
import { useMotionReduced } from '@/lib/motion';

const slideEase = [0.25, 0.1, 0.25, 1] as const;
const indicatorSpring = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.8 };

const SHOWCASE_DISPLAY_HEIGHT = 'h-[400px] sm:h-[420px]';

function ShowcaseSlideDetails({ slide, reduced }: { slide: ShowcaseSlide; reduced: boolean }) {
  return (
    <div className="mt-6 min-h-[220px] pl-5 sm:pl-6">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slide.id}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2, ease: slideEase }}
        >
          <p className="max-w-md text-[15px] leading-relaxed text-gray-700">{slide.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {slide.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {tool}
              </span>
            ))}
          </div>
          <div className="mt-5">
            <Link href="/auth/signup">
              <span className="group/btn inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
                Get Started
                <CtaArrow className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
              </span>
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
  reduced,
}: {
  active: number;
  onSelect: (index: number) => void;
  reduced: boolean;
}) {
  const slide = SHOWCASE_SLIDES[active];

  return (
    <div className="lg:justify-center lg:py-2">
      <div className="relative">
        <div className="absolute bottom-0 left-0 top-0 w-px bg-gray-200" aria-hidden />

        <LayoutGroup id="showcase-rail">
          <div className="flex flex-col pl-5 sm:pl-6">
            {SHOWCASE_SLIDES.map((item, i) => {
              const isActive = i === active;
              return (
                <div key={item.id} className="relative min-h-[4.75rem] sm:min-h-[5rem]">
                  {isActive ? (
                    <motion.div
                      layoutId="showcase-active-indicator"
                      className="absolute bottom-0 left-[-1.25rem] top-0 w-px bg-gray-900 sm:left-[-1.5rem]"
                      transition={indicatorSpring}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    className="group w-full rounded-xl py-3 text-left transition-colors hover:bg-white/60 lg:py-3.5"
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <p
                      className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
                        isActive ? 'text-gray-600' : 'text-gray-400'
                      }`}
                    >
                      {item.eyebrow}
                    </p>
                    <h3
                      className={`mt-1.5 text-lg leading-snug tracking-tight transition-colors duration-200 sm:text-xl ${
                        isActive
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-400 group-hover:text-gray-600'
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

      <ShowcaseSlideDetails slide={slide} reduced={reduced} />
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
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={slide.id}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.22, ease: slideEase }}
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

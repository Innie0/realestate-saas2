'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight as CtaArrow } from 'lucide-react';
import { SHOWCASE_NARRATIVE, SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';

function ShowcaseScreenshot({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300/80 bg-white shadow-[0_24px_56px_-20px_rgba(24,24,27,0.18),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.05]">
      <div className="relative aspect-[4/3] w-full bg-gray-100 sm:aspect-[16/11]">
        {!failed ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 480px, 90vw"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa] px-6 text-center">
            <p className="text-sm text-gray-600">{alt}</p>
          </div>
        )}
      </div>
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
  return (
    <div className="flex flex-col gap-1 lg:justify-center lg:py-2">
      {SHOWCASE_SLIDES.map((item, i) => {
        const isActive = i === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(i)}
            className="group w-full text-left rounded-xl px-1 py-4 transition-colors hover:bg-white/50 lg:px-2"
            aria-current={isActive ? 'true' : undefined}
          >
            <div className="flex gap-4 sm:gap-5">
              {/* Solidroad-style progress line */}
              <div className="flex shrink-0 justify-center pt-1.5">
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'h-full min-h-[3.5rem] w-[3px] bg-gray-900'
                      : 'h-8 w-px bg-gray-300 group-hover:bg-gray-400'
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <p
                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 ${
                    isActive ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {item.eyebrow}
                </p>
                <h3
                  className={`mt-1.5 tracking-tight transition-all duration-300 ${
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
                      key={item.id}
                      initial={reduced ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduced ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-700">
                        {item.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tools.map((tool) => (
                          <span
                            key={tool}
                            className="rounded-full border border-gray-300 bg-white/90 px-2.5 py-0.5 text-[10px] font-medium text-gray-600"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                      <Link href="/auth/signup" className="mt-5 inline-block">
                        <span className="group/btn inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
                          Get Started
                          <CtaArrow className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </span>
                      </Link>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function LandingShowcaseCarousel() {
  const reduced = useMotionReduced();
  const [active, setActive] = useState(0);
  const slide = SHOWCASE_SLIDES[active];

  return (
    <section className="relative z-10 overflow-hidden border-t border-gray-200 py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/landing/hero-mountains.jpg"
          alt=""
          fill
          className="object-cover object-center scale-105 opacity-[0.12] blur-3xl"
          sizes="100vw"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
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

        {/* Solidroad split: visual left, all slides listed right */}
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 xl:gap-16">
          {/* Screenshot — blurred hero mountains backdrop (Solidroad-style) */}
          <div className="relative mx-auto w-full max-w-[480px] lg:mx-0 lg:max-w-none">
            <div className="relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <Image
                  src="/landing/hero-mountains.jpg"
                  alt=""
                  fill
                  className="object-cover object-center scale-110 blur-2xl saturate-[0.9]"
                  sizes="520px"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/35" />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide.id}
                  initial={reduced ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="relative z-10"
                >
                  <ShowcaseScreenshot src={slide.imageSrc} alt={slide.imageAlt} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right rail — all 4 slides visible */}
          <ShowcaseSlideRail active={active} onSelect={setActive} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}

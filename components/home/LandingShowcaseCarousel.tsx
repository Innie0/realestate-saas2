'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowRight as CtaArrow } from 'lucide-react';
import { SHOWCASE_NARRATIVE, SHOWCASE_SLIDES } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';

function ShowcaseScreenshot({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300/80 bg-white shadow-[0_32px_80px_-24px_rgba(24,24,27,0.22),0_0_0_1px_rgba(24,24,27,0.04)] ring-1 ring-gray-900/[0.05]">
      <div className="relative aspect-[16/10] w-full bg-gray-100">
        {!failed ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="(min-width: 1280px) 720px, 90vw"
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

export default function LandingShowcaseCarousel() {
  const reduced = useMotionReduced();
  const [active, setActive] = useState(0);
  const total = SHOWCASE_SLIDES.length;
  const slide = SHOWCASE_SLIDES[active];

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setActive((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(goNext, 8000);
    return () => window.clearInterval(timer);
  }, [goNext, reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  return (
    <section className="relative z-30 -mt-20 overflow-hidden bg-[#F5F5F5] py-24 sm:-mt-24 lg:py-32">
      {/* Soft blurred backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/landing/hero-mountains.jpg"
          alt=""
          fill
          className="object-cover object-center scale-105 opacity-[0.14] blur-3xl"
          sizes="100vw"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-3xl text-center lg:mb-20"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            {SHOWCASE_NARRATIVE.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl lg:leading-[1.12]">
            {SHOWCASE_NARRATIVE.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">{SHOWCASE_NARRATIVE.subheadline}</p>
        </motion.div>

        <div className="relative mx-auto max-w-5xl">
          {/* Product frame with local blur halo */}
          <div className="relative mb-12 lg:mb-14">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] overflow-hidden sm:-inset-8" aria-hidden>
              <Image
                src="/demo-house.png"
                alt=""
                fill
                className="object-cover scale-110 blur-[40px] saturate-[0.85] opacity-60"
                sizes="900px"
              />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={reduced ? false : { opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ShowcaseScreenshot src={slide.imageSrc} alt={slide.imageAlt} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide copy */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                {slide.eyebrow}
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl lg:leading-tight">
                {slide.headline}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-700 sm:text-lg">{slide.description}</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {slide.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-gray-300 bg-white/80 px-3 py-1 text-[11px] font-medium text-gray-700 backdrop-blur-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
              <Link href="/auth/signup" className="mt-8 inline-block">
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  Get Started
                  <CtaArrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </motion.span>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Carousel controls — Solidroad-style fraction + arrows */}
          <div className="mt-12 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 transition-colors hover:bg-gray-50 hover:border-gray-400"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>

            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tabular-nums text-gray-900">{active + 1}</span>
              <span className="text-gray-400">/</span>
              <span className="font-mono text-sm tabular-nums text-gray-500">{total}</span>
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 transition-colors hover:bg-gray-50 hover:border-gray-400"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="mt-6 flex justify-center gap-2">
            {SHOWCASE_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-8 bg-gray-900' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { INTEGRATIONS, TESTIMONIALS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import { useMotionReduced } from '@/lib/motion';

function TestimonialCarousel() {
  const reduced = useMotionReduced();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const testimonial = TESTIMONIALS[testimonialIndex];
  const progress = ((testimonialIndex + 1) / total) * 100;

  const goNext = useCallback(() => {
    setTestimonialIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setTestimonialIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(goNext, 9000);
    return () => window.clearInterval(timer);
  }, [goNext, reduced]);

  return (
    <div className="border-t border-gray-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Progress + navigation */}
        <div className="mb-10 sm:mb-12">
          <div className="h-px w-full bg-gray-200">
            <motion.div
              className="h-px bg-[var(--mkt-accent)]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-sm tabular-nums text-gray-500">
              {testimonialIndex + 1}/{total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous testimonial"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next testimonial"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={testimonial.id}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p className="mb-6 flex items-center gap-1 text-sm text-gray-600 sm:mb-8 sm:text-[15px]">
              {testimonial.role}
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
            </p>

            <blockquote className="max-w-4xl font-display text-[1.65rem] font-normal leading-[1.35] tracking-[-0.01em] text-gray-900 sm:text-3xl lg:text-[2.125rem] lg:leading-[1.32]">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>

            <div className="mt-12 grid gap-8 border-t border-gray-200 pt-8 sm:mt-14 sm:pt-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-0">
              <div className="md:border-r md:border-gray-200 md:pr-10 lg:pr-12">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                    {testimonial.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="mt-0.5 text-sm leading-snug text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>

              <div className="md:border-r md:border-gray-200 md:px-10 lg:px-12">
                <p className="text-4xl font-semibold tabular-nums tracking-tight text-gray-900 sm:text-5xl">
                  {testimonial.metric}
                </p>
                <p className="mt-2 max-w-[12rem] text-sm leading-snug text-gray-600">{testimonial.metricLabel}</p>
              </div>

              <div className="md:pl-10 lg:pl-12">
                <p className="text-4xl font-semibold tabular-nums tracking-tight text-gray-900 sm:text-5xl">
                  {testimonial.metric2}
                </p>
                <p className="mt-2 max-w-[12rem] text-sm leading-snug text-gray-600">{testimonial.metricLabel2}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LandingTrustSection() {
  const reduced = useMotionReduced();

  return (
    <section className="relative z-10 bg-[#F5F5F5]">
      <TestimonialCarousel />

      {/* Integrations */}
      <div className="border-t border-gray-200 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
              Integrations
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              Built to fit your stack
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-700">
              Oikaro connects to the tools you already use and keeps your pipeline flowing across every channel.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INTEGRATIONS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 shadow-sm">
                  <IntegrationLogo id={item.id} className="h-7 w-7" />
                </div>
                <p className="text-[15px] font-semibold text-gray-900">{item.name}</p>
                <p className="mt-1.5 text-[13px] text-gray-700">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden border-t border-gray-200 py-10 pb-20 sm:pb-24">
        {reduced ? (
          <p className="mx-auto max-w-3xl px-6 text-center text-lg font-medium tracking-tight text-gray-800">
            Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.
          </p>
        ) : (
          <div className="animate-marquee flex whitespace-nowrap">
            {[0, 1].map((copy) => (
              <p
                key={copy}
                aria-hidden={copy === 1}
                className="mx-8 shrink-0 text-lg font-medium tracking-tight text-gray-800 sm:text-xl"
              >
                Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

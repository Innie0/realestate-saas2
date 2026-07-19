'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { INTEGRATIONS, TESTIMONIALS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import { useMotionReduced } from '@/lib/motion';

export default function LandingTrustSection() {
  const reduced = useMotionReduced();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const testimonial = TESTIMONIALS[testimonialIndex];

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
    <section className="relative z-10 border-t border-gray-200 bg-[#F5F5F5]">
      {/* Testimonials */}
      <div className="py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="mb-10 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600"
            >
              Trusted by agents
            </motion.p>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={testimonial.id}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <span
                  className="pointer-events-none mb-6 block font-display text-5xl leading-none text-brand-500/25 sm:text-6xl"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <blockquote className="text-2xl font-medium leading-snug tracking-tight text-gray-900 sm:text-3xl lg:text-4xl lg:leading-[1.2]">
                  {testimonial.quote}
                </blockquote>
                <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
                  <div className="flex items-center gap-3 sm:text-left">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {testimonial.initials}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-700">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="hidden h-10 w-px bg-gray-200 sm:block" aria-hidden />
                  <div className="text-center">
                    <p className="text-4xl font-semibold tabular-nums tracking-tight text-gray-900 sm:text-5xl">
                      {testimonial.metric}
                    </p>
                    <p className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-gray-600">
                      {testimonial.metricLabel}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-col items-center gap-5">
              <div className="flex items-center justify-center gap-2">
                {TESTIMONIALS.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTestimonialIndex(i)}
                    aria-label={`Show testimonial ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === testimonialIndex
                        ? 'w-6 bg-brand-500'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous testimonial"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <span className="font-mono text-sm tabular-nums text-gray-600">
                  {testimonialIndex + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next testimonial"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

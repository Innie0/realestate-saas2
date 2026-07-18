'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import {
  INTEGRATIONS,
  PERSONA_CARDS,
  PERSONA_ICONS,
  TESTIMONIALS,
} from '@/lib/landing-showcase';
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
    <>
      {/* Testimonial carousel — Solidroad-style */}
      <section className="relative z-10 border-t border-gray-200 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={testimonial.id}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <blockquote className="text-2xl font-medium leading-snug tracking-tight text-gray-900 sm:text-3xl lg:text-4xl lg:leading-[1.2]">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-700">{testimonial.role}</p>
                  </div>
                  <div className="hidden h-10 w-px bg-gray-200 sm:block" aria-hidden />
                  <div className="text-center">
                    <p className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900">
                      {testimonial.metric}
                    </p>
                    <p className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-gray-600">
                      {testimonial.metricLabel}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-center gap-6">
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
      </section>

      {/* Persona cards — Taito-style */}
      <section className="relative z-10 border-t border-gray-200 bg-[#fafafa] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mb-14 text-center lg:mb-16"
          >
            <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
              Built for agents
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              However you run your business
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PERSONA_CARDS.map((persona, i) => {
              const Icon = PERSONA_ICONS[persona.id] ?? ArrowUpRight;
              return (
                <motion.div
                  key={persona.id}
                  initial={reduced ? false : { opacity: 0, y: 24 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-7 transition-colors hover:border-gray-300"
                >
                  <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                    {persona.label}
                  </p>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-[#fafafa] text-gray-900">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-gray-900">{persona.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-gray-700">{persona.description}</p>
                  <Link
                    href="/for-agents"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 transition-colors group-hover:text-brand-600"
                  >
                    Learn more
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations strip */}
      <section className="relative z-10 border-t border-gray-200 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
                key={item.name}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-center"
              >
                <p className="text-[15px] font-semibold text-gray-900">{item.name}</p>
                <p className="mt-1.5 text-[13px] text-gray-700">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee-style value line — Solidroad repeating headline */}
      <section className="relative z-10 overflow-hidden border-t border-gray-200 bg-gray-900 py-10">
        {reduced ? (
          <p className="mx-auto max-w-3xl px-6 text-center text-lg font-medium tracking-tight text-white/90">
            Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.
          </p>
        ) : (
          <div className="animate-marquee flex whitespace-nowrap">
            {[0, 1].map((copy) => (
              <p
                key={copy}
                aria-hidden={copy === 1}
                className="mx-8 shrink-0 text-lg font-medium tracking-tight text-white/90 sm:text-xl"
              >
                Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
              </p>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

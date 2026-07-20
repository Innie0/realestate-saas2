'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { INTEGRATIONS, TESTIMONIALS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import LandingManifestoBand from '@/components/home/LandingManifestoBand';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
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
    <div
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: MKT.surface }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <div className="mb-10 sm:mb-12">
          <div className="h-px w-full" style={{ backgroundColor: MKT.border }}>
            <motion.div
              className="h-px"
              style={{ backgroundColor: MKT.textPrimary }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm tabular-nums" style={{ color: MKT.textSecondary }}>
              {testimonialIndex + 1}/{total}
            </span>
            <div className="flex items-center gap-2">
              {[
                { label: 'Previous testimonial', onClick: goPrev, icon: ArrowLeft },
                { label: 'Next testimonial', onClick: goNext, icon: ArrowRight },
              ].map(({ label, onClick, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-white/[0.06]"
                  style={{
                    borderRadius: MKT.radius.button,
                    border: `1px solid ${MKT.border}`,
                    backgroundColor: MKT.surface,
                    color: MKT.textPrimary,
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={testimonial.id}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p
              className="mb-6 flex items-center gap-1 text-sm sm:mb-8 sm:text-[15px]"
              style={{ color: MKT.textSecondary }}
            >
              {testimonial.role}
              <ChevronRight className="h-3.5 w-3.5" style={{ color: MKT.muted }} strokeWidth={2} />
            </p>

            <blockquote
              className="max-w-4xl text-[1.65rem] font-medium leading-[1.35] tracking-[-0.02em] sm:text-3xl lg:text-[2.125rem] lg:leading-[1.32]"
              style={{ color: MKT.textPrimary }}
            >
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>

            <div
              className="mt-12 grid gap-8 border-t pt-8 sm:mt-14 sm:pt-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-0"
              style={{ borderColor: MKT.border }}
            >
              <div className="md:border-r md:pr-10 lg:pr-12" style={{ borderColor: MKT.border }}>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-xs font-semibold"
                    style={{
                      borderRadius: MKT.radius.card,
                      backgroundColor: MKT.background,
                      color: MKT.textPrimary,
                    }}
                  >
                    {testimonial.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: MKT.textPrimary }}>
                      {testimonial.name}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug" style={{ color: MKT.textSecondary }}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:border-r md:px-10 lg:px-12" style={{ borderColor: MKT.border }}>
                <p
                  className="text-4xl font-medium tabular-nums tracking-tight sm:text-5xl"
                  style={{ color: MKT.textPrimary }}
                >
                  {testimonial.metric}
                </p>
                <p className="mt-2 max-w-[12rem] text-sm leading-snug" style={{ color: MKT.textSecondary }}>
                  {testimonial.metricLabel}
                </p>
              </div>

              <div className="md:pl-10 lg:pl-12">
                <p
                  className="text-4xl font-medium tabular-nums tracking-tight sm:text-5xl"
                  style={{ color: MKT.textPrimary }}
                >
                  {testimonial.metric2}
                </p>
                <p className="mt-2 max-w-[12rem] text-sm leading-snug" style={{ color: MKT.textSecondary }}>
                  {testimonial.metricLabel2}
                </p>
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
    <section className="relative z-10">
      <TestimonialCarousel />
      <LandingManifestoBand />

      <div
        className="py-20 lg:py-24"
        style={{ backgroundColor: MKT.surface }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
          <motion.div {...mktEnterReveal(reduced)} className="mb-12 text-center">
            <p
              className="mb-4 text-xs font-medium uppercase tracking-[0.12em]"
              style={{ color: MKT.textSecondary }}
            >
              Integrations
            </p>
            <h2
              className="font-sans text-2xl font-medium tracking-[-0.02em] sm:text-3xl lg:text-4xl"
              style={{ color: MKT.textPrimary }}
            >
              Built to fit your stack
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-[1.6]" style={{ color: MKT.textSecondary }}>
              Oikaro connects to the tools you already use and keeps your pipeline flowing across every channel.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INTEGRATIONS.map((item, i) => (
              <motion.div
                key={item.id}
                {...mktEnterReveal(reduced, i * 0.05)}
                className="px-6 py-5 text-center"
                style={{
                  borderRadius: MKT.radius.card,
                  border: `1px solid ${MKT.border}`,
                  backgroundColor: MKT.surface,
                }}
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center"
                  style={{ borderRadius: MKT.radius.button, backgroundColor: MKT.background }}
                >
                  <IntegrationLogo id={item.id} className="h-7 w-7" />
                </div>
                <p className="text-[15px] font-medium" style={{ color: MKT.textPrimary }}>
                  {item.name}
                </p>
                <p className="mt-1.5 text-[13px] leading-[1.5]" style={{ color: MKT.textSecondary }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

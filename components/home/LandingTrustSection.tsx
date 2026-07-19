'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { INTEGRATIONS, TESTIMONIALS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import { useMotionReduced } from '@/lib/motion';

const LIGHT_BG = '#F5F5F5';
const DARK_BG = '#0a0a0a';

const LandingTrustSection = forwardRef<HTMLElement>(function LandingTrustSection(_props, forwardedRef) {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLElement>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const total = TESTIMONIALS.length;
  const testimonial = TESTIMONIALS[testimonialIndex];

  useImperativeHandle(forwardedRef, () => sectionRef.current as HTMLElement);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 0.3'],
  });

  const { scrollYProgress: exitProgress } = useScroll({
    target: sectionRef,
    offset: ['end 0.92', 'end 0.12'],
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [DARK_BG, DARK_BG] : [LIGHT_BG, DARK_BG],
  );

  const bottomFadeOpacity = useTransform(exitProgress, [0, 0.18, 1], [0, 1, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setIsDark(reduced ? true : latest > 0.42);
  });

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

  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-white/70' : 'text-gray-700';
  const textMuted = isDark ? 'text-white/50' : 'text-gray-600';
  const textEyebrow = isDark ? 'text-white/55' : 'text-gray-600';
  const divider = isDark ? 'bg-white/20' : 'bg-gray-200';
  const navBtn = isDark
    ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50';
  const dotActive = 'bg-brand-500';
  const dotInactive = isDark ? 'bg-white/25 hover:bg-white/40' : 'bg-gray-300 hover:bg-gray-400';
  const cardClass = isDark
    ? 'rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 backdrop-blur-sm'
    : 'rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm';

  return (
    <motion.section
      ref={sectionRef}
      style={{ backgroundColor: reduced ? DARK_BG : backgroundColor }}
      className="relative z-10 border-t border-gray-200 transition-[color] duration-700"
    >
      {reduced ? (
        <div
          aria-hidden
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, #1c1c1c 22%, #4a4a4a 42%, #9a9a9a 62%, #d6d6d6 80%, #F5F5F5 100%)',
          }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 sm:h-56"
        />
      ) : (
        <motion.div
          aria-hidden
          style={{
            opacity: bottomFadeOpacity,
            background:
              'linear-gradient(180deg, transparent 0%, #1c1c1c 22%, #4a4a4a 42%, #9a9a9a 62%, #d6d6d6 80%, #F5F5F5 100%)',
          }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(32vh,280px)] sm:h-[min(34vh,320px)]"
        />
      )}
      {/* Testimonials */}
      <div className="py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className={`mb-10 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-700 ${textEyebrow}`}
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
                  className={`pointer-events-none mb-6 block font-display text-5xl leading-none transition-colors duration-700 sm:text-6xl ${
                    isDark ? 'text-brand-500/40' : 'text-brand-500/25'
                  }`}
                  aria-hidden
                >
                  &ldquo;
                </span>
                <blockquote
                  className={`text-2xl font-medium leading-snug tracking-tight transition-colors duration-700 sm:text-3xl lg:text-4xl lg:leading-[1.2] ${textPrimary}`}
                >
                  {testimonial.quote}
                </blockquote>
                <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
                  <div className="flex items-center gap-3 sm:text-left">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-700 ${
                        isDark ? 'bg-brand-500/20 text-brand-300' : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      {testimonial.initials}
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold transition-colors duration-700 ${textPrimary}`}>
                        {testimonial.name}
                      </p>
                      <p className={`text-sm transition-colors duration-700 ${textSecondary}`}>
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <div className={`hidden h-10 w-px transition-colors duration-700 sm:block ${divider}`} aria-hidden />
                  <div className="text-center">
                    <p
                      className={`text-4xl font-semibold tabular-nums tracking-tight transition-colors duration-700 sm:text-5xl ${textPrimary}`}
                    >
                      {testimonial.metric}
                    </p>
                    <p
                      className={`mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-colors duration-700 ${textMuted}`}
                    >
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
                      i === testimonialIndex ? `w-6 ${dotActive}` : `w-2 ${dotInactive}`
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous testimonial"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-700 ${navBtn}`}
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <span className={`font-mono text-sm tabular-nums transition-colors duration-700 ${textMuted}`}>
                  {testimonialIndex + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next testimonial"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-700 ${navBtn}`}
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className={`border-t py-20 transition-colors duration-700 lg:py-24 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <p
              className={`mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-700 ${textEyebrow}`}
            >
              Integrations
            </p>
            <h2
              className={`text-2xl font-semibold tracking-tight transition-colors duration-700 sm:text-3xl lg:text-4xl ${textPrimary}`}
            >
              Built to fit your stack
            </h2>
            <p className={`mx-auto mt-4 max-w-xl transition-colors duration-700 ${textSecondary}`}>
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
                className={`${cardClass} text-center transition-colors duration-700`}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 shadow-sm">
                  <IntegrationLogo id={item.id} className="h-7 w-7" />
                </div>
                <p className={`text-[15px] font-semibold transition-colors duration-700 ${textPrimary}`}>
                  {item.name}
                </p>
                <p className={`mt-1.5 text-[13px] transition-colors duration-700 ${textSecondary}`}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className={`relative z-[2] overflow-hidden border-t py-10 pb-20 transition-colors duration-700 sm:pb-24 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        {reduced ? (
          <p className={`mx-auto max-w-3xl px-6 text-center text-lg font-medium tracking-tight transition-colors duration-700 ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
            Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.
          </p>
        ) : (
          <div className="animate-marquee flex whitespace-nowrap">
            {[0, 1].map((copy) => (
              <p
                key={copy}
                aria-hidden={copy === 1}
                className={`mx-8 shrink-0 text-lg font-medium tracking-tight transition-colors duration-700 sm:text-xl ${isDark ? 'text-white/90' : 'text-gray-800'}`}
              >
                Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one AI-powered workspace.&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
});

export default LandingTrustSection;

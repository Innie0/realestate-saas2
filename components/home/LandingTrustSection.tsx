'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { INTEGRATIONS, TESTIMONIALS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import CountUpMetric from '@/components/home/CountUpMetric';
import HoverMotionCard from '@/components/home/HoverMotionCard';
import LandingManifestoBand from '@/components/home/LandingManifestoBand';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import { bindHoverMotion } from '@/lib/landing-motion';
import { MKT } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

function TestimonialCarousel() {
  const reduced = useMotionReduced();
  const [index, setIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const total = TESTIMONIALS.length;
  const testimonial = TESTIMONIALS[index];

  const goNext = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(goNext, 10000);
    return () => window.clearInterval(timer);
  }, [goNext, reduced]);

  useGSAP(
    () => {
      if (reduced || !contentRef.current) return;
      const parts = contentRef.current.querySelectorAll('[data-testimonial-part]');
      gsap.fromTo(
        parts,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: landingRevealDefaults.duration,
          stagger: 0.06,
          ease: landingRevealDefaults.ease,
        },
      );
    },
    { scope: contentRef, dependencies: [index, reduced] },
  );

  return (
    <div className="border-t py-24 sm:py-28 lg:py-32" style={{ borderColor: MKT.border }}>
      <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <div className="mb-10 flex items-end justify-between gap-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: MKT.textSecondary }}>
            From agents
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums" style={{ color: MKT.textSecondary }}>
              {index + 1} / {total}
            </span>
            <NavArrowButton label="Previous testimonial" onClick={goPrev}>
              ←
            </NavArrowButton>
            <NavArrowButton label="Next testimonial" onClick={goNext}>
              →
            </NavArrowButton>
          </div>
        </div>

        <div ref={contentRef}>
          <blockquote
            data-testimonial-part
            className="font-display max-w-3xl text-2xl font-medium leading-[1.32] tracking-[-0.03em] sm:text-3xl lg:text-[2rem]"
            style={{ color: MKT.textPrimary }}
          >
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>

          <div
            className="mt-12 grid gap-8 border-t pt-8 sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-0 sm:pt-10"
            style={{ borderColor: MKT.border }}
          >
            <div data-testimonial-part className="sm:border-r sm:pr-10" style={{ borderColor: MKT.border }}>
              <p className="text-sm font-medium" style={{ color: MKT.textPrimary }}>
                {testimonial.name}
              </p>
              <p className="mt-1 text-sm leading-snug" style={{ color: MKT.textSecondary }}>
                {testimonial.role}
              </p>
            </div>
            <div data-testimonial-part className="sm:border-r sm:px-10" style={{ borderColor: MKT.border }}>
              <CountUpMetric
                key={`${testimonial.id}-m1`}
                value={testimonial.metric}
                trigger="mount"
                className="text-3xl font-medium tabular-nums tracking-tight"
                style={{ color: MKT.textPrimary }}
              />
              <p className="mt-1 text-sm" style={{ color: MKT.textSecondary }}>
                {testimonial.metricLabel}
              </p>
            </div>
            <div data-testimonial-part className="sm:pl-10">
              <CountUpMetric
                key={`${testimonial.id}-m2`}
                value={testimonial.metric2}
                trigger="mount"
                className="text-3xl font-medium tabular-nums tracking-tight"
                style={{ color: MKT.textPrimary }}
              />
              <p className="mt-1 text-sm" style={{ color: MKT.textSecondary }}>
                {testimonial.metricLabel2}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      return bindHoverMotion(ref.current, { scale: 1.04, y: -1, duration: 0.22 });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center border text-sm"
      style={{ borderColor: MKT.border, borderRadius: 6, color: MKT.textPrimary, backgroundColor: MKT.surface }}
    >
      {children}
    </button>
  );
}

export default function LandingTrustSection() {
  return (
    <section style={{ backgroundColor: MKT.background }}>
      <TestimonialCarousel />
      <LandingManifestoBand />

      <div className="border-t py-24 sm:py-28 lg:py-32" style={{ borderColor: MKT.border }}>
        <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
          <LandingStaggerReveal className="mb-14 max-w-xl">
            <p data-reveal className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: MKT.textSecondary }}>
              Integrations
            </p>
            <h2
              data-reveal
              className="font-display mt-4 text-2xl font-medium tracking-[-0.03em] sm:text-3xl"
              style={{ color: MKT.textPrimary }}
            >
              Fits the tools you already use
            </h2>
            <p data-reveal className="mt-4 text-base leading-[1.65]" style={{ color: MKT.textSecondary }}>
              Connect calendars and ad accounts without rebuilding your workflow from scratch.
            </p>
          </LandingStaggerReveal>

          <div
            className="grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-4"
            style={{ borderColor: MKT.border, backgroundColor: MKT.border }}
          >
            {INTEGRATIONS.map((item) => (
              <HoverMotionCard
                key={item.id}
                className="flex flex-col gap-4 px-6 py-8"
                style={{ backgroundColor: MKT.surface }}
              >
                <div
                  className="flex size-11 items-center justify-center"
                  style={{ borderRadius: 8, backgroundColor: MKT.surfaceMuted }}
                >
                  <IntegrationLogo id={item.id} className="size-6" />
                </div>
                <div>
                  <p className="text-[15px] font-medium" style={{ color: MKT.textPrimary }}>
                    {item.name}
                  </p>
                  <p className="mt-1.5 text-sm leading-[1.55]" style={{ color: MKT.textSecondary }}>
                    {item.description}
                  </p>
                </div>
              </HoverMotionCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

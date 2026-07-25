'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { INTEGRATIONS, TESTIMONIALS } from '@/lib/landing-showcase';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import CountUpMetric from '@/components/home/CountUpMetric';
import LandingGradientPanel from '@/components/home/LandingGradientPanel';
import LandingManifestoBand from '@/components/home/LandingManifestoBand';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import { bindHoverMotion } from '@/lib/landing-motion';
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
    <div className="border-t border-mkt-border py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-mkt-foreground sm:text-4xl">
            Customer testimonials
          </h2>
          <p className="mt-3 text-base text-mkt-secondary">Real results. Real agents.</p>
        </div>

        <div className="mb-8 flex items-center justify-end gap-2">
          <span className="text-sm tabular-nums text-mkt-secondary">
            {index + 1} / {total}
          </span>
          <NavArrowButton label="Previous testimonial" onClick={goPrev}>
            ←
          </NavArrowButton>
          <NavArrowButton label="Next testimonial" onClick={goNext}>
            →
          </NavArrowButton>
        </div>

        <div
          ref={contentRef}
          className="rounded-[1.5rem] border border-mkt-border bg-mkt-surface p-8 sm:p-10 lg:p-12"
        >
          <blockquote
            data-testimonial-part
            className="font-display max-w-3xl text-2xl font-bold leading-[1.32] tracking-[-0.03em] text-mkt-foreground sm:text-3xl lg:text-[2rem]"
          >
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>

          <div className="mt-10 grid gap-8 border-t border-mkt-border pt-8 sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-0 sm:pt-10">
            <div data-testimonial-part className="sm:border-r sm:border-mkt-border sm:pr-10">
              <p className="text-sm font-semibold text-mkt-foreground">{testimonial.name}</p>
              <p className="mt-1 text-sm leading-snug text-mkt-secondary">{testimonial.role}</p>
            </div>
            <div data-testimonial-part className="sm:border-r sm:border-mkt-border sm:px-10">
              <CountUpMetric
                key={`${testimonial.id}-m1`}
                value={testimonial.metric}
                trigger="mount"
                className="text-3xl font-bold tabular-nums tracking-tight text-mkt-foreground"
              />
              <p className="mt-1 text-sm text-mkt-secondary">{testimonial.metricLabel}</p>
            </div>
            <div data-testimonial-part className="sm:pl-10">
              <CountUpMetric
                key={`${testimonial.id}-m2`}
                value={testimonial.metric2}
                trigger="mount"
                className="text-3xl font-bold tabular-nums tracking-tight text-mkt-foreground"
              />
              <p className="mt-1 text-sm text-mkt-secondary">{testimonial.metricLabel2}</p>
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
      className="flex size-9 items-center justify-center rounded-full border border-mkt-border bg-mkt-surface text-sm text-mkt-foreground"
    >
      {children}
    </button>
  );
}

export default function LandingTrustSection() {
  return (
    <section className="bg-mkt-background">
      <TestimonialCarousel />
      <LandingManifestoBand />

      <div className="border-t border-mkt-border py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
          <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
            <h2
              data-reveal
              className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-mkt-foreground"
            >
              Connect your tools
            </h2>
            <p data-reveal className="mt-4 text-base leading-[1.65] text-mkt-secondary sm:text-[17px]">
              Oikaro works with the calendars and ad platforms you already use — no rebuilding your
              workflow from scratch.
            </p>
            <div data-reveal className="mt-8">
              <MarketingButton href="/auth/signup" variant="dark" size="lg">
                Start free trial
              </MarketingButton>
            </div>
          </LandingStaggerReveal>

          <LandingStaggerReveal className="mt-12 sm:mt-16">
            <div data-reveal>
              <LandingGradientPanel
                variant="integrations"
                className="shadow-[0_40px_100px_-40px_rgba(53,72,199,0.4)]"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
                  {INTEGRATIONS.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-[1.25rem] border border-white/20 bg-white/95 p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-7"
                    >
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-mkt-surface-muted">
                        <IntegrationLogo id={item.id} className="size-7" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-mkt-foreground">{item.name}</p>
                        <p className="mt-2 text-sm leading-[1.55] text-mkt-secondary">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-auto pt-2">
                        <span className="inline-flex rounded-full bg-mkt-accent px-4 py-2 text-xs font-semibold text-white">
                          Connect
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </LandingGradientPanel>
            </div>
          </LandingStaggerReveal>
        </div>
      </div>
    </section>
  );
}

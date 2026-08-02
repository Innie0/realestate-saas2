'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import { SITE_DOMAIN, SITE_NAME } from '@/lib/site-config';
import { useMotionReduced } from '@/lib/motion';

const STICKY_TOP = 120;
const SEGMENT = 1 / 3;

const STEPS = [
  {
    kicker: 'LISTINGS',
    title: 'Draft listings that sell',
    body: 'Upload the photos, pick a tone, and get MLS-ready copy plus social captions in seconds. Edit inline until it sounds like you.',
    src: '/landing/projects.png',
    url: `${SITE_DOMAIN}/dashboard/projects`,
    label: '01 Listings',
  },
  {
    kicker: 'LEADS',
    title: 'Know who to call first',
    body: 'Every form fill and open-house sign-in lands in one inbox, scored hot to cold, with the property and timeline attached.',
    src: '/landing/leads-inbox.png',
    url: `${SITE_DOMAIN}/dashboard/leads`,
    label: '02 Leads',
  },
  {
    kicker: 'TRANSACTIONS',
    title: 'Nothing slips before closing',
    body: 'Checklists, documents, and deadline reminders on every deal — so the week before closing stops being a scramble.',
    src: '/landing/transactions.png',
    url: `${SITE_DOMAIN}/dashboard/transactions`,
    label: '03 Transactions',
  },
] as const;

function StickyPreview({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-gradient-to-b from-[#E6F0FE] to-[#CFE3FE] p-5">
      <div className="relative h-[260px] w-full">
        {STEPS.map((step, index) => (
          <ScreenshotPanel
            key={step.kicker}
            src={step.src}
            alt={step.title}
            url={step.url}
            active={activeIndex === index}
          />
        ))}
      </div>
    </div>
  );
}

function ScreenshotPanel({
  src,
  alt,
  url,
  active,
}: {
  src: string;
  alt: string;
  url: string;
  active: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="absolute inset-0 motion-reduce:transition-none"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(20px)',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: active ? 2 : 1,
        transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <BrowserWindowFrame className="shadow-[var(--mkt-shadow-soft)]">
        <div className="border-b border-mkt-border bg-white px-3 py-1.5">
          <p className="truncate font-mkt-mono text-[11px] text-[#6B6D76]">{url}</p>
        </div>
        <div className="relative h-[196px] w-full bg-white">
          {!failed ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 480px, 100vw"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
              <p className="mb-2 font-mkt-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#6B6D76]">
                Screenshot
              </p>
              <p className="max-w-[220px] text-sm font-medium text-[#111111]">{alt}</p>
              <p className="mt-2 text-[11px] text-[#6B6D76]">Replace PNG in public/landing/</p>
            </div>
          )}
        </div>
      </BrowserWindowFrame>
    </div>
  );
}

function ProgressRow({
  label,
  progress,
  isFirst = false,
}: {
  label: string;
  progress: number;
  isFirst?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-6 border-t border-[#EAEAEA] py-3.5 ${isFirst ? 'border-t-0' : ''}`}
    >
      <span className="shrink-0 text-[15px] font-medium text-[#111111]">{label}</span>
      <div className="h-[2px] min-w-[80px] flex-1 overflow-hidden rounded-full bg-[#EAEAEA] sm:min-w-[130px]">
        <div
          className="h-full origin-left rounded-full bg-[#0668E1] transition-transform duration-150 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}

function StaticStepRow({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="grid gap-8 border-t border-[#EAEAEA] py-12 first:border-t-0 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
          {step.kicker}
        </p>
        <h3 className="mt-4 text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#111111]">
          {step.title}
        </h3>
        <p className="mt-4 text-[18px] leading-[1.55] text-[#6B6D76]">{step.body}</p>
      </div>
      <div className="overflow-hidden rounded-[20px] bg-gradient-to-b from-[#E6F0FE] to-[#CFE3FE] p-4">
        <div className="relative h-[248px]">
          <ScreenshotPanel src={step.src} alt={step.title} url={step.url} active />
        </div>
      </div>
    </div>
  );
}

export default function LandingWhySwitcher() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [scrollProg, setScrollProg] = useState(0);

  const updateFromScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const triggerY = window.innerHeight * 0.38;
    let nextActive = 0;

    stepRefs.current.forEach((el, index) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= triggerY) nextActive = index;
    });

    const first = stepRefs.current[0];
    const last = stepRefs.current[STEPS.length - 1];
    if (first && last) {
      const sectionTop = first.getBoundingClientRect().top;
      const sectionBottom = last.getBoundingClientRect().bottom;
      const span = Math.max(sectionBottom - sectionTop, 1);
      const progress = (triggerY - sectionTop) / span;
      setScrollProg(Math.min(1, Math.max(0, progress)));
    }

    setActive(nextActive);
  }, []);

  useEffect(() => {
    if (reduced) return;

    updateFromScroll();
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    return () => {
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
    };
  }, [reduced, updateFromScroll]);

  const segProgress = (index: number) =>
    Math.min(1, Math.max(0, (scrollProg - index * SEGMENT) / SEGMENT));

  return (
    <section className="bg-white text-[#111111]">
      <div className="mx-auto max-w-mkt-content px-5 pb-12 pt-20 sm:px-8 sm:pb-16 lg:pt-24">
        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
          WHY {SITE_NAME.toUpperCase()}
        </p>
        <h2
          className="mt-4 max-w-[22ch] font-semibold leading-[1.06] tracking-[-0.045em] text-[#111111]"
          style={{ fontSize: 'clamp(40px, 5vw, 60px)' }}
        >
          {SITE_NAME} is your real estate workspace
        </h2>
        <p className="mt-5 max-w-[46ch] text-[20px] leading-[1.55] text-[#6B6D76]">
          From first inquiry to closing day, {SITE_NAME} is where solo agents run the work that
          usually eats the evening.
        </p>
      </div>

      {reduced ? (
        <div className="mx-auto max-w-mkt-content px-5 pb-20 sm:px-8">
          {STEPS.map((step) => (
            <StaticStepRow key={step.kicker} step={step} />
          ))}
        </div>
      ) : (
        <div ref={sectionRef} className="mx-auto max-w-mkt-content px-5 pb-24 sm:px-8">
          {/* Flex + stretch keeps the right rail as tall as the left scroll column. */}
          <div className="lg:flex lg:items-stretch lg:gap-14">
            <div className="min-w-0 flex-1">
              {STEPS.map((step, index) => (
                <article
                  key={step.kicker}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  className="flex min-h-[70vh] flex-col justify-center py-16 lg:min-h-[75vh] lg:py-20"
                >
                  <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
                    {step.kicker}
                  </p>
                  <h3 className="mt-4 max-w-[18ch] text-[clamp(28px,3.2vw,40px)] font-semibold leading-[1.08] tracking-[-0.035em] text-[#111111]">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-[42ch] text-[18px] leading-[1.55] text-[#6B6D76]">
                    {step.body}
                  </p>

                  <div className="mt-8 lg:hidden">
                    <StickyPreview activeIndex={index} />
                  </div>
                </article>
              ))}

              <div className="border-t border-[#EAEAEA] pt-2 lg:pb-8">
                {STEPS.map((step, index) => (
                  <ProgressRow
                    key={step.kicker}
                    label={step.label}
                    progress={segProgress(index)}
                    isFirst={index === 0}
                  />
                ))}
              </div>
            </div>

            <div className="relative hidden w-full max-w-[480px] shrink-0 lg:block lg:w-[46%]">
              <div className="sticky" style={{ top: STICKY_TOP }}>
                <StickyPreview activeIndex={active} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

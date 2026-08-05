'use client';

import { useRef, useState } from 'react';
import { LandingLeadsDemo } from '@/components/home/LandingLeadsDemo';
import { LandingListingDemo } from '@/components/home/LandingListingDemo';
import { LandingTransactionsDemo } from '@/components/home/LandingTransactionsDemo';
import { PREVIEW_CARD_HEIGHT, PREVIEW_MAX_WIDTH } from '@/components/ui/background-gradient-glow';
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { SITE_NAME } from '@/lib/site-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

const STICKY_TOP = 120;
const SEGMENT = 1 / 3;
const STEP_SLOT = 228;

function getScrollTravel() {
  if (typeof window === 'undefined') return 960;
  return Math.round(window.innerHeight * 1);
}

const STEPS = [
  {
    kicker: 'LISTINGS',
    title: 'Draft listings that sell',
    body: 'Upload the photos, pick a tone, and get MLS-ready copy plus social captions in seconds. Edit inline until it sounds like you.',
    label: '01 Listings',
    glow: 'listings' as const,
  },
  {
    kicker: 'LEADS',
    title: 'Know who to call first',
    body: 'Every form fill and open-house sign-in lands in one inbox, scored hot to cold, with the property and timeline attached.',
    label: '02 Leads',
    glow: 'leads' as const,
  },
  {
    kicker: 'TRANSACTIONS',
    title: 'Nothing slips before closing',
    body: 'Checklists, documents, and deadline reminders on every deal — so the week before closing stops being a scramble.',
    label: '03 Transactions',
    glow: 'transactions' as const,
  },
] as const;

const DEMOS: Record<(typeof STEPS)[number]['glow'], () => React.JSX.Element> = {
  listings: LandingListingDemo,
  leads: LandingLeadsDemo,
  transactions: LandingTransactionsDemo,
};

/** Illustrated feature card — built from real UI elements, not a screenshot. */
function FeaturePanel({
  active,
  glow,
}: {
  active: boolean;
  glow: (typeof STEPS)[number]['glow'];
}) {
  const Demo = DEMOS[glow];

  return (
    <div
      className="absolute inset-0 motion-reduce:transition-none"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: active ? 2 : 1,
        transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <Demo />
      </div>
    </div>
  );
}

/** Scroll-progress step nav — tracks how far you've scrolled through each of
 *  the 3 pinned steps; the active step is bold/dark, others are muted. */
function ProgressRow({
  label,
  progress,
  active,
  isFirst = false,
}: {
  label: string;
  progress: number;
  active: boolean;
  isFirst?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-6 border-t border-[#EAEAEA] py-3 ${isFirst ? 'border-t-0' : ''}`}
    >
      <span
        className={`shrink-0 whitespace-nowrap text-[14px] font-medium transition-colors duration-200 ${
          active ? 'text-[#111111]' : 'text-[#9A9CA6]'
        }`}
      >
        {label}
      </span>
      <div className="h-[2px] min-w-[80px] flex-1 overflow-hidden rounded-full bg-[#EAEAEA] sm:min-w-[130px]">
        <div
          className="h-full origin-left rounded-full bg-[#0668E1] motion-reduce:transition-none"
          style={{
            transform: `scaleX(${progress})`,
            transition: 'transform 0.12s linear',
          }}
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
        <h3 className="font-display mt-4 text-[32px] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111]">
          {step.title}
        </h3>
        <p className="mt-4 text-[18px] leading-[1.55] text-[#6B6D76]">{step.body}</p>
      </div>
      <div className="relative" style={{ height: PREVIEW_CARD_HEIGHT }}>
        <FeaturePanel glow={step.glow} active />
      </div>
    </div>
  );
}

export default function LandingWhySwitcher() {
  const reduced = useMotionReduced();
  const triggerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);

  useGSAP(
    () => {
      if (reduced || !triggerRef.current || !pinRef.current) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: triggerRef.current,
          start: `top top+=${STICKY_TOP}`,
          end: () => `+=${getScrollTravel()}`,
          pin: pinRef.current,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProg(self.progress);
            if (pinRef.current) pinRef.current.style.zIndex = self.isActive ? '1' : '0';
          },
        });

        return () => st.kill();
      });

      return () => mm.revert();
    },
    { scope: triggerRef, dependencies: [reduced], revertOnUpdate: true },
  );

  const active = prog >= 2 * SEGMENT ? 2 : prog >= SEGMENT ? 1 : 0;
  const segProgress = (index: number) =>
    Math.min(1, Math.max(0, (prog - index * SEGMENT) / SEGMENT));
  const textScrollOffset = prog * (STEPS.length - 1) * STEP_SLOT;

  return (
    <section className="relative isolate bg-white pb-16 text-[#111111] sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-mkt-content px-5 pb-8 pt-20 sm:px-8 sm:pb-10 lg:pb-10 lg:pt-24">
        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
          WHY {SITE_NAME.toUpperCase()}
        </p>
        <h2
          className="font-display mt-4 max-w-[22ch] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#111111]"
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
        <div className="mx-auto max-w-mkt-content px-5 pb-16 sm:px-8">
          {STEPS.map((step) => (
            <StaticStepRow key={step.kicker} step={step} />
          ))}
        </div>
      ) : (
        <>
          <div ref={triggerRef} className="relative z-0 mx-auto hidden max-w-mkt-content px-5 pb-12 sm:px-8 lg:block lg:pb-20 lg:pt-0">
            <div ref={pinRef} className="w-full bg-white">
              <div className="grid grid-cols-2 items-start gap-14">
                <div className="flex min-w-0 flex-col justify-center">
                <div className="overflow-hidden" style={{ height: STEP_SLOT }}>
                  <div
                    className="will-change-transform"
                    style={{ transform: `translateY(-${textScrollOffset}px)` }}
                  >
                    {STEPS.map((step) => (
                      <div
                        key={step.kicker}
                        className="flex flex-col justify-start pt-1"
                        style={{ height: STEP_SLOT }}
                      >
                        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
                          {step.kicker}
                        </p>
                        <h3 className="font-display mt-3 max-w-[18ch] text-[clamp(26px,3vw,36px)] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111]">
                          {step.title}
                        </h3>
                        <p className="mt-3 max-w-[42ch] text-[17px] leading-[1.55] text-[#6B6D76]">
                          {step.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-[#EAEAEA] pt-1">
                  {STEPS.map((step, index) => (
                    <ProgressRow
                      key={step.kicker}
                      label={step.label}
                      progress={segProgress(index)}
                      active={active === index}
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-start justify-end">
                <div
                  className="relative w-full"
                  style={{ maxWidth: PREVIEW_MAX_WIDTH, height: PREVIEW_CARD_HEIGHT }}
                >
                  {STEPS.map((step, index) => (
                    <FeaturePanel key={step.kicker} glow={step.glow} active={active === index} />
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="pb-16 pt-4 sm:pb-20 lg:hidden">
            <div className="mx-auto max-w-mkt-content space-y-12 px-5 sm:px-8">
              {STEPS.map((step) => (
                <div key={step.kicker}>
                  <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
                    {step.kicker}
                  </p>
                  <h3 className="font-display mt-3 text-[28px] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[17px] leading-[1.55] text-[#6B6D76]">{step.body}</p>
                  <div className="relative mt-6" style={{ height: PREVIEW_CARD_HEIGHT }}>
                    <FeaturePanel glow={step.glow} active />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

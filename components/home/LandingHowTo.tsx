'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { DraggableCardRow } from '@/components/home/DraggableCardRow';
import { LandingAskDemo } from '@/components/home/LandingAskDemo';
import { LandingResearchDemo } from '@/components/home/LandingResearchDemo';
import { LandingScheduleDemo } from '@/components/home/LandingScheduleDemo';
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

/** Each step's outer card shell is a solid brand-blue fill — the header blue
 *  for the first card, a darker navy for the second and third — so the three
 *  cards read as distinct steps rather than repeats of the same card. The
 *  illustrated panel inside each card keeps its own light surface regardless
 *  of the shell's color. */
const CARD_ACCENT = {
  blue: {
    bg: 'bg-[#0668E1]',
    number: 'text-white/40',
    body: 'text-white/75',
  },
  navy: {
    bg: 'bg-[#062B5C]',
    number: 'text-white/35',
    body: 'text-white/70',
  },
} as const;

const STEPS = [
  {
    n: '01',
    title: 'Research the property',
    body: 'Look up the owner, pull property details, and run a comps-based CMA before you ever pick up the phone.',
    Demo: LandingResearchDemo,
    accent: 'blue',
  },
  {
    n: '02',
    title: 'Let AI handle the busywork',
    body: "Ask in plain English and Oikaro drafts the follow-up, ready to send in seconds — no blank page, no starting from scratch.",
    Demo: LandingAskDemo,
    accent: 'navy',
  },
  {
    n: '03',
    title: 'Get it on the calendar',
    body: "Book the showing and it's synced everywhere — no double-booking, no back-and-forth texts to lock a time.",
    Demo: LandingScheduleDemo,
    accent: 'navy',
  },
] as const;

function HowToPanel({ step }: { step: (typeof STEPS)[number] }) {
  const Demo = step.Demo;
  const accent = CARD_ACCENT[step.accent];

  return (
    <div
      data-howto-card
      className={`box-border flex w-[880px] max-w-[calc(100vw-3rem)] flex-none flex-col overflow-hidden rounded-[24px] p-8 shadow-[0_20px_60px_-30px_rgba(2,38,84,0.35)] sm:max-w-none sm:p-10 ${accent.bg}`}
    >
      <div className="flex items-start gap-5">
        <span
          className={`flex-none font-mkt-mono text-[28px] font-semibold leading-none tracking-[-0.03em] sm:text-[34px] ${accent.number}`}
        >
          ({step.n})
        </span>
        <div className="flex-1">
          <h3 className="font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[38px]">
            {step.title}
          </h3>
          <p className={`mt-3 max-w-[46ch] text-[16px] leading-[1.6] sm:text-[17px] ${accent.body}`}>
            {step.body}
          </p>
        </div>
      </div>

      <div className="mt-8 flex-1">
        <Demo />
      </div>
    </div>
  );
}

export default function LandingHowTo() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>('[data-howto-card]', sectionRef.current);
      if (!cards.length) return;

      gsap.set(cards, { autoAlpha: 0, y: 28 });

      ScrollTrigger.batch(cards, {
        start: 'top 85%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.15,
          }),
      });
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative bg-white pt-16 text-[#111111] sm:pt-20 lg:pt-28"
    >
      <div className="mx-auto max-w-[1120px] px-10">
        <p className="font-mkt-mono text-[13px] font-semibold tracking-[0.22em] text-[#0668E1]">
          HOW TO
        </p>
        <h2 className="font-display mt-[34px] max-w-[24ch] text-[64px] font-extrabold leading-[1.04] tracking-[-0.048em] text-[#111111]">
          Ask a question. Get it done. Move on.
        </h2>
        <p className="mt-[30px] max-w-[48ch] text-[19.5px] leading-[1.6] text-[#6B6D76]">
          Property research, follow-ups, and scheduling — the stuff that used to take five tabs
          and twenty minutes now happens in one place, in seconds.
        </p>
      </div>

      <DraggableCardRow className="mt-20 lg:mt-28">
        {STEPS.map((step) => (
          <HowToPanel key={step.n} step={step} />
        ))}
      </DraggableCardRow>

      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-5 px-10 pb-[120px] pt-14">
        <Link
          href="/auth/signup"
          className="inline-flex h-[52px] items-center rounded-[10px] bg-[#0668E1] px-[26px] text-[15.5px] font-semibold text-white transition-colors hover:bg-[#0450b0]"
        >
          Start free trial
        </Link>
        <span className="text-[14.5px] text-[#6B6D76]">
          7 days free · No setup fees · Cancel anytime
        </span>
      </div>
    </section>
  );
}

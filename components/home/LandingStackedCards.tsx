'use client';

import { useRef } from 'react';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

type StackCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bg: string;
};

const CARDS: StackCard[] = [
  {
    id: 'ai',
    eyebrow: 'AI Assistant',
    title: 'Just tell it what you need',
    description:
      'Generate listings, find leads, and run CMAs by chatting — no menus to dig through.',
    bg: '#0668E1',
  },
  {
    id: 'listings',
    eyebrow: 'Listing Projects',
    title: 'Listings that write themselves',
    description:
      'AI-generated descriptions and social captions from your photos, in your voice.',
    bg: '#0A0A0A',
  },
  {
    id: 'leads',
    eyebrow: 'Leads & CRM',
    title: 'Every lead, scored and followed up',
    description:
      'Hot, Warm, Cold scoring with automatic follow-up — nothing falls through.',
    bg: '#2E86FB',
  },
  {
    id: 'transactions',
    eyebrow: 'Transactions',
    title: 'Deals that stay on track',
    description:
      'Dates, tasks, and checklists for every transaction in one pipeline.',
    bg: '#1C1D22',
  },
  {
    id: 'research',
    eyebrow: 'Property Research',
    title: 'Comps in seconds, not hours',
    description: 'Owner info, sale history, and a CMA value from one search.',
    bg: '#0081FB',
  },
];

const STICKY_OFFSET_VAR = 'var(--stack-offset, 18px)';

function CardContent({ card }: { card: StackCard }) {
  return (
    <>
      <p className="mb-3 text-xs uppercase tracking-wide text-white/60">{card.eyebrow}</p>
      <h3 className="font-display max-w-lg text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
        {card.title}
      </h3>
      <p className="mt-3 max-w-md text-sm text-white/70 sm:mt-4 sm:text-base">{card.description}</p>
    </>
  );
}

export default function LandingStackedCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReducedMotion = useMotionReduced();

  useGSAP(
    () => {
      if (prefersReducedMotion || !containerRef.current) return;

      cardRefs.current.forEach((card, i) => {
        if (!card || i === CARDS.length - 1) return;
        const nextCard = cardRefs.current[i + 1];
        if (!nextCard) return;

        gsap.to(card, {
          scale: 0.96,
          filter: 'brightness(0.85)',
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });
      });
    },
    { scope: containerRef, dependencies: [prefersReducedMotion], revertOnUpdate: true },
  );

  if (prefersReducedMotion) {
    return (
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-mkt-content space-y-4 px-5 sm:px-8">
          {CARDS.map((card) => (
            <div
              key={card.id}
              className="flex min-h-[320px] flex-col justify-center rounded-3xl p-8 shadow-xl sm:min-h-[360px] sm:p-10"
              style={{ backgroundColor: card.bg }}
            >
              <CardContent card={card} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <div
          ref={containerRef}
          className="relative [--stack-offset:18px] sm:[--stack-offset:28px]"
        >
          {CARDS.map((card, i) => (
            <div
              key={card.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="sticky origin-top"
              style={{
                top: `calc(${i} * ${STICKY_OFFSET_VAR})`,
                zIndex: i + 1,
              }}
            >
              <div
                className="flex min-h-[340px] flex-col justify-center rounded-3xl p-8 shadow-xl sm:min-h-[420px] sm:p-10 lg:min-h-[480px] lg:p-14"
                style={{ backgroundColor: card.bg }}
              >
                <CardContent card={card} />
              </div>
            </div>
          ))}
          <div className="h-[20vh]" aria-hidden />
        </div>
      </div>
    </section>
  );
}

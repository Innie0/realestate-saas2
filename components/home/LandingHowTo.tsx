'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { DraggableCardRow } from '@/components/home/DraggableCardRow';

const STEPS = [
  {
    n: '01',
    title: 'Capture',
    body: 'Open-house sign-ins, website forms, and portal inquiries all land in one inbox — deduped, scored, and attached to the property they asked about.',
    dark: false,
    src: '/landing/leads-inbox.png',
    fallbackSrc: '/landing/leads-inbox.png',
  },
  {
    n: '02',
    title: 'Qualify',
    body: 'Oikaro reads the history and tells you who is actually ready. Draft the follow-up, book the showing, and log the call without leaving the row.',
    dark: true,
    src: '/landing/lead-detail.png',
    fallbackSrc: '/landing/lead-capture.png',
  },
  {
    n: '03',
    title: 'Close',
    body: 'Every deadline, document, and signature tracked to closing day — with reminders that fire before the escrow officer has to ask.',
    dark: false,
    src: '/landing/transactions.png',
    fallbackSrc: '/landing/transactions.png',
  },
] as const;

const CLIP_H = 760;

function PanelMock({ src, fallbackSrc, alt }: { src: string; fallbackSrc: string; alt: string }) {
  const [activeSrc, setActiveSrc] = useState(src);

  return (
    <div className="relative mt-[38px] min-h-[300px] flex-1 overflow-hidden rounded-t-[14px] bg-white shadow-[0_-6px_50px_-20px_rgba(0,0,0,0.35)]">
      <Image
        src={activeSrc}
        alt={alt}
        fill
        draggable={false}
        className="pointer-events-none object-cover object-top select-none"
        sizes="880px"
        onError={() => {
          if (activeSrc !== fallbackSrc) setActiveSrc(fallbackSrc);
        }}
      />
    </div>
  );
}

function HowToPanel({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div
      className={clsx(
        'box-border flex w-[880px] max-w-[calc(100vw-3rem)] flex-none flex-col overflow-hidden rounded-[24px] px-12 pt-12 sm:max-w-none',
        step.dark ? 'bg-[#0A0A0A]' : 'bg-[#EAF2FE]',
      )}
    >
      <div className="flex h-[210px] flex-none items-start gap-[22px]">
        <span
          className={clsx(
            'flex-none font-mkt-mono text-[34px] font-semibold leading-none tracking-[-0.03em]',
            step.dark ? 'text-white/30' : 'text-[#0668E1]/30',
          )}
        >
          ({step.n})
        </span>
        <div className="flex-1">
          <h3
            className={clsx(
              'text-[56px] font-semibold leading-[0.98] tracking-[-0.045em]',
              step.dark ? 'text-white' : 'text-[#0668E1]',
            )}
          >
            {step.title}
          </h3>
          <p
            className={clsx(
              'mt-[18px] max-w-[44ch] text-[17px] leading-[1.6]',
              step.dark ? 'text-white/60' : 'text-[#6B6D76]',
            )}
          >
            {step.body}
          </p>
        </div>
      </div>

      <PanelMock src={step.src} fallbackSrc={step.fallbackSrc} alt={step.title} />
    </div>
  );
}

export default function LandingHowTo() {
  return (
    <section className="relative bg-white pt-10 text-[#111111]">
      <div className="mx-auto max-w-[1120px] px-10">
        <p className="font-mkt-mono text-[13px] font-semibold tracking-[0.22em] text-[#0668E1]">
          HOW TO
        </p>
        <h2 className="mt-[34px] max-w-[24ch] text-[64px] font-semibold leading-[1.04] tracking-[-0.048em] text-[#111111]">
          From first inquiry to closed deal, and beyond
        </h2>
        <p className="mt-[30px] max-w-[48ch] text-[19.5px] leading-[1.6] text-[#6B6D76]">
          Three steps, one workspace. Oikaro carries a lead from the first form fill through the
          closing table without you rebuilding the file four times.
        </p>
      </div>

      <DraggableCardRow className="mt-14" style={{ height: CLIP_H }} contentClassName="h-full">
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

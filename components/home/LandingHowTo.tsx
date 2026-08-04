'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { DraggableCardRow } from '@/components/home/DraggableCardRow';

type PanelTheme = 'light' | 'deep' | 'brand';

const PANEL_THEMES: Record<
  PanelTheme,
  {
    background: string;
    number: string;
    title: string;
    body: string;
    mockShell?: string;
    mockShadow: string;
  }
> = {
  light: {
    background: 'linear-gradient(180deg,#F5F9FF 0%,#EAF2FE 52%,#DCEBFE 100%)',
    number: 'text-[#0668E1]/35',
    title: 'text-[#0452AD]',
    body: 'text-[#6B6D76]',
    mockShadow: 'shadow-[0_-6px_50px_-20px_rgba(6,104,225,0.22)]',
  },
  deep: {
    background: 'linear-gradient(180deg,#022654 0%,#0452AD 58%,#0668E1 100%)',
    number: 'text-white/35',
    title: 'text-white',
    body: 'text-white/65',
    mockShell:
      'rounded-t-[16px] border border-dashed border-white/25 bg-[#0668E1]/20 p-1.5 backdrop-blur-[1px]',
    mockShadow: 'shadow-[0_-6px_50px_-20px_rgba(0,0,0,0.35)]',
  },
  brand: {
    background: 'linear-gradient(145deg,#0668E1 0%,#2E86FB 58%,#0668E1 100%)',
    number: 'text-white/35',
    title: 'text-white',
    body: 'text-white/72',
    mockShadow: 'shadow-[0_-8px_56px_-18px_rgba(2,38,84,0.45)]',
  },
};

const STEPS = [
  {
    n: '01',
    title: 'Capture',
    body: 'Open-house sign-ins, website forms, and portal inquiries all land in one inbox — deduped, scored, and attached to the property they asked about.',
    theme: 'light' as const,
    src: '/landing/leads-inbox.png',
    fallbackSrc: '/landing/leads-inbox.png',
  },
  {
    n: '02',
    title: 'Qualify',
    body: 'Oikaro reads the history and tells you who is actually ready. Draft the follow-up, book the showing, and log the call without leaving the row.',
    theme: 'deep' as const,
    src: '/landing/lead-detail.png',
    fallbackSrc: '/landing/lead-capture.png',
  },
  {
    n: '03',
    title: 'Close',
    body: 'Every deadline, document, and signature tracked to closing day — with reminders that fire before the escrow officer has to ask.',
    theme: 'brand' as const,
    src: '/landing/transactions.png',
    fallbackSrc: '/landing/transactions.png',
  },
] as const;

const CLIP_H = 760;

function PanelMock({
  src,
  fallbackSrc,
  alt,
  theme,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
  theme: PanelTheme;
}) {
  const [activeSrc, setActiveSrc] = useState(src);
  const styles = PANEL_THEMES[theme];

  const mock = (
    <div
      className={clsx(
        'relative min-h-[300px] flex-1 overflow-hidden rounded-t-[14px] bg-white',
        !styles.mockShell && 'mt-[38px]',
        styles.mockShadow,
      )}
    >
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

  if (!styles.mockShell) return mock;

  return <div className={clsx('mt-[38px] flex-1', styles.mockShell)}>{mock}</div>;
}

function HowToPanel({ step }: { step: (typeof STEPS)[number] }) {
  const styles = PANEL_THEMES[step.theme];

  return (
    <div
      className="box-border flex w-[880px] max-w-[calc(100vw-3rem)] flex-none flex-col overflow-hidden rounded-[24px] px-12 pt-12 sm:max-w-none"
      style={{ background: styles.background }}
    >
      <div className="flex h-[210px] flex-none items-start gap-[22px]">
        <span
          className={clsx(
            'flex-none font-mkt-mono text-[34px] font-semibold leading-none tracking-[-0.03em]',
            styles.number,
          )}
        >
          ({step.n})
        </span>
        <div className="flex-1">
          <h3
            className={clsx(
              'font-display text-[56px] font-extrabold leading-[0.98] tracking-[-0.045em]',
              styles.title,
            )}
          >
            {step.title}
          </h3>
          <p className={clsx('mt-[18px] max-w-[44ch] text-[17px] leading-[1.6]', styles.body)}>
            {step.body}
          </p>
        </div>
      </div>

      <PanelMock
        src={step.src}
        fallbackSrc={step.fallbackSrc}
        alt={step.title}
        theme={step.theme}
      />
    </div>
  );
}

export default function LandingHowTo() {
  return (
    <section className="relative bg-white pt-16 text-[#111111] sm:pt-20 lg:pt-28">
      <div className="mx-auto max-w-[1120px] px-10">
        <p className="font-mkt-mono text-[13px] font-semibold tracking-[0.22em] text-[#0668E1]">
          HOW TO
        </p>
        <h2 className="font-display mt-[34px] max-w-[24ch] text-[64px] font-extrabold leading-[1.04] tracking-[-0.048em] text-[#111111]">
          From first inquiry to closed deal, and beyond
        </h2>
        <p className="mt-[30px] max-w-[48ch] text-[19.5px] leading-[1.6] text-[#6B6D76]">
          Three steps, one workspace. Oikaro carries a lead from the first form fill through the
          closing table without you rebuilding the file four times.
        </p>
      </div>

      <DraggableCardRow className="mt-20 lg:mt-28" style={{ height: CLIP_H }} contentClassName="h-full">
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

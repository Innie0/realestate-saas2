'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const ease = [0.25, 0.1, 0.25, 1] as const;

function floatTransition(duration: number, delay = 0) {
  return {
    duration,
    repeat: Infinity,
    ease: 'easeInOut' as const,
    delay,
  };
}

/** Dark blurred canvas — Solidroad-style */
export function ShowcaseAnimationFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_56px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
      <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/11]">
        <Image
          src="/landing/hero-mountains.jpg"
          alt=""
          fill
          className="object-cover object-center scale-110 saturate-[1.15]"
          sizes="520px"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/75 via-violet-900/55 to-orange-900/45" />
        <div className="absolute inset-0 backdrop-blur-[14px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative h-full w-full p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

function Avatar({ initials, tone }: { initials: string; tone: string }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white sm:h-9 sm:w-9 sm:text-[11px] ${tone}`}
    >
      {initials}
    </span>
  );
}

function ScoreBadge({ label, variant }: { label: string; variant: 'hot' | 'warm' | 'cold' | 'neutral' }) {
  const styles = {
    hot: 'bg-rose-400/90 text-white',
    warm: 'bg-amber-400/90 text-white',
    cold: 'bg-white/25 text-white/90',
    neutral: 'bg-white/90 text-gray-900',
  };
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:h-9 sm:w-9 sm:text-[11px] ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

function FloatingPill({
  reduced,
  className,
  children,
  drift,
}: {
  reduced: boolean;
  className?: string;
  children: React.ReactNode;
  drift: { y: number[]; x: number[]; duration: number; delay?: number };
}) {
  if (reduced) {
    return (
      <div className={`absolute ${className ?? ''}`}>{children}</div>
    );
  }
  return (
    <motion.div
      className={`absolute ${className ?? ''}`}
      animate={{ y: drift.y, x: drift.x }}
      transition={floatTransition(drift.duration, drift.delay)}
    >
      {children}
    </motion.div>
  );
}

function CenterStatusPill({
  reduced,
  label,
  progress,
}: {
  reduced: boolean;
  label: string;
  progress?: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease }}
      className="absolute left-1/2 top-1/2 z-20 w-[min(88%,14rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-md sm:w-[min(78%,15rem)]"
    >
      <p className="text-center text-[12px] font-semibold text-gray-900 sm:text-[13px]">{label}</p>
      {progress ? (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
          {reduced ? (
            <div className="h-full w-[68%] rounded-full bg-brand-500" />
          ) : (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
              animate={{ width: ['18%', '88%', '18%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

function GlassScoreCard({
  name,
  initials,
  tone,
  score,
  scoreVariant,
}: {
  name: string;
  initials: string;
  tone: string;
  score: string;
  scoreVariant: 'hot' | 'warm' | 'cold' | 'neutral';
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-white/25 bg-white/15 py-1.5 pl-1.5 pr-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md sm:gap-3 sm:pr-3.5">
      <Avatar initials={initials} tone={tone} />
      <span className="whitespace-nowrap text-[11px] font-medium text-white sm:text-[12px]">{name}</span>
      <ScoreBadge label={score} variant={scoreVariant} />
    </div>
  );
}

function StackedModule({
  index,
  title,
  subtitle,
  active,
  reduced,
}: {
  index: string;
  title: string;
  subtitle: string;
  active: boolean;
  reduced: boolean;
}) {
  return (
    <motion.div
      layout={!reduced}
      animate={{
        scale: active ? 1 : 0.94,
        opacity: active ? 1 : 0.55,
      }}
      transition={{ duration: 0.45, ease }}
      className={`flex w-full max-w-[15rem] items-center gap-3 rounded-2xl border px-3 py-2.5 sm:max-w-[16rem] sm:px-4 sm:py-3 ${
        active
          ? 'border-white/30 bg-white/95 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)]'
          : 'border-white/15 bg-white/10 backdrop-blur-md'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold sm:h-10 sm:w-10 sm:text-[12px] ${
          active ? 'bg-brand-100 text-brand-700' : 'bg-white/15 text-white/80'
        }`}
      >
        {index}
      </span>
      <div className="min-w-0">
        <p
          className={`truncate text-[12px] font-semibold sm:text-[13px] ${
            active ? 'text-gray-900' : 'text-white/90'
          }`}
        >
          {title}
        </p>
        <p className={`truncate text-[10px] sm:text-[11px] ${active ? 'text-gray-500' : 'text-white/55'}`}>
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

/** Floating AI command pills + center processing */
export function AskOnceAnimation({ reduced }: { reduced: boolean }) {
  return (
    <ShowcaseAnimationFrame>
      <div className="relative h-full w-full">
        <FloatingPill
          reduced={reduced}
          className="left-[4%] top-[10%] sm:left-[6%] sm:top-[12%]"
          drift={{ y: [0, -10, 0], x: [0, 6, 0], duration: 5.2, delay: 0 }}
        >
          <GlassScoreCard
            name="Draft listing"
            initials="DL"
            tone="bg-violet-500"
            score="AI"
            scoreVariant="neutral"
          />
        </FloatingPill>

        <FloatingPill
          reduced={reduced}
          className="right-[2%] top-[18%] sm:right-[5%]"
          drift={{ y: [0, 8, 0], x: [0, -5, 0], duration: 4.6, delay: 0.4 }}
        >
          <GlassScoreCard
            name="Pull comps"
            initials="PC"
            tone="bg-sky-500"
            score="3"
            scoreVariant="neutral"
          />
        </FloatingPill>

        <FloatingPill
          reduced={reduced}
          className="bottom-[16%] left-[8%] sm:bottom-[18%]"
          drift={{ y: [0, -7, 0], x: [0, 8, 0], duration: 5.8, delay: 0.8 }}
        >
          <GlassScoreCard
            name="Schedule follow-up"
            initials="SF"
            tone="bg-emerald-500"
            score="✓"
            scoreVariant="neutral"
          />
        </FloatingPill>

        <CenterStatusPill reduced={reduced} label="Processing request" progress />
      </div>
    </ShowcaseAnimationFrame>
  );
}

/** Floating listing + comp pills */
export function WinListingAnimation({ reduced }: { reduced: boolean }) {
  return (
    <ShowcaseAnimationFrame>
      <div className="relative h-full w-full">
        <FloatingPill
          reduced={reduced}
          className="left-[3%] top-[14%]"
          drift={{ y: [0, -9, 0], x: [0, 5, 0], duration: 4.8 }}
        >
          <GlassScoreCard name="123 Oak St" initials="OK" tone="bg-orange-500" score="4" scoreVariant="neutral" />
        </FloatingPill>

        <FloatingPill
          reduced={reduced}
          className="right-[0%] top-[22%] sm:right-[3%]"
          drift={{ y: [0, 7, 0], x: [0, -6, 0], duration: 5.4, delay: 0.3 }}
        >
          <GlassScoreCard name="$495k comp" initials="C1" tone="bg-indigo-500" score="A" scoreVariant="neutral" />
        </FloatingPill>

        <FloatingPill
          reduced={reduced}
          className="bottom-[14%] right-[6%]"
          drift={{ y: [0, -6, 0], x: [0, 4, 0], duration: 5, delay: 0.6 }}
        >
          <GlassScoreCard name="Luxury tone" initials="LT" tone="bg-rose-500" score="✦" scoreVariant="neutral" />
        </FloatingPill>

        <CenterStatusPill reduced={reduced} label="Generating MLS copy" progress />
      </div>
    </ShowcaseAnimationFrame>
  );
}

/** Lead scoring — Solidroad review-style floating cards */
export function NeverLoseLeadAnimation({ reduced }: { reduced: boolean }) {
  return (
    <ShowcaseAnimationFrame>
      <div className="relative h-full w-full">
        <FloatingPill
          reduced={reduced}
          className="left-[2%] top-[12%] sm:left-[5%]"
          drift={{ y: [0, -11, 0], x: [0, 7, 0], duration: 5.1 }}
        >
          <GlassScoreCard name="Sarah M." initials="SM" tone="bg-rose-500" score="92" scoreVariant="hot" />
        </FloatingPill>

        <FloatingPill
          reduced={reduced}
          className="right-[0%] top-[20%] sm:right-[4%]"
          drift={{ y: [0, 9, 0], x: [0, -5, 0], duration: 4.7, delay: 0.5 }}
        >
          <GlassScoreCard name="James R." initials="JR" tone="bg-amber-500" score="74" scoreVariant="warm" />
        </FloatingPill>

        <FloatingPill
          reduced={reduced}
          className="bottom-[12%] left-[10%]"
          drift={{ y: [0, -8, 0], x: [0, 6, 0], duration: 5.5, delay: 0.2 }}
        >
          <GlassScoreCard name="Alex T." initials="AT" tone="bg-slate-500" score="41" scoreVariant="cold" />
        </FloatingPill>

        <CenterStatusPill reduced={reduced} label="Scoring leads" progress />
      </div>
    </ShowcaseAnimationFrame>
  );
}

/** Stacked deal modules — Solidroad training-stack style */
export function CloseConfidenceAnimation({ reduced }: { reduced: boolean }) {
  const modules = [
    { index: '01', title: 'Offer accepted', subtitle: '742 Maple Ave' },
    { index: '02', title: 'Inspection scheduled', subtitle: 'Due Thursday' },
    { index: '03', title: 'Closing checklist', subtitle: 'Apr 18' },
  ];

  const [activeIndex, setActiveIndex] = useState(1);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % modules.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [reduced, modules.length]);

  return (
    <ShowcaseAnimationFrame>
      <div className="flex h-full flex-col items-center justify-center gap-2.5 sm:gap-3">
        {modules.map((mod, i) => (
          <StackedModule
            key={mod.index}
            index={mod.index}
            title={mod.title}
            subtitle={mod.subtitle}
            active={i === activeIndex}
            reduced={reduced}
          />
        ))}
      </div>
    </ShowcaseAnimationFrame>
  );
}

export type ShowcaseAnimationId =
  | 'ask-once'
  | 'win-listing'
  | 'never-lose-lead'
  | 'close-confidence';

export function ShowcaseAnimation({
  id,
  reduced,
}: {
  id: ShowcaseAnimationId;
  reduced: boolean;
}) {
  switch (id) {
    case 'ask-once':
      return <AskOnceAnimation reduced={reduced} />;
    case 'win-listing':
      return <WinListingAnimation reduced={reduced} />;
    case 'never-lose-lead':
      return <NeverLoseLeadAnimation reduced={reduced} />;
    case 'close-confidence':
      return <CloseConfidenceAnimation reduced={reduced} />;
    default:
      return null;
  }
}

'use client';

import { useRef } from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Megaphone,
  Search,
  Sparkles,
  Table2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

type StackItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  before: { x: number; y: number; rotate: number };
};

function ringAfter(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    rotate: 0,
  };
}

function getRingRadius() {
  if (typeof window === 'undefined') return 168;
  return window.innerWidth < 640 ? 128 : window.innerWidth < 1024 ? 148 : 168;
}

const STACK_ITEMS: StackItem[] = [
  {
    id: 'leads',
    label: 'Lead capture forms',
    icon: FileText,
    before: { x: -300, y: -120, rotate: -22 },
  },
  {
    id: 'spreadsheet',
    label: 'Spreadsheet pipeline',
    icon: Table2,
    before: { x: 220, y: -180, rotate: 16 },
  },
  {
    id: 'listing-copy',
    label: 'AI / listing copy',
    icon: Sparkles,
    before: { x: 340, y: 20, rotate: -11 },
  },
  {
    id: 'ads',
    label: 'Meta & Google ads',
    icon: Megaphone,
    before: { x: -340, y: 80, rotate: 24 },
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    icon: CalendarDays,
    before: { x: -120, y: 200, rotate: -16 },
  },
  {
    id: 'crm',
    label: 'CRM & follow-ups',
    icon: Users,
    before: { x: 80, y: 220, rotate: 19 },
  },
  {
    id: 'checklists',
    label: 'Transaction checklists',
    icon: ClipboardCheck,
    before: { x: 280, y: -220, rotate: -28 },
  },
  {
    id: 'research',
    label: 'Property research',
    icon: Search,
    before: { x: -20, y: -280, rotate: 13 },
  },
];

const CHAOS_LINKS: [number, number][] = [
  [0, 3],
  [1, 6],
  [2, 5],
  [4, 7],
  [3, 6],
  [0, 7],
];

function AfterRingPreview({ radius }: { radius: number }) {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-lg sm:h-[340px]">
      <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10">
        <span className="font-display text-sm text-white">Oikaro</span>
      </div>
      {STACK_ITEMS.map((item, i) => {
        const pos = ringAfter(i, STACK_ITEMS.length, radius);
        return (
          <div
            key={item.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
            style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
          >
            <item.icon className="size-3.5 text-white/70" strokeWidth={1.75} />
            <span className="text-xs text-white/80">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReducedMotionBeforeAfter() {
  const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 128 : 148;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <div>
        <p className="mb-4 text-xs uppercase tracking-wide text-white/40">Before Oikaro</p>
        <div className="flex flex-wrap gap-2">
          {STACK_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
            >
              <item.icon className="size-3.5 text-white/60" strokeWidth={1.75} />
              <span className="text-xs text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-4 text-xs uppercase tracking-wide text-white/70">After Oikaro</p>
        <AfterRingPreview radius={radius} />
      </div>
    </div>
  );
}

export default function LandingStackReplaceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelBeforeRef = useRef<HTMLSpanElement>(null);
  const labelAfterRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionReduced();

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (reduced || !stage) return;

      const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
      const lines = lineRefs.current.filter(Boolean) as SVGLineElement[];
      const radius = getRingRadius();

      items.forEach((el, i) => {
        gsap.set(el, {
          x: STACK_ITEMS[i].before.x,
          y: STACK_ITEMS[i].before.y,
          rotate: STACK_ITEMS[i].before.rotate,
          scale: 1,
          opacity: 0.9,
        });
      });

      lines.forEach((line) => {
        const length = line.getTotalLength?.() ?? 200;
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: 0, opacity: 0.4 });
      });

      if (wordmarkRef.current) {
        gsap.set(wordmarkRef.current, { opacity: 0, scale: 0.85 });
      }
      if (ringRef.current) {
        gsap.set(ringRef.current, { opacity: 0, scale: 0.92 });
      }
      if (labelAfterRef.current) {
        gsap.set(labelAfterRef.current, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top bottom',
          end: 'top 38%',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        items,
        {
          x: (i) => ringAfter(i, STACK_ITEMS.length, radius).x,
          y: (i) => ringAfter(i, STACK_ITEMS.length, radius).y,
          rotate: 0,
          scale: 0.92,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        },
        0,
      )
        .to(
          lines,
          {
            strokeDashoffset: (i) => lineRefs.current[i]?.getTotalLength?.() ?? 200,
            opacity: 0,
            duration: 0.35,
            ease: 'power1.out',
          },
          0,
        )
        .to(
          wordmarkRef.current,
          { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
          0.35,
        )
        .to(ringRef.current, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, 0.4)
        .to(labelBeforeRef.current, { opacity: 0, duration: 0.2 }, 0.25)
        .to(labelAfterRef.current, { opacity: 1, duration: 0.2 }, 0.45);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <div
      ref={sectionRef}
      aria-label="Replace your stack"
      className="relative overflow-hidden border-b border-white/10 py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
          <p
            data-reveal
            className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/50"
          >
            One workspace
          </p>
          <h2
            data-reveal
            className="font-display mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-white"
          >
            One workspace instead of six tabs
          </h2>
          <p data-reveal className="mt-3 text-base leading-[1.6] text-white/65 sm:text-[16px]">
            Listings, leads, ads, calendar, and closings — without the tab chaos.
          </p>
        </LandingStaggerReveal>

        <div ref={stageRef} className="relative mt-10 h-[360px] sm:mt-12 sm:h-[400px] lg:h-[420px]">
          {reduced ? (
            <ReducedMotionBeforeAfter />
          ) : (
            <>
              <div className="relative z-10 mb-4 text-center text-xs uppercase tracking-wide">
                <span ref={labelBeforeRef} className="text-white/40">
                  Before Oikaro
                </span>
                <span
                  ref={labelAfterRef}
                  className="pointer-events-none absolute inset-x-0 opacity-0 text-white/70"
                >
                  After Oikaro
                </span>
              </div>

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="-380 -320 760 640"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                {CHAOS_LINKS.map(([a, b], i) => (
                  <line
                    key={`${a}-${b}`}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    x1={STACK_ITEMS[a].before.x}
                    y1={STACK_ITEMS[a].before.y}
                    x2={STACK_ITEMS[b].before.x}
                    y2={STACK_ITEMS[b].before.y}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth={1}
                    strokeDasharray="4 5"
                  />
                ))}
              </svg>

              <div
                ref={ringRef}
                className="pointer-events-none absolute left-1/2 top-[calc(50%+12px)] size-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:size-[320px] lg:size-[360px]"
                aria-hidden
              />

              <div
                ref={wordmarkRef}
                className="absolute left-1/2 top-[calc(50%+12px)] z-10 flex size-[4.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_40px_-8px_rgba(255,255,255,0.35)] sm:size-20"
              >
                <span className="font-display text-sm text-white">Oikaro</span>
              </div>

              <div className="absolute left-1/2 top-[calc(50%+12px)] z-[5] h-0 w-0">
                {STACK_ITEMS.map((item, i) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#141414] px-3 py-2 sm:px-4 sm:py-2.5"
                  >
                    <item.icon className="size-4 text-white/70" strokeWidth={1.75} />
                    <span className="text-xs text-white/80 sm:text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
  after: { x: number; y: number; rotate: number };
};

const STACK_ITEMS: StackItem[] = [
  {
    id: 'leads',
    label: 'Lead capture forms',
    icon: FileText,
    before: { x: -260, y: -140, rotate: -18 },
    after: { x: -270, y: -40, rotate: 0 },
  },
  {
    id: 'spreadsheet',
    label: 'Spreadsheet pipeline',
    icon: Table2,
    before: { x: 180, y: -170, rotate: 12 },
    after: { x: -90, y: -40, rotate: 0 },
  },
  {
    id: 'listing-copy',
    label: 'AI / listing copy',
    icon: Sparkles,
    before: { x: 320, y: 40, rotate: -9 },
    after: { x: 90, y: -40, rotate: 0 },
  },
  {
    id: 'ads',
    label: 'Meta & Google ads',
    icon: Megaphone,
    before: { x: -320, y: 90, rotate: 22 },
    after: { x: 270, y: -40, rotate: 0 },
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    icon: CalendarDays,
    before: { x: -140, y: 190, rotate: -14 },
    after: { x: -270, y: 40, rotate: 0 },
  },
  {
    id: 'crm',
    label: 'CRM & follow-ups',
    icon: Users,
    before: { x: 60, y: 210, rotate: 17 },
    after: { x: -90, y: 40, rotate: 0 },
  },
  {
    id: 'checklists',
    label: 'Transaction checklists',
    icon: ClipboardCheck,
    before: { x: 250, y: -240, rotate: -25 },
    after: { x: 90, y: 40, rotate: 0 },
  },
  {
    id: 'research',
    label: 'Property research',
    icon: Search,
    before: { x: -40, y: -260, rotate: 15 },
    after: { x: 270, y: 40, rotate: 0 },
  },
];

const CHAOS_LINKS: [number, number][] = [
  [0, 3],
  [1, 6],
  [2, 5],
  [4, 7],
  [3, 6],
];

function ReducedMotionBeforeAfter() {
  return (
    <div className="grid gap-10 sm:grid-cols-2">
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
        <p className="mb-4 text-xs uppercase tracking-wide text-white/40">After Oikaro</p>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <div className="flex size-10 items-center justify-center rounded-full border border-white/10">
            <span className="font-display text-xs text-white">O</span>
          </div>
          <span className="text-sm text-white/80">
            One workspace for listings, leads, ads, calendar, and closings.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LandingStackReplaceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const labelBeforeRef = useRef<HTMLSpanElement>(null);
  const labelAfterRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionReduced();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
      const lines = lineRefs.current.filter(Boolean) as SVGLineElement[];

      items.forEach((el, i) => {
        gsap.set(el, {
          x: STACK_ITEMS[i].before.x,
          y: STACK_ITEMS[i].before.y,
          rotate: STACK_ITEMS[i].before.rotate,
          opacity: 0.85,
        });
      });

      lines.forEach((line) => {
        const length = line.getTotalLength?.() ?? 200;
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: 0, opacity: 0.35 });
      });

      if (wordmarkRef.current) {
        gsap.set(wordmarkRef.current, { opacity: 0, scale: 0.9 });
      }
      if (labelAfterRef.current) {
        gsap.set(labelAfterRef.current, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'bottom 40%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        items,
        {
          x: (i) => STACK_ITEMS[i].after.x,
          y: (i) => STACK_ITEMS[i].after.y,
          rotate: (i) => STACK_ITEMS[i].after.rotate,
          opacity: 1,
          duration: 1,
          ease: 'power2.inOut',
          stagger: 0.04,
        },
        0,
      )
        .to(
          lines,
          {
            strokeDashoffset: (i) => lineRefs.current[i]?.getTotalLength?.() ?? 200,
            opacity: 0,
            duration: 0.6,
            ease: 'power1.out',
          },
          0,
        )
        .to(
          wordmarkRef.current,
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
          0.5,
        )
        .to(labelBeforeRef.current, { opacity: 0, duration: 0.3 }, 0.1)
        .to(labelAfterRef.current, { opacity: 1, duration: 0.3 }, 0.6);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Replace your stack"
      className="relative overflow-hidden border-t border-mkt-border bg-[#0a0a0a] py-14 sm:py-16 lg:py-20"
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

        <div className="relative mt-12 h-[420px] sm:mt-16 sm:h-[480px]">
          {reduced ? (
            <ReducedMotionBeforeAfter />
          ) : (
            <>
              <div className="relative mb-6 text-center text-xs uppercase tracking-wide">
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
                viewBox="-350 -300 700 600"
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
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={1}
                    strokeDasharray="4 5"
                  />
                ))}
              </svg>

              <div
                ref={wordmarkRef}
                className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <span className="font-display text-sm text-white">Oikaro</span>
              </div>

              <div className="absolute left-1/2 top-1/2 h-0 w-0">
                {STACK_ITEMS.map((item, i) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  >
                    <item.icon className="size-4 text-white/70" strokeWidth={1.75} />
                    <span className="text-sm text-white/80">{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

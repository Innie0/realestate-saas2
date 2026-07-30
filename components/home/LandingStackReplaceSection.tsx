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
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

type StackItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  scatter: { x: number; y: number; rotate: number };
};

const STACK_ITEMS: StackItem[] = [
  { id: 'leads', label: 'Lead capture forms', icon: FileText, scatter: { x: -280, y: -100, rotate: -22 } },
  { id: 'spreadsheet', label: 'Spreadsheet pipeline', icon: Table2, scatter: { x: 210, y: -150, rotate: 16 } },
  { id: 'listing-copy', label: 'AI / listing copy', icon: Sparkles, scatter: { x: 320, y: 30, rotate: -11 } },
  { id: 'ads', label: 'Meta & Google ads', icon: Megaphone, scatter: { x: -310, y: 70, rotate: 24 } },
  { id: 'calendar', label: 'Google Calendar', icon: CalendarDays, scatter: { x: -100, y: 170, rotate: -16 } },
  { id: 'crm', label: 'CRM & follow-ups', icon: Users, scatter: { x: 90, y: 190, rotate: 19 } },
  { id: 'checklists', label: 'Transaction checklists', icon: ClipboardCheck, scatter: { x: 260, y: -190, rotate: -28 } },
  { id: 'research', label: 'Property research', icon: Search, scatter: { x: -30, y: -230, rotate: 13 } },
];

const CHAOS_LINKS: [number, number][] = [
  [0, 3],
  [1, 6],
  [2, 5],
  [4, 7],
  [3, 6],
];

function getLinePositions(count: number, stageWidth: number) {
  if (stageWidth < 640) {
    const cols = 4;
    const gapX = Math.min(78, Math.max(64, (stageWidth - 32) / cols));
    const gapY = 48;
    return Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: (col - (cols - 1) / 2) * gapX,
        y: (row - 0.5) * gapY,
        rotate: 0,
      };
    });
  }

  const gap = Math.min(138, Math.max(96, (stageWidth - 48) / Math.max(count - 1, 1)));
  return Array.from({ length: count }, (_, i) => ({
    x: (i - (count - 1) / 2) * gap,
    y: 0,
    rotate: 0,
  }));
}

function StaticLineLayout() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      {STACK_ITEMS.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#141414] px-3 py-2 sm:px-4 sm:py-2.5"
        >
          <item.icon className="size-4 text-white/70" strokeWidth={1.75} />
          <span className="text-xs text-white/80 sm:text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function LandingStackReplaceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const linesRef = useRef<SVGSVGElement>(null);
  const reduced = useMotionReduced();

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (reduced || !stage) return;

      const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
      const lines = lineRefs.current.filter(Boolean) as SVGLineElement[];
      let played = false;

      const playSequence = () => {
        if (played) return;
        played = true;

        const linePositions = getLinePositions(STACK_ITEMS.length, stage.offsetWidth);

        items.forEach((el, i) => {
          gsap.set(el, {
            x: STACK_ITEMS[i].scatter.x,
            y: STACK_ITEMS[i].scatter.y,
            rotate: STACK_ITEMS[i].scatter.rotate,
            opacity: 1,
          });
        });

        lines.forEach((line) => {
          const length = line.getTotalLength?.() ?? 200;
          gsap.set(line, { strokeDasharray: length, strokeDashoffset: 0, opacity: 0.35 });
        });
        if (linesRef.current) {
          gsap.set(linesRef.current, { opacity: 1 });
        }

        const tl = gsap.timeline();

        items.forEach((el, i) => {
          tl.to(
            el,
            {
              x: `+=${gsap.utils.random(-36, 36)}`,
              y: `+=${gsap.utils.random(-28, 28)}`,
              rotate: `+=${gsap.utils.random(-18, 18)}`,
              duration: 0.28,
              repeat: 4,
              yoyo: true,
              ease: 'sine.inOut',
            },
            i * 0.04,
          );
        });

        tl.to(
          lines,
          { opacity: 0, duration: 0.35, ease: 'power1.out' },
          0.9,
        );

        if (linesRef.current) {
          tl.to(linesRef.current, { opacity: 0, duration: 0.35, ease: 'power1.out' }, 0.9);
        }

        tl.to(
          items,
          {
            x: (i) => linePositions[i].x,
            y: (i) => linePositions[i].y,
            rotate: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.04,
          },
          1.15,
        );
      };

      ScrollTrigger.create({
        trigger: stage,
        start: 'top 82%',
        once: true,
        onEnter: playSequence,
      });

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === stage) st.kill();
        });
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

        <div
          ref={stageRef}
          className="relative mt-10 flex min-h-[220px] items-center justify-center sm:mt-12 sm:min-h-[260px]"
        >
          {reduced ? (
            <StaticLineLayout />
          ) : (
            <>
              <svg
                ref={linesRef}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                viewBox="-380 -280 760 560"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden
              >
                {CHAOS_LINKS.map(([a, b], i) => (
                  <line
                    key={`${a}-${b}`}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    x1={STACK_ITEMS[a].scatter.x}
                    y1={STACK_ITEMS[a].scatter.y}
                    x2={STACK_ITEMS[b].scatter.x}
                    y2={STACK_ITEMS[b].scatter.y}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth={1}
                    strokeDasharray="4 5"
                  />
                ))}
              </svg>

              <div className="relative h-0 w-0">
                {STACK_ITEMS.map((item, i) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#141414] px-3 py-2 opacity-0 sm:px-4 sm:py-2.5"
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

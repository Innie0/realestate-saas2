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
  { id: 'leads', label: 'Lead capture forms', icon: FileText, scatter: { x: -300, y: -80, rotate: -24 } },
  { id: 'spreadsheet', label: 'Spreadsheet pipeline', icon: Table2, scatter: { x: 280, y: -120, rotate: 18 } },
  { id: 'listing-copy', label: 'AI / listing copy', icon: Sparkles, scatter: { x: 340, y: 60, rotate: -14 } },
  { id: 'ads', label: 'Meta & Google ads', icon: Megaphone, scatter: { x: -340, y: 90, rotate: 26 } },
  { id: 'calendar', label: 'Google Calendar', icon: CalendarDays, scatter: { x: -160, y: 200, rotate: -18 } },
  { id: 'crm', label: 'CRM & follow-ups', icon: Users, scatter: { x: 120, y: 210, rotate: 20 } },
  { id: 'checklists', label: 'Transaction checklists', icon: ClipboardCheck, scatter: { x: 300, y: -200, rotate: -30 } },
  { id: 'research', label: 'Property research', icon: Search, scatter: { x: 20, y: -240, rotate: 12 } },
];

const CHAOS_LINKS: [number, number][] = [
  [0, 3],
  [1, 6],
  [2, 5],
  [4, 7],
  [3, 6],
];

type Point = { x: number; y: number; rotate: number };

function measureFlexLinePositions(stage: HTMLElement, items: HTMLElement[]): Point[] {
  const measurer = document.createElement('div');
  measurer.className =
    'pointer-events-none absolute left-1/2 top-1/2 flex w-full max-w-[min(100%,920px)] -translate-x-1/2 -translate-y-1/2 flex-wrap items-center justify-center gap-2.5 sm:gap-3';
  measurer.style.visibility = 'hidden';
  stage.appendChild(measurer);

  const clones = items.map((item) => {
    const clone = item.cloneNode(true) as HTMLElement;
    clone.style.position = 'relative';
    clone.style.opacity = '1';
    clone.style.transform = 'none';
    measurer.appendChild(clone);
    return clone;
  });

  const stageRect = stage.getBoundingClientRect();
  const positions = clones.map((clone) => {
    const rect = clone.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - (stageRect.left + stageRect.width / 2),
      y: rect.top + rect.height / 2 - (stageRect.top + stageRect.height / 2),
      rotate: 0,
    };
  });

  measurer.remove();
  return positions;
}

function addSwirlMotion(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  index: number,
  total: number,
  startAt: number,
) {
  const loops = index % 2 === 0 ? 3.2 : -2.6;
  const baseRadius = 88 + (index % 5) * 28;
  const startAngle = (index / total) * Math.PI * 2;
  const proxy = { p: 0 };

  tl.to(
    proxy,
    {
      p: 1,
      duration: 2.1,
      ease: 'none',
      onUpdate: () => {
        const angle = startAngle + proxy.p * Math.PI * 2 * loops;
        const pulse = Math.sin(proxy.p * Math.PI * 5) * 22;
        const radius = baseRadius + pulse;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.72;

        gsap.set(el, {
          x,
          y,
          rotate: angle * (180 / Math.PI) * 0.08 + (index % 2 === 0 ? 1 : -1) * 12,
          zIndex: Math.round(y),
        });
      },
    },
    startAt,
  );
}

function StaticLineLayout() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
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

        const linePositions = measureFlexLinePositions(stage, items);

        items.forEach((el, i) => {
          gsap.set(el, {
            x: STACK_ITEMS[i].scatter.x,
            y: STACK_ITEMS[i].scatter.y,
            rotate: STACK_ITEMS[i].scatter.rotate,
            opacity: 1,
            zIndex: Math.round(STACK_ITEMS[i].scatter.y),
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
          addSwirlMotion(tl, el, i, items.length, i * 0.06);
        });

        tl.to(lines, { opacity: 0, duration: 0.45, ease: 'power1.out' }, 0.35);

        if (linesRef.current) {
          tl.to(linesRef.current, { opacity: 0, duration: 0.45, ease: 'power1.out' }, 0.35);
        }

        tl.to(
          items,
          {
            x: (i) => linePositions[i].x,
            y: (i) => linePositions[i].y,
            rotate: 0,
            duration: 0.95,
            ease: 'power3.out',
            stagger: { each: 0.05, from: 'center' },
          },
          2.05,
        );

        tl.set(items, { zIndex: 1 }, 2.05);
      };

      const trigger = ScrollTrigger.create({
        trigger: stage,
        start: 'top 82%',
        once: true,
        onEnter: playSequence,
      });

      return () => {
        trigger.kill();
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
          className="relative mt-10 flex min-h-[300px] items-center justify-center overflow-hidden sm:mt-12 sm:min-h-[340px]"
        >
          {reduced ? (
            <StaticLineLayout />
          ) : (
            <>
              <svg
                ref={linesRef}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                viewBox="-400 -300 800 600"
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

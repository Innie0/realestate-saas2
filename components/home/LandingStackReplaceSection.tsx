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

const COL_SPACING = 235;
const ROW_GAP = 52;

const linePos = (col: number, row: number) => ({
  x: (col - 1.5) * COL_SPACING,
  y: (row - 0.5) * ROW_GAP,
  rotate: 0,
});

type StackItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  line: { x: number; y: number; rotate: number };
};

const STACK_ITEMS: StackItem[] = [
  {
    id: 'leads',
    label: 'Lead capture forms',
    icon: FileText,
    line: linePos(0, 0),
  },
  {
    id: 'spreadsheet',
    label: 'Spreadsheet pipeline',
    icon: Table2,
    line: linePos(1, 0),
  },
  {
    id: 'listing-copy',
    label: 'AI / listing copy',
    icon: Sparkles,
    line: linePos(2, 0),
  },
  {
    id: 'ads',
    label: 'Meta & Google ads',
    icon: Megaphone,
    line: linePos(3, 0),
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    icon: CalendarDays,
    line: linePos(0, 1),
  },
  {
    id: 'crm',
    label: 'CRM & follow-ups',
    icon: Users,
    line: linePos(1, 1),
  },
  {
    id: 'checklists',
    label: 'Transaction checklists',
    icon: ClipboardCheck,
    line: linePos(2, 1),
  },
  {
    id: 'research',
    label: 'Property research',
    icon: Search,
    line: linePos(3, 1),
  },
];

const SCRAMBLE_WAYPOINTS: { x: number; y: number; rotate: number }[][] = [
  [
    { x: -260, y: -140, rotate: -18 },
    { x: 140, y: 80, rotate: 25 },
    { x: -180, y: 60, rotate: -30 },
  ],
  [
    { x: 180, y: -170, rotate: 12 },
    { x: -220, y: 100, rotate: -22 },
    { x: 60, y: -60, rotate: 18 },
  ],
  [
    { x: 320, y: 40, rotate: -9 },
    { x: -100, y: -180, rotate: 20 },
    { x: 200, y: 120, rotate: -25 },
  ],
  [
    { x: -320, y: 90, rotate: 22 },
    { x: 90, y: -140, rotate: -16 },
    { x: -60, y: 180, rotate: 28 },
  ],
  [
    { x: -140, y: 190, rotate: -14 },
    { x: 260, y: -60, rotate: 19 },
    { x: -220, y: -100, rotate: -20 },
  ],
  [
    { x: 60, y: 210, rotate: 17 },
    { x: -180, y: -80, rotate: -24 },
    { x: 140, y: 140, rotate: 15 },
  ],
  [
    { x: 250, y: -240, rotate: -25 },
    { x: -80, y: 60, rotate: 21 },
    { x: 220, y: -20, rotate: -18 },
  ],
  [
    { x: -40, y: -260, rotate: 15 },
    { x: 180, y: 160, rotate: -19 },
    { x: -140, y: -40, rotate: 23 },
  ],
];

function StaticLineLayout() {
  const pillClass =
    'flex items-center gap-2 rounded-full border border-white/10 bg-[#141414] px-3 py-2 sm:px-4 sm:py-2.5';
  const rowClass = 'flex flex-wrap items-center justify-center gap-2.5 sm:gap-3';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={rowClass}>
        {STACK_ITEMS.slice(0, 4).map((item) => (
          <div key={item.id} className={pillClass}>
            <item.icon className="size-4 text-white/70" strokeWidth={1.75} />
            <span className="text-xs text-white/80 sm:text-sm">{item.label}</span>
          </div>
        ))}
      </div>
      <div className={rowClass}>
        {STACK_ITEMS.slice(4).map((item) => (
          <div key={item.id} className={pillClass}>
            <item.icon className="size-4 text-white/70" strokeWidth={1.75} />
            <span className="text-xs text-white/80 sm:text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingStackReplaceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useMotionReduced();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];

      items.forEach((el, i) => {
        const start = SCRAMBLE_WAYPOINTS[i][0];
        gsap.set(el, {
          x: start.x,
          y: start.y,
          rotate: start.rotate,
          opacity: 1,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
          once: true,
        },
      });

      items.forEach((el, i) => {
        const waypoints = SCRAMBLE_WAYPOINTS[i];
        tl.to(
          el,
          {
            keyframes: [
              {
                x: waypoints[1].x,
                y: waypoints[1].y,
                rotate: waypoints[1].rotate,
                duration: 0.28,
              },
              {
                x: waypoints[2].x,
                y: waypoints[2].y,
                rotate: waypoints[2].rotate,
                duration: 0.28,
              },
            ],
            ease: 'power1.inOut',
          },
          i * 0.03,
        ).to(
          el,
          {
            x: STACK_ITEMS[i].line.x,
            y: STACK_ITEMS[i].line.y,
            rotate: 0,
            duration: 0.55,
            ease: 'back.out(1.5)',
          },
          '>-0.05',
        );
      });

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

        <div
          ref={stageRef}
          className="relative mt-10 flex min-h-[300px] items-center justify-center overflow-hidden sm:mt-12 sm:min-h-[340px]"
        >
          {reduced ? (
            <StaticLineLayout />
          ) : (
            <div className="relative h-0 w-0 scale-[0.58] sm:scale-[0.78] lg:scale-100">
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
          )}
        </div>
      </div>
    </div>
  );
}

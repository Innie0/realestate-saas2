'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { useMotionReduced } from '@/lib/motion';

const SCORES = ['Hot', 'Warm', 'Cold'] as const;

const SCORE_COLORS: Record<(typeof SCORES)[number], string> = {
  Hot: '#FB7185',
  Warm: '#FBBF24',
  Cold: '#7DD3FC',
};

const LEADS: { name: string; source: string; score: (typeof SCORES)[number] }[] = [
  { name: 'Sarah Chen', source: 'Open house sign-in', score: 'Hot' },
  { name: 'Marcus Webb', source: 'Website inquiry', score: 'Warm' },
  { name: 'Elena Torres', source: 'Zillow contact form', score: 'Cold' },
];

export function LandingLeadsDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeScore, setActiveScore] = useState(0);
  const reduced = useMotionReduced();

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="rounded-3xl p-6 sm:p-7"
        style={{ background: 'linear-gradient(135deg, #0668E1 0%, #2E86FB 100%)' }}
      >
        <DemoToolbar label="Leads inbox" icons={[Search, Filter, SlidersHorizontal]} />

        {/* Dashed outline reads as an active/live-updating list region */}
        <div className="rounded-xl border border-dashed border-white/30 p-3">
          <div className="space-y-2">
            {LEADS.map((lead, i) => (
              <motion.div
                key={lead.name}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.2 }}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{lead.name}</p>
                  <p className="truncate text-[11px] text-white/60">{lead.source}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: SCORE_COLORS[lead.score] }}
                  />
                  {lead.score}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button
          type="button"
          tabIndex={-1}
          aria-hidden
          initial={reduced ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.5 }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/30 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/50 hover:text-white"
        >
          View inbox
          <ArrowRight size={12} />
        </motion.button>
      </motion.div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps the
          card's bottom-right corner from sm: up, where it clears the card content. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
        className="relative mt-4 w-full rounded-2xl border border-black/10 bg-white p-4 shadow-lg sm:absolute sm:-bottom-16 sm:-right-8 sm:mt-0 sm:w-64"
      >
        <p className="mb-3 text-xs font-medium text-black/80">AI Assistant</p>
        <p className="mb-2 text-[11px] text-black/40">Score</p>
        <div className="flex flex-wrap gap-1.5">
          {SCORES.map((score, i) => (
            <button
              key={score}
              type="button"
              onClick={() => setActiveScore(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activeScore === i ? '#0668E1' : '#F3F4F6',
                color: activeScore === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {score}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingLeadsDemo;

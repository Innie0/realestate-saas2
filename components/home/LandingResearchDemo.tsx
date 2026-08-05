'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { BarChart3, Download, MapPin, Search } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { useMotionReduced } from '@/lib/motion';

const STATS = [
  { label: 'Beds', value: '3' },
  { label: 'Baths', value: '2' },
  { label: 'Sq Ft', value: '1,850' },
  { label: 'Built', value: '2004' },
];

const COMP_FILTERS = ['Sold', 'Active', 'Both'];

/** Illustrated card for the "Research the property" How To step — built from
 *  real UI elements (address lookup, stat chips, CMA valuation), not a screenshot.
 *  White surface with a soft blue tint, distinct from the saturated gradient
 *  cards used in the "Why Oikaro" section. */
export function LandingResearchDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeFilter, setActiveFilter] = useState(0);
  const reduced = useMotionReduced();

  return (
    <div ref={ref} className="relative w-full">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[16px] border border-[#0668E1]/10 bg-gradient-to-br from-white via-[#F6FAFF] to-[#E8F1FE] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0668E1]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#0668E1]/[0.06] blur-3xl" />

        <div className="relative z-[1] flex flex-1 flex-col">
          <DemoToolbar light label="Property research" icons={[Search, MapPin, BarChart3]} />

          <div className="mt-1 flex-1 rounded-xl border border-dashed border-[#0668E1]/20 p-5">
            <motion.p
              initial={reduced ? false : { opacity: 0, y: -6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center gap-1.5 text-sm font-medium text-[#5B6472]"
            >
              <Search size={13} className="shrink-0" />
              742 Oak Street, Austin, TX
            </motion.p>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: -6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="mt-2 text-lg font-semibold text-[#111111] sm:text-xl"
            >
              Owner: Marjorie Kessler
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {STATS.map((stat) => (
                <span
                  key={stat.label}
                  className="rounded-full bg-[#0668E1]/[0.07] px-3 py-1.5 text-xs text-[#111111]"
                >
                  <span className="font-semibold">{stat.value}</span>{' '}
                  <span className="text-[#6B6D76]">{stat.label}</span>
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.9 }}
              className="mt-5 rounded-lg border border-[#0668E1]/10 bg-white p-4 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6D76]">
                Estimated value
              </p>
              <p className="mt-1.5 text-2xl font-bold text-[#0668E1] sm:text-3xl">$625K</p>
              <p className="mt-1 text-xs text-[#6B6D76]">
                Range $610K – $640K · 6 comparable sales
              </p>
            </motion.div>
          </div>

          <motion.button
            type="button"
            tabIndex={-1}
            aria-hidden
            initial={reduced ? false : { opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 1.35 }}
            className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-[#0668E1]/25 px-3 py-1.5 text-xs text-[#0668E1]/80 transition-colors hover:border-[#0668E1]/50 hover:text-[#0668E1]"
          >
            <Download size={12} />
            Export PDF
          </motion.button>
        </div>
      </div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps
          the card's bottom-right corner from sm: up, where it clears the content. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.05, ease: 'easeOut' }}
        className="relative mt-4 w-full rounded-2xl border border-[#0668E1]/15 bg-white p-4 shadow-lg sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 sm:w-44"
      >
        <p className="mb-3 text-xs font-medium text-black/80">AI Assistant</p>
        <p className="mb-2 text-[11px] text-black/40">Comps</p>
        <div className="flex flex-wrap gap-1.5">
          {COMP_FILTERS.map((filter, i) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activeFilter === i ? '#0668E1' : '#F3F4F6',
                color: activeFilter === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingResearchDemo;

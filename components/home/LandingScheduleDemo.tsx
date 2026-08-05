'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { motion, useInView } from 'framer-motion';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { BackgroundGradientGlow } from '@/components/ui/background-gradient-glow';
import { useMotionReduced } from '@/lib/motion';

const DAYS = [
  { label: 'M', date: 10 },
  { label: 'T', date: 11 },
  { label: 'W', date: 12 },
  { label: 'T', date: 13 },
  { label: 'F', date: 14 },
  { label: 'S', date: 15 },
  { label: 'S', date: 16 },
];

const SYNC_OPTIONS = ['Google', 'Outlook', 'iCal'];

/** Illustrated card for the "Get it on the calendar" How To step — a
 *  click-to-select week strip (the selection glides over) plus a synced
 *  showing card. Built from real UI elements, not a screenshot. */
export function LandingScheduleDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeDay, setActiveDay] = useState(3);
  const [activeSync, setActiveSync] = useState(0);
  const reduced = useMotionReduced();

  return (
    <div ref={ref} className="relative w-full">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[16px] p-6 sm:p-8">
        <BackgroundGradientGlow variant="schedule" className="rounded-[16px]" />
        <div className="absolute inset-0 rounded-[16px] bg-black/20" />

        <div className="relative z-[1] flex flex-1 flex-col">
          <DemoToolbar label="Showings & calendar" icons={[Calendar, Clock, MapPin]} />

          <div className="mt-1 flex-1 rounded-xl border border-dashed border-white/30 p-5">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center gap-1"
            >
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveDay(i)}
                  className="relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium text-white/60 transition-colors hover:text-white"
                >
                  {activeDay === i && (
                    <motion.span
                      layoutId="schedule-active-day"
                      className="absolute inset-0 rounded-lg bg-white"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span
                    className={clsx(
                      'relative z-[1] uppercase',
                      activeDay === i && 'text-[#0668E1]',
                    )}
                  >
                    {day.label}
                  </span>
                  <span
                    className={clsx(
                      'relative z-[1] text-[13px] font-semibold',
                      activeDay === i ? 'text-[#0668E1]' : 'text-white',
                    )}
                  >
                    {day.date}
                  </span>
                </button>
              ))}
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.75 }}
              className="mt-5 rounded-lg bg-white/10 p-4"
            >
              <p className="text-sm font-semibold text-white">Showing — 742 Oak St</p>
              <p className="mt-1 text-xs text-white/60">2:00 PM · Sarah Chen</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                Synced to Google Calendar
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps
          the card's bottom-right corner from sm: up, where it clears the content. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.05, ease: 'easeOut' }}
        className="relative mt-4 w-full rounded-2xl border border-black/10 bg-white p-4 shadow-lg sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 sm:w-44"
      >
        <p className="mb-3 text-xs font-medium text-black/80">AI Assistant</p>
        <p className="mb-2 text-[11px] text-black/40">Sync with</p>
        <div className="flex flex-wrap gap-1.5">
          {SYNC_OPTIONS.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => setActiveSync(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activeSync === i ? '#0668E1' : '#F3F4F6',
                color: activeSync === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingScheduleDemo;

'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';

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
 *  showing card. Built from real UI elements, not a screenshot. White surface
 *  with a soft blue tint, distinct from the saturated gradient cards used in
 *  the "Why Oikaro" section. */
export function LandingScheduleDemo() {
  const [activeDay, setActiveDay] = useState(3);
  const [activeSync, setActiveSync] = useState(0);

  return (
    <div className="relative w-full">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[16px] border border-[#0668E1]/10 bg-gradient-to-br from-white via-[#F6FAFF] to-[#E8F1FE] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0668E1]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#0668E1]/[0.06] blur-3xl" />

        <div className="relative z-[1] flex flex-1 flex-col">
          <DemoToolbar light label="Showings & calendar" icons={[Calendar, Clock, MapPin]} />

          <div className="mt-1 flex-1 rounded-xl border border-dashed border-[#0668E1]/20 p-5">
            <div className="flex items-center gap-1">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveDay(i)}
                  className="relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#111111]"
                >
                  {activeDay === i && (
                    <motion.span
                      layoutId="schedule-active-day"
                      className="absolute inset-0 rounded-lg bg-[#0668E1]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span
                    className={clsx(
                      'relative z-[1] uppercase',
                      activeDay === i ? 'text-white/80' : 'text-[#9AA1AC]',
                    )}
                  >
                    {day.label}
                  </span>
                  <span
                    className={clsx(
                      'relative z-[1] text-[13px] font-semibold',
                      activeDay === i ? 'text-white' : 'text-[#111111]',
                    )}
                  >
                    {day.date}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 max-w-[280px] rounded-lg border border-[#0668E1]/10 bg-white p-4 shadow-sm sm:max-w-[300px]">
              <p className="text-sm font-semibold text-[#111111]">Showing — 742 Oak St</p>
              <p className="mt-1 text-xs text-[#6B6D76]">2:00 PM · Sarah Chen</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#0668E1]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0668E1]">
                Synced to Google Calendar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps
          the card's bottom-right corner from sm: up, where it clears the content. */}
      <div className="relative z-20 mt-4 w-full rounded-2xl border border-[#0668E1]/15 bg-white p-4 shadow-lg sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 sm:w-44">
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
      </div>
    </div>
  );
}

export default LandingScheduleDemo;

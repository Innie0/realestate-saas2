'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, Check, CheckSquare, FileText, Plus } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { BackgroundGradientGlow } from '@/components/ui/background-gradient-glow';
import { useMotionReduced } from '@/lib/motion';

const STAGES = ['Active', 'Pending', 'Closed'] as const;

const CHECKLIST: { label: string; done: boolean }[] = [
  { label: 'Inspection scheduled', done: true },
  { label: 'Title search ordered', done: true },
  { label: 'Appraisal received', done: false },
  { label: 'Closing disclosure sent', done: false },
];

export function LandingTransactionsDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeStage, setActiveStage] = useState(0);
  const reduced = useMotionReduced();

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7"
      >
        <BackgroundGradientGlow variant="transactions" className="rounded-3xl" />
        <div className="absolute inset-0 rounded-3xl bg-black/20" />

        <div className="relative z-[1]">
          <DemoToolbar label="Closing checklist" icons={[CheckSquare, Calendar, FileText]} />

          {/* Dashed outline reads as an active/tracked checklist region */}
          <div className="rounded-xl border border-dashed border-white/30 p-3">
            <div className="space-y-2">
              {CHECKLIST.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.18 }}
                  className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5"
                >
                  <span
                    className={
                      item.done
                        ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white'
                        : 'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/40'
                    }
                  >
                    {item.done && <Check size={12} strokeWidth={3} className="text-[#0668E1]" />}
                  </span>
                  <p
                    className={
                      item.done
                        ? 'text-sm text-white/55 line-through'
                        : 'text-sm font-medium text-white'
                    }
                  >
                    {item.label}
                  </p>
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
            <Plus size={12} />
            Add reminder
          </motion.button>
        </div>
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
        <p className="mb-2 text-[11px] text-black/40">Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((stage, i) => (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveStage(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activeStage === i ? '#0668E1' : '#F3F4F6',
                color: activeStage === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {stage}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingTransactionsDemo;

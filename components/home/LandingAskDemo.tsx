'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { BackgroundGradientGlow } from '@/components/ui/background-gradient-glow';
import { useMotionReduced } from '@/lib/motion';

const PROMPTS = ['Follow up', 'Schedule showing', 'Summarize call'];

/** Illustrated card for the "Let AI handle the busywork" How To step — a chat
 *  thread showing the AI Assistant actually finishing a task, not just an
 *  empty input box. Built from real UI elements, not a screenshot. */
export function LandingAskDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activePrompt, setActivePrompt] = useState(0);
  const reduced = useMotionReduced();

  return (
    <div ref={ref} className="relative w-full">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[16px] p-6 sm:p-8">
        <BackgroundGradientGlow variant="ask" className="rounded-[16px]" />
        <div className="absolute inset-0 rounded-[16px] bg-black/20" />

        <div className="relative z-[1] flex flex-1 flex-col">
          <DemoToolbar label="AI Assistant" icons={[Sparkles, MessageSquare, RefreshCw]} />

          <div className="mt-1 flex-1 space-y-3 rounded-xl border border-dashed border-white/30 p-5">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-white/15 px-4 py-2.5 text-sm text-white"
            >
              Draft a follow-up to Sarah about the Elm Ave showing
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white/10 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                Subject: Following up on 123 Elm Ave
              </p>
              <p className="mt-2 text-sm leading-snug text-white/85">
                Great meeting you at the showing today — I think this one checks a lot of your
                boxes.
              </p>
              <p className="mt-1.5 text-sm leading-snug text-white/85">
                Let me know if you&apos;d like to schedule a second walkthrough this week.
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
            className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-white/30 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/50 hover:text-white"
          >
            <Sparkles size={12} />
            Insert into email
          </motion.button>
        </div>
      </div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps
          the card's bottom-right corner from sm: up, where it clears the content. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.1, ease: 'easeOut' }}
        className="relative mt-4 w-full rounded-2xl border border-black/10 bg-white p-4 shadow-lg sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 sm:w-52"
      >
        <p className="mb-3 text-xs font-medium text-black/80">AI Assistant</p>
        <p className="mb-2 text-[11px] text-black/40">Quick prompts</p>
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map((prompt, i) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setActivePrompt(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activePrompt === i ? '#0668E1' : '#F3F4F6',
                color: activePrompt === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingAskDemo;

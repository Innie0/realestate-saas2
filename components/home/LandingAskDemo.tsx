'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { useMotionReduced } from '@/lib/motion';

const PROMPTS = ['Follow up', 'Schedule showing', 'Summarize call'];

/** Illustrated card for the "Let AI handle the busywork" How To step — a chat
 *  thread showing the AI Assistant actually finishing a task, not just an
 *  empty input box. Built from real UI elements, not a screenshot. White
 *  surface with a soft blue tint, distinct from the saturated gradient cards
 *  used in the "Why Oikaro" section. */
export function LandingAskDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activePrompt, setActivePrompt] = useState(0);
  const reduced = useMotionReduced();

  return (
    <div ref={ref} className="relative w-full">
      {/* Main illustrated card — built from real UI elements, not a screenshot */}
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[16px] border border-[#0668E1]/10 bg-gradient-to-br from-white via-[#F6FAFF] to-[#E8F1FE] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0668E1]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#0668E1]/[0.06] blur-3xl" />

        <div className="relative z-[1] flex flex-1 flex-col">
          <DemoToolbar light label="AI Assistant" icons={[Sparkles, MessageSquare, RefreshCw]} />

          <div className="mt-1 flex-1 space-y-3 rounded-xl border border-dashed border-[#0668E1]/20 p-5">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#0668E1] px-4 py-2.5 text-sm text-white shadow-sm"
            >
              Draft a follow-up to Sarah about the Elm Ave showing
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="max-w-[92%] rounded-2xl rounded-tl-sm border border-[#0668E1]/10 bg-white p-4 shadow-sm sm:max-w-[300px]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0668E1]/70">
                Subject: Following up on 123 Elm Ave
              </p>
              <p className="mt-2 text-sm leading-snug text-[#3B4552]">
                Great meeting you at the showing today — I think this one checks a lot of your
                boxes.
              </p>
              <p className="mt-1.5 text-sm leading-snug text-[#3B4552]">
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
            className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-[#0668E1]/25 px-3 py-1.5 text-xs text-[#0668E1]/80 transition-colors hover:border-[#0668E1]/50 hover:text-[#0668E1]"
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
        className="relative z-20 mt-4 w-full rounded-2xl border border-[#0668E1]/15 bg-white p-4 shadow-lg sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 sm:w-52"
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

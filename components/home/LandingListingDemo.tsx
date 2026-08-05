'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlignLeft, Bold, Palette, Sparkles } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { BackgroundGradientGlow } from '@/components/ui/background-gradient-glow';
import { useMotionReduced } from '@/lib/motion';

const TONES = ['Professional', 'Luxury', 'Friendly'];

const LISTING_LINES = [
  { text: 'Stunning 3-bed, 2-bath home in the heart of Austin.', muted: false },
  { text: 'Freshly renovated kitchen with quartz countertops.', muted: false },
  { text: 'Private backyard, perfect for entertaining guests.', muted: false },
  { text: 'Minutes from downtown and top-rated schools.', muted: true },
];

export function LandingListingDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activeTone, setActiveTone] = useState(0);
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
        <BackgroundGradientGlow variant="listings" className="rounded-3xl" />
        <div className="absolute inset-0 rounded-3xl bg-black/20" />

        <div className="relative z-[1]">
          <DemoToolbar label="Listing description" icons={[AlignLeft, Bold, Palette]} />

          {/* Dashed outline reads as an active/editable text region */}
          <div className="rounded-xl border border-dashed border-white/30 p-4">
            <div className="space-y-2.5">
              {LISTING_LINES.map((line, i) => (
                <motion.div
                  key={line.text}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.2 }}
                  className={
                    line.muted
                      ? 'text-sm leading-snug text-white/60'
                      : 'text-base font-medium leading-snug text-white sm:text-lg'
                  }
                >
                  {line.text}
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
            <Sparkles size={12} />
            Generate more
          </motion.button>
        </div>
      </motion.div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps the
          card's bottom-right corner from sm: up, where it clears the card content. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
        className="relative mt-4 w-full rounded-2xl border border-black/10 bg-white p-4 shadow-lg sm:absolute sm:-bottom-20 sm:-right-8 sm:mt-0 sm:w-64"
      >
        <p className="mb-3 text-xs font-medium text-black/80">AI Assistant</p>
        <p className="mb-2 text-[11px] text-black/40">Tone</p>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((tone, i) => (
            <button
              key={tone}
              type="button"
              onClick={() => setActiveTone(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activeTone === i ? '#0668E1' : '#F3F4F6',
                color: activeTone === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {tone}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingListingDemo;

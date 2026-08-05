'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useMotionReduced } from '@/lib/motion';

const TONES = ['Professional', 'Luxury', 'Friendly'];

const LISTING_LINES = [
  'Stunning 3-bed, 2-bath home in the heart of Austin.',
  'Freshly renovated kitchen with quartz countertops.',
  'Private backyard, perfect for entertaining guests.',
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
        className="rounded-3xl p-8 sm:p-10 min-h-[320px]"
        style={{ background: 'linear-gradient(135deg, #0668E1 0%, #2E86FB 100%)' }}
      >
        <p className="mb-4 text-xs uppercase tracking-wide text-white/60">Listing description</p>
        <div className="space-y-3">
          {LISTING_LINES.map((line, i) => (
            <motion.div
              key={line}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.25 }}
              className="text-lg font-medium leading-snug text-white"
            >
              {line}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating settings panel — stacks below the card on mobile; overlaps the
          card's bottom-right corner from sm: up, where the listing lines stay
          on one line and always clear the panel's top edge. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
        className="relative mt-4 w-full rounded-2xl border border-black/10 bg-white p-4 shadow-lg sm:absolute sm:-bottom-8 sm:-right-8 sm:mt-0 sm:w-64"
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

'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { BarChart3, Megaphone, Plus, Target } from 'lucide-react';
import { DemoToolbar } from '@/components/home/LandingDemoToolbar';
import { BackgroundGradientGlow } from '@/components/ui/background-gradient-glow';
import { useMotionReduced } from '@/lib/motion';

const PLATFORMS = ['Google', 'Meta', 'Both'] as const;

const PLATFORM_BADGE: Record<string, { letter: string; color: string }> = {
  Google: { letter: 'G', color: '#EA4335' },
  Meta: { letter: 'M', color: '#0668E1' },
};

const CAMPAIGNS: { platform: 'Google' | 'Meta'; name: string; reach: string }[] = [
  { platform: 'Google', name: '3-bed on Maple St.', reach: '1.2k reach' },
  { platform: 'Meta', name: 'Open House Sat 2pm', reach: '860 reach' },
  { platform: 'Google', name: 'Just listed — Elm Ave', reach: '2.4k reach' },
];

export function LandingAdsDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [activePlatform, setActivePlatform] = useState(0);
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
        <BackgroundGradientGlow variant="ads" className="rounded-3xl" />
        <div className="absolute inset-0 rounded-3xl bg-black/20" />

        <div className="relative z-[1]">
          <DemoToolbar label="Active campaigns" icons={[Megaphone, Target, BarChart3]} />

          {/* Dashed outline reads as an active/live-updating campaign list */}
          <div className="rounded-xl border border-dashed border-white/30 p-3">
            <div className="space-y-2">
              {CAMPAIGNS.map((campaign, i) => (
                <motion.div
                  key={campaign.name}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.2 }}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold"
                      style={{ color: PLATFORM_BADGE[campaign.platform].color }}
                    >
                      {PLATFORM_BADGE[campaign.platform].letter}
                    </span>
                    <p className="truncate text-sm font-medium text-white">{campaign.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {campaign.reach}
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
            <Plus size={12} />
            New campaign
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
        <p className="mb-2 text-[11px] text-black/40">Platform</p>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((platform, i) => (
            <button
              key={platform}
              type="button"
              onClick={() => setActivePlatform(i)}
              className="rounded-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: activePlatform === i ? '#0668E1' : '#F3F4F6',
                color: activePlatform === i ? '#FFFFFF' : '#6B6D76',
              }}
            >
              {platform}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LandingAdsDemo;

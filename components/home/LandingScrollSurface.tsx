'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useMotionReduced } from '@/lib/motion';

/** Warm desert sand — scroll target (Solidroad-inspired) */
export const MKT_SAND = '#ede6d6';
export const MKT_SAND_DEEP = '#e3d9c8';
export const MKT_WHITE = '#ffffff';

type LandingScrollSurfaceProps = {
  children: React.ReactNode;
};

export default function LandingScrollSurface({ children }: LandingScrollSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMotionReduced();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.42, 0.78, 1],
    [MKT_WHITE, '#f4ede3', MKT_SAND, MKT_SAND_DEEP],
  );

  return (
    <motion.div
      ref={ref}
      style={{ backgroundColor: reduced ? MKT_SAND : backgroundColor }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}

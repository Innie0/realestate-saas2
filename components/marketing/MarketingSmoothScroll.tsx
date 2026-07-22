'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { ensureGsapRegistered, gsap, ScrollTrigger } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

type MarketingSmoothScrollProps = {
  children: React.ReactNode;
};

ensureGsapRegistered();

/** Lenis smooth scroll wired to GSAP ScrollTrigger (marketing pages only). */
export default function MarketingSmoothScroll({ children }: MarketingSmoothScrollProps) {
  const reduced = useMotionReduced();

  useEffect(() => {
    if (reduced || typeof window === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return children;
}

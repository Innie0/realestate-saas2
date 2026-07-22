'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import {
  ensureGsapRegistered,
  gsap,
  landingRevealDefaults,
  ScrollTrigger,
  useGSAP,
} from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

type LandingScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Stagger index for batch sections */
  delay?: number;
  as?: 'div' | 'section' | 'article';
};

ensureGsapRegistered();

export default function LandingScrollReveal({
  children,
  className,
  style,
  delay = 0,
  as: Tag = 'div',
}: LandingScrollRevealProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;

      gsap.set(ref.current, { autoAlpha: 0, y: landingRevealDefaults.y });

      gsap.to(ref.current, {
        autoAlpha: 1,
        y: 0,
        duration: landingRevealDefaults.duration,
        ease: landingRevealDefaults.ease,
        delay,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 88%',
          once: true,
        },
      });
    },
    { scope: ref, dependencies: [reduced, delay] },
  );

  useGSAP(
    () => {
      if (reduced) return;
      ScrollTrigger.refresh();
    },
    { dependencies: [reduced] },
  );

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={clsx(!reduced && 'landing-reveal-pending', className)}
      style={style}
    >
      {children}
    </Tag>
  );
}

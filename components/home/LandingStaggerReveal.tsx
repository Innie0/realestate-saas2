'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { scrollStaggerReveal } from '@/lib/landing-motion';
import { useMotionReduced } from '@/lib/motion';

type LandingStaggerRevealProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  as?: 'div' | 'section' | 'article';
};

ensureGsapRegistered();

export default function LandingStaggerReveal({
  children,
  className,
  style,
  stagger,
  as: Tag = 'div',
}: LandingStaggerRevealProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      scrollStaggerReveal(ref.current, { stagger });
    },
    { scope: ref, dependencies: [reduced, stagger] },
  );

  useGSAP(
    () => {
      if (reduced) return;
      ScrollTrigger.refresh();
    },
    { dependencies: [reduced] },
  );

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={clsx(className)} style={style}>
      {children}
    </Tag>
  );
}

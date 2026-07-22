'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, useGSAP } from '@/lib/gsap-config';
import { bindHoverMotion } from '@/lib/landing-motion';
import { useMotionReduced } from '@/lib/motion';

type HoverMotionCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'article';
};

ensureGsapRegistered();

export default function HoverMotionCard({
  children,
  className,
  style,
  as: Tag = 'div',
}: HoverMotionCardProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      return bindHoverMotion(ref.current);
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={clsx('will-change-transform', className)}
      style={style}
    >
      {children}
    </Tag>
  );
}

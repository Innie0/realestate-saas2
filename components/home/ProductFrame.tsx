'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, useGSAP } from '@/lib/gsap-config';
import { bindHoverMotion } from '@/lib/landing-motion';
import { useMotionReduced } from '@/lib/motion';

type ProductFrameProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
};

ensureGsapRegistered();

/** Minimal macOS-style window chrome for product screenshots */
export default function ProductFrame({ children, className = '', interactive = true }: ProductFrameProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!interactive || reduced || !ref.current) return;
      return bindHoverMotion(ref.current, { scale: 1.008, y: -4, duration: 0.32 });
    },
    { scope: ref, dependencies: [interactive, reduced] },
  );

  return (
    <div
      ref={ref}
      className={clsx(
        'overflow-hidden rounded-mkt-browser border border-mkt-border bg-mkt-surface will-change-transform',
        className,
      )}
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <div
        className="flex h-9 items-center gap-1.5 border-b border-mkt-border bg-mkt-surface-muted px-3.5"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 rounded-full bg-mkt-dot" />
        ))}
      </div>
      <div className="bg-mkt-mock">{children}</div>
    </div>
  );
}

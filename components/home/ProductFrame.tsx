'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, useGSAP } from '@/lib/gsap-config';
import { bindHoverMotion } from '@/lib/landing-motion';
import { MKT } from '@/lib/marketing-design';
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
      className={clsx('overflow-hidden will-change-transform', className)}
      style={{
        borderRadius: MKT.radius.browser,
        border: `1px solid ${MKT.border}`,
        backgroundColor: MKT.surface,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3.5"
        style={{ height: 36, borderBottom: `1px solid ${MKT.border}`, backgroundColor: MKT.surfaceMuted }}
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full"
            style={{ width: 10, height: 10, backgroundColor: MKT.browserDot }}
          />
        ))}
      </div>
      <div style={{ backgroundColor: MKT.mockSurface }}>{children}</div>
    </div>
  );
}

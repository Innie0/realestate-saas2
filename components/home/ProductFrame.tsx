'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
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
      const el = ref.current;

      const onEnter = () => {
        gsap.to(el, { y: -4, duration: 0.45, ease: 'power2.out' });
      };
      const onLeave = () => {
        gsap.to(el, { y: 0, duration: 0.45, ease: 'power2.out' });
      };

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      return () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      };
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

'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

type AuthPageMotionProps = {
  children: React.ReactNode;
  className?: string;
};

ensureGsapRegistered();

/** Subtle fade + slide for auth pages — 150–300ms, load only. */
export default function AuthPageMotion({ children, className }: AuthPageMotionProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      gsap.from(ref.current, {
        autoAlpha: 0,
        y: 10,
        duration: 0.28,
        ease: 'power2.out',
        delay: 0.04,
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function AuthFormMotion({ children, className }: AuthPageMotionProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const items = ref.current.querySelectorAll('[data-auth-part]');
      gsap.from(items, {
        autoAlpha: 0,
        y: 8,
        duration: 0.24,
        stagger: 0.05,
        ease: 'power2.out',
        delay: 0.12,
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function AuthTrialBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-mkt-tag-amber-bg px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-mkt-tag-amber-text">
      7-day free trial
    </span>
  );
}

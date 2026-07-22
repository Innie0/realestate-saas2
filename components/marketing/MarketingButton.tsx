'use client';

import Link from 'next/link';
import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

type MarketingButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  className?: string;
  showArrow?: boolean;
};

ensureGsapRegistered();

export default function MarketingButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  showArrow = false,
}: MarketingButtonProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!finePointer) return;

      const el = ref.current;

      const onEnter = () => {
        gsap.to(el, { scale: 1.02, duration: 0.25, ease: 'power2.out' });
      };
      const onLeave = () => {
        gsap.to(el, { scale: 1, duration: 0.25, ease: 'power2.out' });
      };
      const onDown = () => {
        gsap.to(el, { scale: 0.98, duration: 0.12, ease: 'power2.out' });
      };
      const onUp = () => {
        gsap.to(el, { scale: 1.02, duration: 0.12, ease: 'power2.out' });
      };

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      el.addEventListener('mousedown', onDown);
      el.addEventListener('mouseup', onUp);

      return () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('mousedown', onDown);
        el.removeEventListener('mouseup', onUp);
      };
    },
    { scope: ref, dependencies: [reduced] },
  );

  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mkt-background)]';

  const sizes = {
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-7 text-[15px]',
  };

  const variants = {
    primary: 'mkt-cta',
    secondary:
      'border border-[var(--mkt-border)] bg-[var(--mkt-surface)] text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-surface-muted)]',
    ghost: 'text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-surface-muted)]',
  };

  return (
    <Link
      ref={ref}
      href={href}
      className={clsx(base, sizes[size], variants[variant], className)}
      style={{ borderRadius: 6 }}
    >
      {children}
      {showArrow ? (
        <span aria-hidden className="text-[var(--mkt-text-secondary)] transition-transform group-hover:translate-x-0.5">
          →
        </span>
      ) : null}
    </Link>
  );
}

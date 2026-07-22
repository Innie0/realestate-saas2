'use client';

import Link from 'next/link';
import { useRef } from 'react';
import clsx from 'clsx';
import { ensureGsapRegistered, useGSAP } from '@/lib/gsap-config';
import { bindHoverMotion } from '@/lib/landing-motion';
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
      return bindHoverMotion(ref.current, { scale: 1.02, y: 0, duration: 0.25 });
    },
    { scope: ref, dependencies: [reduced] },
  );

  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mkt-background)] will-change-transform';

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
        <span aria-hidden className="text-[var(--mkt-text-secondary)]">
          →
        </span>
      ) : null}
    </Link>
  );
}

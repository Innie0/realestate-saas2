'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

export type LandingGradientVariant =
  | 'hero'
  | 'feature'
  | 'feature-alt'
  | 'feature-warm'
  | 'integrations';

const VARIANT_CLASS: Record<LandingGradientVariant, string> = {
  hero: 'landing-gradient-hero',
  feature: 'landing-gradient-feature',
  'feature-alt': 'landing-gradient-feature-alt',
  'feature-warm': 'landing-gradient-feature-warm',
  integrations: 'landing-gradient-integrations',
};

type LandingGradientPanelProps = {
  variant?: LandingGradientVariant;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  /** Tighter padding for screenshot-only panels */
  compact?: boolean;
  /** Spotlight gradient follows the cursor (hero panel) */
  cursorReactive?: boolean;
};

export default function LandingGradientPanel({
  variant = 'feature',
  children,
  className,
  innerClassName,
  compact = false,
  cursorReactive = false,
}: LandingGradientPanelProps) {
  const reduced = useMotionReduced();
  const panelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!cursorReactive || reduced) return;

    const panel = panelRef.current;
    const glow = glowRef.current;
    if (!panel || !glow) return;

    let raf = 0;
    let targetX = 50;
    let targetY = 40;
    let currentX = targetX;
    let currentY = targetY;

    const onMove = (event: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width) * 100;
      targetY = ((event.clientY - rect.top) / rect.height) * 100;
      setIsHovering(true);
    };

    const onLeave = () => {
      setIsHovering(false);
      targetX = 50;
      targetY = 40;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      glow.style.setProperty('--cursor-x', `${currentX}%`);
      glow.style.setProperty('--cursor-y', `${currentY}%`);
      raf = window.requestAnimationFrame(tick);
    };

    panel.addEventListener('mousemove', onMove);
    panel.addEventListener('mouseleave', onLeave);
    raf = window.requestAnimationFrame(tick);

    return () => {
      panel.removeEventListener('mousemove', onMove);
      panel.removeEventListener('mouseleave', onLeave);
      window.cancelAnimationFrame(raf);
    };
  }, [cursorReactive, reduced]);

  return (
    <div
      ref={panelRef}
      className={clsx(
        'relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] lg:rounded-[2.25rem]',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.28),transparent_42%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_88%,rgba(255,255,255,0.12),transparent_38%)]"
        aria-hidden
      />
      {cursorReactive && !reduced ? (
        <div
          ref={glowRef}
          className={clsx(
            'landing-gradient-cursor-glow pointer-events-none absolute inset-0 transition-opacity duration-500',
            isHovering ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />
      ) : null}
      <div
        className={clsx(
          'relative',
          compact ? 'p-4 sm:p-6 lg:p-8' : 'p-6 sm:p-10 lg:p-12',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

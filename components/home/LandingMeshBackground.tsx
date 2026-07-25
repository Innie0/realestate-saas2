'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

const STREAKS = [
  { id: 'a', factor: 0.55 },
  { id: 'b', factor: 0.4 },
  { id: 'c', factor: 0.48 },
  { id: 'd', factor: 0.35 },
  { id: 'e', factor: 0.42 },
] as const;

type LandingMeshBackgroundProps = {
  className?: string;
  /** Subtle cursor pull on streak positions */
  interactive?: boolean;
};

/** Cobalt streak field — autonomous sway + gentle pointer drift */
export default function LandingMeshBackground({
  className,
  interactive = true,
}: LandingMeshBackgroundProps) {
  const reduced = useMotionReduced();
  const auroraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive || reduced) return;

    const aurora = auroraRef.current;
    if (!aurora) return;

    const panel = aurora.closest<HTMLElement>('.landing-gradient-panel');
    if (!panel) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;
      aurora.style.setProperty('--mesh-px', `${currentX.toFixed(2)}px`);
      aurora.style.setProperty('--mesh-py', `${currentY.toFixed(2)}px`);
      rafId = requestAnimationFrame(tick);
    };

    const setTargetFromPoint = (clientX: number, clientY: number) => {
      const rect = panel.getBoundingClientRect();
      targetX = ((clientX - rect.left) / rect.width - 0.5) * 36;
      targetY = ((clientY - rect.top) / rect.height - 0.5) * 28;
    };

    const onMove: EventListener = (event) => {
      if (!(event instanceof MouseEvent)) return;
      setTargetFromPoint(event.clientX, event.clientY);
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };
    const onTouch: EventListener = (event) => {
      if (!(event instanceof TouchEvent)) return;
      const touch = event.touches[0];
      if (touch) setTargetFromPoint(touch.clientX, touch.clientY);
    };

    panel.addEventListener('mousemove', onMove);
    panel.addEventListener('mouseleave', onLeave);
    panel.addEventListener('touchmove', onTouch, { passive: true });
    panel.addEventListener('touchend', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      panel.removeEventListener('mousemove', onMove);
      panel.removeEventListener('mouseleave', onLeave);
      panel.removeEventListener('touchmove', onTouch);
      panel.removeEventListener('touchend', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [interactive, reduced]);

  return (
    <div
      ref={auroraRef}
      className={clsx('landing-mesh-aurora pointer-events-none absolute inset-0', className)}
      aria-hidden
    >
      {STREAKS.map(({ id, factor }) => (
        <div
          key={id}
          className={clsx(
            'landing-mesh-streak-outer',
            `landing-mesh-streak-outer-${id}`,
          )}
          style={{ ['--streak-factor' as string]: factor }}
        >
          <div
            className={clsx(
              'landing-mesh-streak',
              `landing-mesh-streak-${id}`,
              reduced && 'landing-mesh-streak-static',
            )}
          />
        </div>
      ))}
    </div>
  );
}

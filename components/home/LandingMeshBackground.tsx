'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

/** Per-streak parallax — different directions so colors shift around the cursor */
const STREAKS = [
  { id: 'a', factor: 1, dx: 1.15, dy: 0.95 },
  { id: 'b', factor: 0.88, dx: -1.05, dy: 0.85 },
  { id: 'c', factor: 0.92, dx: 0.75, dy: -1.1 },
  { id: 'd', factor: 0.78, dx: -0.95, dy: -0.9 },
  { id: 'e', factor: 0.82, dx: 1.05, dy: 1.15 },
] as const;

const LERP = 0.11;

type LandingMeshBackgroundProps = {
  className?: string;
  interactive?: boolean;
};

/** Cobalt streak field — ambient sway + cursor-driven color drift (no spotlight blob) */
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

    let targetNx = 0;
    let targetNy = 0;
    let currentNx = 0;
    let currentNy = 0;
    let rafId = 0;

    const applyVars = (nx: number, ny: number) => {
      aurora.style.setProperty('--mesh-nx', nx.toFixed(4));
      aurora.style.setProperty('--mesh-ny', ny.toFixed(4));
      panel.style.setProperty('--mesh-nx', nx.toFixed(4));
      panel.style.setProperty('--mesh-ny', ny.toFixed(4));
    };

    const tick = () => {
      currentNx += (targetNx - currentNx) * LERP;
      currentNy += (targetNy - currentNy) * LERP;
      applyVars(currentNx, currentNy);
      rafId = requestAnimationFrame(tick);
    };

    const setTargetFromPoint = (clientX: number, clientY: number) => {
      const rect = panel.getBoundingClientRect();
      targetNx = (clientX - rect.left) / rect.width - 0.5;
      targetNy = (clientY - rect.top) / rect.height - 0.5;
    };

    const onMove: EventListener = (event) => {
      if (!(event instanceof MouseEvent)) return;
      setTargetFromPoint(event.clientX, event.clientY);
    };
    const onLeave = () => {
      targetNx = 0;
      targetNy = 0;
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
    applyVars(0, 0);
    rafId = requestAnimationFrame(tick);

    return () => {
      panel.removeEventListener('mousemove', onMove);
      panel.removeEventListener('mouseleave', onLeave);
      panel.removeEventListener('touchmove', onTouch);
      panel.removeEventListener('touchend', onLeave);
      cancelAnimationFrame(rafId);
      panel.style.removeProperty('--mesh-nx');
      panel.style.removeProperty('--mesh-ny');
    };
  }, [interactive, reduced]);

  return (
    <div
      ref={auroraRef}
      className={clsx('landing-mesh-aurora pointer-events-none absolute inset-0', className)}
      aria-hidden
    >
      {STREAKS.map(({ id, factor, dx, dy }) => (
        <div
          key={id}
          className={clsx('landing-mesh-streak-outer', `landing-mesh-streak-outer-${id}`)}
          style={{
            ['--streak-factor' as string]: factor,
            ['--streak-dx' as string]: dx,
            ['--streak-dy' as string]: dy,
          }}
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

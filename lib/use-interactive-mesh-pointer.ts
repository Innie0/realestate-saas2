'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMotionReduced } from '@/lib/motion';

type Pointer = { x: number; y: number };

/** Smooth cursor parallax for hero / CTA mesh panels (respects reduced motion). */
export function useInteractiveMeshPointer(enabled: boolean) {
  const reduced = useMotionReduced();
  const active = enabled && !reduced;
  const panelRef = useRef<HTMLDivElement>(null);
  const target = useRef<Pointer>({ x: 0, y: 0 });
  const current = useRef<Pointer>({ x: 0, y: 0 });
  const raf = useRef(0);

  const tick = useCallback(() => {
    const lerp = 0.07;
    current.current.x += (target.current.x - current.current.x) * lerp;
    current.current.y += (target.current.y - current.current.y) * lerp;

    const el = panelRef.current;
    if (el) {
      el.style.setProperty('--mesh-x', current.current.x.toFixed(4));
      el.style.setProperty('--mesh-y', current.current.y.toFixed(4));
    }

    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!active) return;
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, tick]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!active) return;
      const el = panelRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target.current = { x: nx, y: ny };

      const glowX = ((event.clientX - rect.left) / rect.width) * 100;
      const glowY = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mesh-glow-x', `${glowX.toFixed(2)}%`);
      el.style.setProperty('--mesh-glow-y', `${glowY.toFixed(2)}%`);
      el.style.setProperty('--mesh-glow-opacity', '1');
    },
    [active],
  );

  const onPointerLeave = useCallback(() => {
    target.current = { x: 0, y: 0 };
    panelRef.current?.style.setProperty('--mesh-glow-opacity', '0');
  }, []);

  return { panelRef, onPointerMove, onPointerLeave, active };
}

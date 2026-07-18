'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Top overscroll frost — only visible while rubber-banding at page top.
 * Opacity scales with pull strength (Solidroad-style), not a binary pop-in.
 */
export default function OverscrollTopVeil() {
  const [visual, setVisual] = useState({ opacity: 0, height: 0 });
  const pullRef = useRef(0);
  const touchingRef = useRef(false);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      if (!touchingRef.current && window.scrollY <= 2) {
        pullRef.current *= 0.82;
      } else if (window.scrollY > 2) {
        pullRef.current = 0;
      }

      const pull = pullRef.current;
      setVisual({
        opacity: pull,
        height: pull > 0.005 ? 6 + pull * 22 : 0,
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const addPull = (delta: number) => {
      if (window.scrollY > 2) return;
      pullRef.current = Math.min(1, pullRef.current + delta);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 2) return;
      if (e.deltaY < 0) {
        addPull(Math.min(0.14, Math.abs(e.deltaY) / 100));
      } else {
        pullRef.current *= 0.55;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchingRef.current = true;
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 2) return;
      const y = e.touches[0]?.clientY ?? touchStartYRef.current;
      const delta = y - touchStartYRef.current;
      if (delta > 0) {
        addPull(Math.min(0.2, delta / 180));
      }
    };

    const onTouchEnd = () => {
      touchingRef.current = false;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-40 overflow-hidden"
      style={{
        height: visual.height,
        opacity: visual.opacity,
        visibility: visual.opacity < 0.02 ? 'hidden' : 'visible',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F5] via-[#F5F5F5]/60 to-transparent" />
      {visual.opacity > 0.15 ? (
        <div
          className="absolute inset-x-0 top-0 backdrop-blur-[5px]"
          style={{ height: Math.min(10, visual.height * 0.45), opacity: visual.opacity * 0.7 }}
        />
      ) : null}
    </div>
  );
}

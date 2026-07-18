'use client';

import { useEffect, useRef, useState } from 'react';

/** 0–1 pull strength while rubber-banding at the top of the page. */
export function useTopOverscrollPull(enabled = true) {
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const touchingRef = useRef(false);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      pullRef.current = 0;
      setPull(0);
      return;
    }

    let raf = 0;

    const tick = () => {
      if (!touchingRef.current && window.scrollY <= 2) {
        pullRef.current *= 0.84;
      } else if (window.scrollY > 2) {
        pullRef.current = 0;
      }
      setPull(pullRef.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const addPull = (delta: number) => {
      if (window.scrollY > 2) return;
      pullRef.current = Math.min(1, pullRef.current + delta);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 2) return;
      if (e.deltaY < 0) addPull(Math.min(0.12, Math.abs(e.deltaY) / 110));
      else pullRef.current *= 0.5;
    };

    const onTouchStart = (e: TouchEvent) => {
      touchingRef.current = true;
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 2) return;
      const y = e.touches[0]?.clientY ?? touchStartYRef.current;
      const delta = y - touchStartYRef.current;
      if (delta > 0) addPull(Math.min(0.18, delta / 200));
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
  }, [enabled]);

  return pull;
}

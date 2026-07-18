'use client';

import { useEffect, useState } from 'react';

/**
 * Solidroad-style top overscroll: when rubber-banding at the page top, a fixed
 * white + blur veil stays pinned while content shifts down.
 */
export default function OverscrollTopVeil() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let touchStartY = 0;

    const activate = () => {
      setActive(true);
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setActive(false), 450);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY <= 1 && e.deltaY < 0) activate();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      if (window.scrollY <= 1 && y > touchStartY + 6) activate();
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 h-[45vh] max-h-[420px] transition-opacity duration-300 ease-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-[#F5F5F5]/98 backdrop-blur-2xl backdrop-saturate-150" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F5F5F5]/90 to-transparent" />
    </div>
  );
}

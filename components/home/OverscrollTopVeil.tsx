'use client';

import { useEffect, useState } from 'react';

/**
 * Solidroad-style top overscroll — a short white frost strip that only
 * appears while rubber-banding at the page top. No large backdrop-blur
 * layer over the hero (that smudged the mountains last time).
 */
export default function OverscrollTopVeil() {
  const [overscrolling, setOverscrolling] = useState(false);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let touchStartY = 0;

    const activate = () => {
      setOverscrolling(true);
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setOverscrolling(false), 320);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY <= 0 && e.deltaY < 0) activate();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      if (window.scrollY <= 0 && y > touchStartY + 8) activate();
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

  if (!overscrolling) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-24"
    >
      {/* Thin frost at the very top edge */}
      <div className="absolute inset-x-0 top-0 h-6 bg-[#F5F5F5]/95 backdrop-blur-sm" />
      {/* Soft white fade — no backdrop-blur on the large area */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F5] via-[#F5F5F5]/75 to-transparent" />
    </div>
  );
}

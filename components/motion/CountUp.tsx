'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: number;
  /** Format the interpolated value for display (e.g. currency). */
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Animates a number from its previous value to the new one.
 * Falls back to a static render when reduced motion is preferred.
 */
export default function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  duration = 0.7,
  className,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const previous = useRef(0);
  const [display, setDisplay] = useState(() => format(reduced ? value : 0));

  useEffect(() => {
    if (reduced) {
      previous.current = value;
      setDisplay(format(value));
      return;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    previous.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  return <span className={className}>{display}</span>;
}

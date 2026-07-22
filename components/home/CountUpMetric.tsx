'use client';

import { useRef } from 'react';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { LANDING_MOTION, parseMetricValue } from '@/lib/landing-motion';
import { useMotionReduced } from '@/lib/motion';

type CountUpMetricProps = {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  /** scroll = on viewport entry; mount = play immediately (e.g. carousel) */
  trigger?: 'scroll' | 'mount';
};

type CountUpPriceProps = {
  amount: number;
  className?: string;
  style?: React.CSSProperties;
};

ensureGsapRegistered();

export default function CountUpMetric({
  value,
  className,
  style,
  trigger = 'scroll',
}: CountUpMetricProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLSpanElement>(null);
  const parsed = parseMetricValue(value);

  useGSAP(
    () => {
      if (reduced || !ref.current || !parsed) return;

      const proxy = { val: 0 };
      const render = () => {
        if (ref.current) {
          ref.current.textContent = `${parsed.prefix}${proxy.val.toFixed(parsed.decimals)}${parsed.suffix}`;
        }
      };

      render();

      const tween = gsap.to(proxy, {
        val: parsed.value,
        duration: LANDING_MOTION.durationSlow,
        ease: LANDING_MOTION.ease,
        onUpdate: render,
        ...(trigger === 'scroll'
          ? {
              scrollTrigger: {
                trigger: ref.current,
                start: 'top 90%',
                once: true,
              },
            }
          : {}),
      });

      return () => {
        tween.kill();
      };
    },
    { scope: ref, dependencies: [reduced, value, trigger] },
  );

  return (
    <span ref={ref} className={className} style={style}>
      {value}
    </span>
  );
}

export function CountUpPrice({ amount, className, style }: CountUpPriceProps) {
  const reduced = useMotionReduced();
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const proxy = { val: 0 };

      gsap.to(proxy, {
        val: amount,
        duration: LANDING_MOTION.durationSlow,
        ease: LANDING_MOTION.ease,
        onUpdate: () => {
          if (ref.current) ref.current.textContent = `$${Math.round(proxy.val)}`;
        },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
          once: true,
        },
      });
    },
    { scope: ref, dependencies: [reduced, amount] },
  );

  return (
    <span ref={ref} className={className} style={style}>
      ${amount}
    </span>
  );
}

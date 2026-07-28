'use client';

import { BlurFade } from '@/components/ui/blur-fade';
import { useMotionReduced } from '@/lib/motion';

type MarketingBlurFadeProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  inView?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
};

/** BlurFade wrapper that respects prefers-reduced-motion with a static fallback. */
export default function MarketingBlurFade({
  children,
  className,
  delay = 0,
  inView = false,
  direction = 'down',
}: MarketingBlurFadeProps) {
  const reduced = useMotionReduced();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <BlurFade
      className={className}
      delay={delay}
      inView={inView}
      direction={direction}
      duration={0.4}
      offset={10}
      blur="8px"
    >
      {children}
    </BlurFade>
  );
}

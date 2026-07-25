'use client';

import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

export type MeshTone = 'cobalt' | 'violet' | 'teal' | 'plum' | 'emerald';

const BLOBS = ['a', 'b', 'c', 'd'] as const;

type LandingMeshBackgroundProps = {
  className?: string;
  /** Slow autonomous drift (hero + bottom CTA) */
  animated?: boolean;
  /** Color family matched to the panel variant */
  tone?: MeshTone;
};

export function meshToneForVariant(variant: string): MeshTone {
  switch (variant) {
    case 'feature-violet':
      return 'violet';
    case 'feature-teal':
      return 'teal';
    case 'feature-plum':
      return 'plum';
    case 'integrations':
      return 'emerald';
    default:
      return 'cobalt';
  }
}

/** Soft aurora blobs — CSS-only drift, GPU transforms, no cursor spotlight */
export default function LandingMeshBackground({
  className,
  animated = false,
  tone = 'cobalt',
}: LandingMeshBackgroundProps) {
  const reduced = useMotionReduced();
  const motionless = reduced || !animated;

  return (
    <div
      className={clsx(
        'landing-mesh-aurora pointer-events-none absolute inset-0',
        `landing-mesh-aurora--${tone}`,
        className,
      )}
      aria-hidden
    >
      {BLOBS.map((id) => (
        <div
          key={id}
          className={clsx(
            'landing-mesh-blob',
            `landing-mesh-blob-${id}`,
            motionless && 'landing-mesh-blob-static',
          )}
        />
      ))}
    </div>
  );
}

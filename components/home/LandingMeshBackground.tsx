'use client';

import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

/** Instantly-style drifting color blobs on a deep cobalt base */
export default function LandingMeshBackground({ className }: { className?: string }) {
  const reduced = useMotionReduced();

  return (
    <div
      className={clsx('landing-mesh-aurora pointer-events-none absolute inset-0', className)}
      aria-hidden
    >
      <div
        className={clsx('landing-mesh-blob landing-mesh-blob-a', reduced && 'landing-mesh-blob-static')}
      />
      <div
        className={clsx('landing-mesh-blob landing-mesh-blob-b', reduced && 'landing-mesh-blob-static')}
      />
      <div
        className={clsx('landing-mesh-blob landing-mesh-blob-c', reduced && 'landing-mesh-blob-static')}
      />
      <div
        className={clsx('landing-mesh-blob landing-mesh-blob-d', reduced && 'landing-mesh-blob-static')}
      />
    </div>
  );
}

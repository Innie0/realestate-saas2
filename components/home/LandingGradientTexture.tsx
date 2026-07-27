'use client';

import clsx from 'clsx';
import type { MeshTone } from '@/components/home/LandingMeshBackground';

type LandingGradientTextureProps = {
  tone?: MeshTone;
  /** Hero loads the mesh eagerly */
  priority?: boolean;
  /** Subtle scale/opacity drift on hero + CTA */
  animated?: boolean;
};

const MESH_SIZES = [500, 800, 1080, 1600, 1920] as const;

const MESH_PREFIX: Record<MeshTone, string> = {
  cobalt: 'mesh-cobalt',
  violet: 'mesh-violet',
  teal: 'mesh-teal',
  plum: 'mesh-plum',
  emerald: 'mesh-emerald',
};

function meshSrcSet(prefix: string): string {
  return MESH_SIZES.map((w) => `/landing/mesh/${prefix}-${w}.webp ${w}w`).join(', ');
}

/** Baked WebP mesh — Instantly-style reference, hue-mapped to brand tones */
export default function LandingGradientTexture({
  tone = 'cobalt',
  priority = false,
  animated = false,
}: LandingGradientTextureProps) {
  const prefix = priority && tone === 'cobalt' ? 'hero-cobalt' : MESH_PREFIX[tone];

  return (
    <div
      className={clsx(
        'landing-gradient-texture pointer-events-none absolute inset-0 z-0',
        animated && 'landing-gradient-texture--animated',
      )}
      aria-hidden
    >
      <picture className="block h-full w-full">
        <source type="image/webp" srcSet={meshSrcSet(prefix)} sizes="(max-width: 1919px) 100vw, 1920px" />
        <img
          src={`/landing/mesh/${prefix}-1920.webp`}
          alt=""
          className="h-full w-full object-cover object-center"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      </picture>
    </div>
  );
}

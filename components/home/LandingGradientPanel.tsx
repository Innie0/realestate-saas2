'use client';

import clsx from 'clsx';
import LandingMeshBackground from '@/components/home/LandingMeshBackground';

export type LandingGradientVariant =
  | 'hero'
  | 'feature'
  | 'feature-alt'
  | 'feature-warm'
  | 'integrations';

const VARIANT_CLASS: Record<LandingGradientVariant, string> = {
  hero: 'landing-gradient-hero',
  feature: 'landing-gradient-feature',
  'feature-alt': 'landing-gradient-feature-alt',
  'feature-warm': 'landing-gradient-feature-warm',
  integrations: 'landing-gradient-integrations',
};

type LandingGradientPanelProps = {
  variant?: LandingGradientVariant;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  /** Tighter padding for screenshot-only panels */
  compact?: boolean;
  /** Generous padding so UI floats inside the gradient frame (Instantly-style) */
  showcase?: boolean;
  /** Drifting mesh blobs (Instantly-style ambient motion) */
  animatedMesh?: boolean;
};

export default function LandingGradientPanel({
  variant = 'feature',
  children,
  className,
  innerClassName,
  compact = false,
  showcase = false,
  animatedMesh = false,
}: LandingGradientPanelProps) {
  const radius = 'rounded-[1.75rem] sm:rounded-[2rem] lg:rounded-[2.25rem]';

  return (
    /* Shadow on outer shell — clip + gradient on inner so corners stay clean */
    <div className={clsx(radius, className)}>
      <div
        className={clsx(
          'relative isolate overflow-hidden [transform:translateZ(0)]',
          radius,
          !animatedMesh && VARIANT_CLASS[variant],
          animatedMesh && 'landing-gradient-hero-mesh-base',
        )}
      >
        {animatedMesh ? <LandingMeshBackground /> : null}
        {!animatedMesh ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.28),transparent_42%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_88%,rgba(255,255,255,0.12),transparent_38%)]"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]"
            aria-hidden
          />
        )}
        <div
          className={clsx(
            'relative',
            showcase
              ? 'py-12 px-10 sm:py-16 sm:px-14 lg:py-20 lg:px-20'
              : compact
                ? 'p-4 sm:p-6 lg:p-8'
                : 'p-6 sm:p-10 lg:p-12',
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

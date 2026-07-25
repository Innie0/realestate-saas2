'use client';

import clsx from 'clsx';

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
};

export default function LandingGradientPanel({
  variant = 'feature',
  children,
  className,
  innerClassName,
  compact = false,
}: LandingGradientPanelProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] lg:rounded-[2.25rem]',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.28),transparent_42%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_88%,rgba(255,255,255,0.12),transparent_38%)]"
        aria-hidden
      />
      <div
        className={clsx(
          'relative',
          compact ? 'p-4 sm:p-6 lg:p-8' : 'p-6 sm:p-10 lg:p-12',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

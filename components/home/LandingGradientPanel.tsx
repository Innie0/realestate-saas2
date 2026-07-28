'use client';

import clsx from 'clsx';
import LandingGradientTexture from '@/components/home/LandingGradientTexture';
import LandingMeshBackground, { meshToneForVariant } from '@/components/home/LandingMeshBackground';
import { useInteractiveMeshPointer } from '@/lib/use-interactive-mesh-pointer';

export type LandingGradientVariant =
  | 'hero'
  | 'feature'
  | 'feature-violet'
  | 'feature-teal'
  | 'feature-plum'
  | 'integrations';

const VARIANT_CLASS: Record<LandingGradientVariant, string> = {
  hero: 'landing-gradient-hero',
  feature: 'landing-gradient-feature',
  'feature-violet': 'landing-gradient-feature-violet',
  'feature-teal': 'landing-gradient-feature-teal',
  'feature-plum': 'landing-gradient-feature-plum',
  integrations: 'landing-gradient-integrations',
};

const ELEVATED_SHADOW: Record<LandingGradientVariant, string> = {
  hero: 'landing-gradient-panel-elevated-hero',
  feature: 'landing-gradient-panel-elevated',
  'feature-violet': 'landing-gradient-panel-elevated-violet',
  'feature-teal': 'landing-gradient-panel-elevated-teal',
  'feature-plum': 'landing-gradient-panel-elevated-plum',
  integrations: 'landing-gradient-panel-elevated-emerald',
};

type LandingGradientPanelProps = {
  variant?: LandingGradientVariant;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  compact?: boolean;
  showcase?: boolean;
  /** Aurora blobs: animated on hero/CTA, static on middle sections */
  mesh?: 'animated' | 'static';
  /** @deprecated Use mesh="animated" */
  animatedMesh?: boolean;
  elevated?: 'default' | 'hero' | false;
  /** Stretch panel to fill remaining flex space (hero). */
  fill?: boolean;
  /** Cursor-reactive mesh parallax + glow */
  interactive?: boolean;
};

const RADIUS = 'rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem]';

export default function LandingGradientPanel({
  variant = 'feature',
  children,
  className,
  innerClassName,
  compact = false,
  showcase = false,
  mesh,
  animatedMesh = false,
  elevated = 'default',
  fill = false,
  interactive = false,
}: LandingGradientPanelProps) {
  const meshMode = mesh ?? (animatedMesh ? 'animated' : undefined);
  const isInteractive = Boolean(interactive && meshMode === 'animated');
  const { panelRef, onPointerMove, onPointerLeave, active: pointerActive } =
    useInteractiveMeshPointer(isInteractive);

  const elevatedClass =
    elevated === 'hero'
      ? 'landing-gradient-panel-elevated-hero'
      : elevated === 'default'
        ? ELEVATED_SHADOW[variant]
        : undefined;

  const meshTone = meshToneForVariant(variant);
  /** Hero + bottom CTA: CSS gradient + aurora only (no baked WebP). */
  const useMeshTexture = Boolean(meshMode && variant !== 'hero');

  return (
    <div className={clsx(RADIUS, 'overflow-hidden', elevatedClass, fill && 'flex min-h-0 flex-1 flex-col', className)}>
      <div
        ref={panelRef}
        onPointerMove={pointerActive ? onPointerMove : undefined}
        onPointerLeave={pointerActive ? onPointerLeave : undefined}
        className={clsx(
          'landing-gradient-panel relative overflow-hidden',
          fill && 'flex min-h-full flex-1 flex-col',
          VARIANT_CLASS[variant],
          meshMode && 'landing-gradient-panel--mesh',
          useMeshTexture && 'landing-gradient-panel--mesh-image',
          meshMode && !useMeshTexture && 'landing-gradient-panel--mesh-css',
          isInteractive && 'landing-gradient-panel--interactive',
        )}
      >
        {meshMode ? (
          <>
            {useMeshTexture ? (
              <LandingGradientTexture
                tone={meshTone}
                priority={variant === 'hero'}
                animated={meshMode === 'animated'}
              />
            ) : null}
            <LandingMeshBackground
              animated={meshMode === 'animated'}
              tone={meshTone}
              interactive={isInteractive}
            />
            {isInteractive ? <div className="landing-mesh-cursor-glow" aria-hidden /> : null}
          </>
        ) : null}
        <div
          className={clsx(
            'relative z-[3]',
            fill && 'flex min-h-full flex-1 flex-col',
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

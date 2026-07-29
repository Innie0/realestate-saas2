'use client';

import React from 'react';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import ParticleSphereAnimation from '@/components/ui/orbiting-circles-02-utils/particalsphear';
import { INTEGRATIONS } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';
import clsx from 'clsx';

type OrbitIcon = {
  id: (typeof INTEGRATIONS)[number]['id'];
  angle: number;
};

const ORBITS: { size: string; duration: number; icon: OrbitIcon }[] = [
  {
    size: 'h-[360px] w-[360px] md:h-[480px] md:w-[480px]',
    duration: 20,
    icon: { id: 'google-calendar', angle: -35 },
  },
  {
    size: 'h-[500px] w-[500px] md:h-[640px] md:w-[640px]',
    duration: 26,
    icon: { id: 'google-ads', angle: 20 },
  },
  {
    size: 'h-[640px] w-[640px] md:h-[800px] md:w-[800px]',
    duration: 32,
    icon: { id: 'meta-ads', angle: -10 },
  },
  {
    size: 'h-[780px] w-[780px] md:h-[960px] md:w-[960px]',
    duration: 38,
    icon: { id: 'lead-forms', angle: 45 },
  },
];

const INTEGRATION_LABELS = Object.fromEntries(
  INTEGRATIONS.map((item) => [item.id, item.name]),
) as Record<(typeof INTEGRATIONS)[number]['id'], string>;

type OrbitingCirclesIntegrationsProps = {
  variant?: 'light' | 'dark';
};

export default function OrbitingCirclesIntegrations({
  variant = 'light',
}: OrbitingCirclesIntegrationsProps) {
  const reduced = useMotionReduced();
  const isDark = variant === 'dark';

  return (
    <div className="relative flex h-[400px] w-full justify-center overflow-hidden md:h-[520px] lg:h-[600px]">
      {!reduced ? (
        <style>{`
          @keyframes orbit-cw {
            from { transform: rotate(var(--start-angle)); }
            to { transform: rotate(calc(var(--start-angle) + 360deg)); }
          }
          @keyframes orbit-ccw {
            from { transform: rotate(var(--start-angle)); }
            to { transform: rotate(calc(var(--start-angle) - 360deg)); }
          }
          @keyframes counter-cw {
            from { transform: rotate(var(--counter-offset, 0deg)); }
            to { transform: rotate(calc(var(--counter-offset, 0deg) - 360deg)); }
          }
          @keyframes counter-ccw {
            from { transform: rotate(var(--counter-offset, 0deg)); }
            to { transform: rotate(calc(var(--counter-offset, 0deg) + 360deg)); }
          }
        `}</style>
      ) : null}

      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 aspect-square w-[220px] -translate-x-1/2 translate-y-1/2 md:w-[320px] lg:w-[380px]">
        <ParticleSphereAnimation variant={isDark ? 'light' : 'dark'} />
      </div>

      {ORBITS.map((orbit, index) => {
        const isCW = index % 2 === 0;
        const orbitAnim = reduced ? undefined : isCW ? 'orbit-cw' : 'orbit-ccw';
        const counterAnim = reduced ? undefined : isCW ? 'counter-cw' : 'counter-ccw';
        const iconData = orbit.icon;

        return (
          <div
            key={orbit.size}
            className={clsx(
              'absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border',
              isDark ? 'border-white/12' : 'border-mkt-border',
              orbit.size,
            )}
          >
            <div
              className="absolute left-1/2 top-0 -ml-10 flex h-1/2 origin-bottom flex-col items-center justify-start md:-ml-12"
              style={
                reduced
                  ? { transform: `rotate(${iconData.angle}deg)` }
                  : ({
                      '--start-angle': `${iconData.angle}deg`,
                      animation: `${orbitAnim} ${orbit.duration}s linear infinite`,
                    } as React.CSSProperties)
              }
            >
              <div
                className={clsx(
                  'relative z-10 -mt-10 rounded-full border p-3.5 sm:p-5 md:-mt-12',
                  isDark
                    ? 'border-white/15 bg-[#141414]'
                    : 'border-mkt-border bg-mkt-surface',
                )}
                style={
                  reduced
                    ? { transform: `rotate(${-iconData.angle}deg)` }
                    : ({
                        '--counter-offset': `${-iconData.angle}deg`,
                        animation: `${counterAnim} ${orbit.duration}s linear infinite`,
                      } as React.CSSProperties)
                }
                title={INTEGRATION_LABELS[iconData.id]}
              >
                <IntegrationLogo id={iconData.id} className="size-7 md:size-9 lg:size-10" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

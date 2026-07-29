'use client';

import React from 'react';
import { IntegrationLogo } from '@/components/home/IntegrationLogos';
import ParticleSphereAnimation from '@/components/ui/orbiting-circles-02-utils/particalsphear';
import { INTEGRATIONS } from '@/lib/landing-showcase';
import { useMotionReduced } from '@/lib/motion';

type OrbitIcon = {
  id: (typeof INTEGRATIONS)[number]['id'];
  angle: number;
};

const ORBITS: { size: string; duration: number; icons: OrbitIcon[] }[] = [
  {
    size: 'h-[280px] w-[280px] md:h-[360px] md:w-[360px]',
    duration: 18,
    icons: [
      { id: 'google-calendar', angle: -60 },
      { id: 'google-ads', angle: 0 },
      { id: 'meta-ads', angle: 60 },
    ],
  },
  {
    size: 'h-[380px] w-[380px] md:h-[480px] md:w-[480px]',
    duration: 24,
    icons: [
      { id: 'lead-forms', angle: -90 },
      { id: 'google-calendar', angle: 0 },
    ],
  },
  {
    size: 'h-[460px] w-[460px] md:h-[580px] md:w-[580px]',
    duration: 30,
    icons: [
      { id: 'meta-ads', angle: -60 },
      { id: 'google-ads', angle: 0 },
      { id: 'lead-forms', angle: 60 },
    ],
  },
];

const INTEGRATION_LABELS = Object.fromEntries(
  INTEGRATIONS.map((item) => [item.id, item.name]),
) as Record<(typeof INTEGRATIONS)[number]['id'], string>;

export default function OrbitingCirclesIntegrations() {
  const reduced = useMotionReduced();

  return (
    <div className="relative flex h-[320px] w-full justify-center overflow-hidden md:h-[420px]">
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

      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 aspect-square w-[180px] -translate-x-1/2 translate-y-1/2 md:w-[260px]">
        <ParticleSphereAnimation />
      </div>

      {ORBITS.map((orbit, index) => {
        const isCW = index % 2 === 0;
        const orbitAnim = reduced ? undefined : isCW ? 'orbit-cw' : 'orbit-ccw';
        const counterAnim = reduced ? undefined : isCW ? 'counter-cw' : 'counter-ccw';

        const allIcons = reduced
          ? orbit.icons
          : [
              ...orbit.icons,
              ...orbit.icons.map((icon) => ({
                ...icon,
                angle: icon.angle + 180,
              })),
            ];

        return (
          <div
            key={orbit.size}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-mkt-border ${orbit.size}`}
          >
            {allIcons.map((iconData, iconIndex) => (
              <div
                key={`${iconData.id}-${iconData.angle}-${iconIndex}`}
                className="absolute left-1/2 top-0 -ml-8 flex h-1/2 origin-bottom flex-col items-center justify-start"
                style={
                  reduced
                    ? {
                        transform: `rotate(${iconData.angle}deg)`,
                      }
                    : ({
                        '--start-angle': `${iconData.angle}deg`,
                        animation: `${orbitAnim} ${orbit.duration}s linear infinite`,
                      } as React.CSSProperties)
                }
              >
                <div
                  className="relative z-10 -mt-8 rounded-full border border-mkt-border bg-mkt-surface p-3 sm:p-4"
                  style={
                    reduced
                      ? {
                          transform: `rotate(${-iconData.angle}deg)`,
                        }
                      : ({
                          '--counter-offset': `${-iconData.angle}deg`,
                          animation: `${counterAnim} ${orbit.duration}s linear infinite`,
                        } as React.CSSProperties)
                  }
                  title={INTEGRATION_LABELS[iconData.id]}
                >
                  <IntegrationLogo id={iconData.id} className="size-6 md:size-8" />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

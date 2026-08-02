'use client';

/** Height of the blue gradient layer (extends well below the headline area). */
export const LANDING_HERO_GRADIENT_HEIGHT = 1180;

const W = 1440;
const H = LANDING_HERO_GRADIENT_HEIGHT;

/** Y on the left/right edges where blue meets the white scoop. */
const EDGE_Y = 968;

/** Ellipse radii for the Pitch-style upward white arc (wide, gentle scoop). */
const ARC_RX = 860;
const ARC_RY = 300;

/**
 * Blue hero wash clipped to a shape whose bottom is an elliptical arc.
 * White (`bg-white` on the section) shows through below the arc — the arc
 * bulges upward in the center, matching Pitch's purple → white transition.
 */
export function LandingHeroGradient() {
  const blueShape = `
    M 0 0
    H ${W}
    V ${EDGE_Y}
    A ${ARC_RX} ${ARC_RY} 0 0 1 0 ${EDGE_Y}
    Z
  `;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 w-full"
      style={{ height: `${H}px` }}
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="landingHeroBlueGrad"
            x1="0"
            y1="0"
            x2="0"
            y2={H}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0668E1" />
            <stop offset="24%" stopColor="#0668E1" />
            <stop offset="38%" stopColor="#2E86FB" />
            <stop offset="54%" stopColor="#4B93FC" />
            <stop offset="68%" stopColor="#7FB4FD" />
            <stop offset="82%" stopColor="#A8CCFE" />
            <stop offset="100%" stopColor="#C9E0FE" />
          </linearGradient>
          <filter id="landingHeroArcFeather" x="-8%" y="-4%" width="116%" height="112%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
          </filter>
        </defs>

        {/* Soft feather where blue meets white (Pitch-style blurred edge) */}
        <path
          d={blueShape}
          fill="#FFFFFF"
          opacity={0.85}
          filter="url(#landingHeroArcFeather)"
          transform="translate(0, 14)"
        />

        <path d={blueShape} fill="url(#landingHeroBlueGrad)" />
      </svg>
    </div>
  );
}

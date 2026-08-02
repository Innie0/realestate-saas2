'use client';

/** Bottom tint from the hero fade — used for section bg and curved transition. */
export const LANDING_HERO_FADE_COLOR = '#C9E0FE';

const GRADIENT_HEIGHT = 980;

/**
 * Blue wash with a circular scoop at the bottom: the fade color rises in a
 * smooth arc (not a flat line), matching Pitch-style hero transitions.
 */
export function LandingHeroGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 w-full"
      style={{ height: `${GRADIENT_HEIGHT}px` }}
      aria-hidden
    >
      {/* Base fill so everything below the curve matches the fade tint */}
      <div className="absolute inset-0" style={{ backgroundColor: LANDING_HERO_FADE_COLOR }} />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 1440 ${GRADIENT_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="landingHeroBlueGrad"
            x1="0"
            y1="0"
            x2="0"
            y2={GRADIENT_HEIGHT}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0668E1" />
            <stop offset="16%" stopColor="#0668E1" />
            <stop offset="28%" stopColor="#2E86FB" />
            <stop offset="48%" stopColor="#7FB4FD" />
            <stop offset="68%" stopColor="#A8CCFE" />
            <stop offset="82%" stopColor="#C9E0FE" />
            <stop offset="100%" stopColor="#C9E0FE" />
          </linearGradient>
        </defs>
        {/*
          Bottom edge: sides stay lower; center curves upward in a smooth arc
          so the fade tint scoops in with a circular indent (not a flat cut).
        */}
        <path
          d="M 0 0 H 1440 V 0 H 1440 L 1440 890 C 1140 890 900 640 720 640 C 540 640 300 890 0 890 Z"
          fill="url(#landingHeroBlueGrad)"
        />
      </svg>
    </div>
  );
}

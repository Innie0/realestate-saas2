'use client';

/** Smooth gradient wash — no floating images, fades to white at the bottom. */
export function LandingHeroGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
      style={{
        background: `linear-gradient(180deg,
          #0668E1 0%,
          #2E86FB 22%,
          #7FB4FD 45%,
          #C9E0FE 68%,
          #FFFFFF 100%)`,
      }}
    />
  );
}

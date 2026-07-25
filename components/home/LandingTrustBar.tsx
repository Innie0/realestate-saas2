'use client';

import { HERO_TRUST_BRANDS } from '@/lib/landing-hero-prompts';

export default function LandingTrustBar() {
  return (
    <section
      aria-label="Trusted by agents"
      className="border-b border-mkt-border bg-mkt-background pb-12 pt-2 sm:pb-14"
    >
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.14em] text-mkt-secondary">
          Used by agents at leading brokerages
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-10">
          {HERO_TRUST_BRANDS.map((brand) => (
            <span
              key={brand}
              className="text-sm font-semibold tracking-[-0.02em] text-mkt-muted/80 transition-colors hover:text-mkt-secondary sm:text-[15px]"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { INTEGRATIONS } from '@/lib/landing-showcase';
import OrbitingCirclesIntegrations from '@/components/ui/orbiting-circles-02';
import LandingManifestoBand from '@/components/home/LandingManifestoBand';
import LandingStackReplaceSection from '@/components/home/LandingStackReplaceSection';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import { CONNECT_TOOLS_NAV_SENTINEL_ID, CONNECT_TOOLS_SECTION_ID } from '@/lib/landing-nav-theme';

export default function LandingTrustSection() {
  return (
    <section id={CONNECT_TOOLS_SECTION_ID} className="bg-[#0a0a0a] text-white">
      <div
        id={CONNECT_TOOLS_NAV_SENTINEL_ID}
        className="mx-auto max-w-mkt-content px-5 sm:px-8"
        aria-hidden
      >
        <div className="border-t border-mkt-border" />
      </div>

      <LandingStackReplaceSection />

      <div className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
          <LandingStaggerReveal className="mx-auto max-w-2xl text-center">
            <h2
              data-reveal
              className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-white"
            >
              Connect your tools
            </h2>
            <p
              data-reveal
              className="mt-3 text-base leading-[1.6] text-white/65 sm:text-[16px]"
            >
              Oikaro works with the calendars and ad platforms you already use — no rebuilding your
              workflow from scratch.
            </p>
            <div data-reveal className="mt-6">
              <MarketingButton href="/auth/signup" variant="light" size="md">
                Start free trial
              </MarketingButton>
            </div>
          </LandingStaggerReveal>

          <LandingStaggerReveal className="mt-10 sm:mt-12">
            <div data-reveal data-reveal-fade>
              <OrbitingCirclesIntegrations variant="dark" />
            </div>
            <ul
              data-reveal
              className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3"
            >
              {INTEGRATIONS.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 sm:text-sm"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </LandingStaggerReveal>
        </div>
      </div>

      <LandingManifestoBand variant="dark" />
    </section>
  );
}

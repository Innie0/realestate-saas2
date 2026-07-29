'use client';

import { useRef } from 'react';
import { INTEGRATIONS } from '@/lib/landing-showcase';
import OrbitingCirclesIntegrations from '@/components/ui/orbiting-circles-02';
import LandingManifestoBand from '@/components/home/LandingManifestoBand';
import LandingStaggerReveal from '@/components/home/LandingStaggerReveal';
import MarketingButton from '@/components/marketing/MarketingButton';
import {
  CONNECT_TOOLS_CURTAIN_ID,
  CONNECT_TOOLS_NAV_SENTINEL_ID,
  CONNECT_TOOLS_SECTION_ID,
} from '@/lib/landing-nav-theme';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

export default function LandingConnectToolsReveal() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const curtain = curtainRef.current;
      const manifesto = manifestoRef.current;
      if (reduced || !track || !curtain || !manifesto) return;

      const getRevealDistance = () =>
        Math.max(window.innerHeight * 0.75, manifesto.offsetHeight + 64);

      gsap.set(manifesto, { autoAlpha: 0.4, y: 24 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'bottom bottom',
          end: () => `+=${getRevealDistance()}`,
          scrub: 0.75,
          pin: curtain,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        curtain,
        {
          yPercent: -100,
          ease: 'none',
          duration: 1,
        },
        0,
      );

      tl.to(
        manifesto,
        {
          autoAlpha: 1,
          y: 0,
          ease: 'none',
          duration: 1,
        },
        0,
      );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  if (reduced) {
    return (
      <section id={CONNECT_TOOLS_SECTION_ID} className="bg-[#0a0a0a] text-white">
        <div id={CONNECT_TOOLS_CURTAIN_ID}>
          <ConnectToolsCurtain />
        </div>
        <LandingManifestoBand />
      </section>
    );
  }

  return (
    <section ref={sectionRef} id={CONNECT_TOOLS_SECTION_ID} className="relative">
      <div ref={trackRef} className="relative">
        <div
          ref={manifestoRef}
          className="absolute inset-x-0 bottom-0 z-0 bg-mkt-background will-change-[transform,opacity]"
        >
          <LandingManifestoBand />
        </div>

        <div
          ref={curtainRef}
          id={CONNECT_TOOLS_CURTAIN_ID}
          className="relative z-10 bg-[#0a0a0a] text-white will-change-transform"
        >
          <ConnectToolsCurtain />
        </div>

        <div className="h-[min(80vh,640px)]" aria-hidden />
      </div>
    </section>
  );
}

function ConnectToolsCurtain() {
  return (
    <>
      <div
        id={CONNECT_TOOLS_NAV_SENTINEL_ID}
        className="mx-auto max-w-mkt-content px-5 sm:px-8"
        aria-hidden
      >
        <div className="border-t border-mkt-border" />
      </div>

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
    </>
  );
}

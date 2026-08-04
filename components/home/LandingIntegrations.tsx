'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { SITE_NAME } from '@/lib/site-config';
import { useMotionReduced } from '@/lib/motion';

const CHIPS = [
  {
    src: '/integrations/meta.svg',
    alt: 'Meta',
    size: 112,
    style: { left: 0, top: 96 },
    delay: 0,
    dur: 7,
    iconScale: 0.38,
  },
  {
    src: '/integrations/lead-forms.svg',
    alt: 'Lead forms',
    size: 92,
    style: { left: 196, top: 8 },
    delay: 0.6,
    dur: 8,
    iconScale: 0.4,
  },
  {
    src: '/integrations/google-calendar.svg',
    alt: 'Google Calendar',
    size: 100,
    style: { right: 8, top: 74 },
    delay: 0.3,
    dur: 7.5,
    iconScale: 0.38,
  },
  {
    src: '/integrations/google-ads.svg',
    alt: 'Google Ads',
    size: 88,
    style: { right: 206, top: 4 },
    delay: 0.9,
    dur: 9,
    iconScale: 0.38,
  },
] as const;

/** Exact mirror of the hero dissolve — spread over the full section, not a short overlay. */
const INTEGRATIONS_SECTION_GRADIENT =
  'linear-gradient(180deg,#FFFFFF 0%,#FFFFFF 38%,#DCEBFE 44%,#A8CCFE 52%,#7FB4FD 62%,#4B93FC 72%,#2E86FB 82%,#0668E1 92%,#0668E1 100%)';

export default function LandingIntegrations() {
  const reduced = useMotionReduced();

  return (
    <>
      <style>{`
        @keyframes drift {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
      `}</style>

      <section
        className="relative overflow-hidden px-5 text-[#111111] sm:px-8"
        style={{ background: INTEGRATIONS_SECTION_GRADIENT }}
      >
        <div className="relative z-[1] mx-auto max-w-[1120px] pb-[min(280px,34vw)] pt-24">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display max-w-[17ch] text-[64px] font-extrabold leading-[1.02] tracking-[-0.038em] text-[#111111]">
              Fits the tools you already run on
            </h2>

            <div className="relative mt-14 h-[300px] w-full">
              <div className="pointer-events-none absolute inset-0">
                {CHIPS.map((chip) => {
                  const iconSize = Math.round(chip.size * chip.iconScale);
                  return (
                    <div
                      key={chip.alt}
                      className="absolute flex items-center justify-center overflow-hidden rounded-full bg-[#F4F4F5] transition-colors hover:bg-[#EAF2FE]"
                      style={{
                        ...chip.style,
                        width: chip.size,
                        height: chip.size,
                        animation: reduced
                          ? undefined
                          : `drift ${chip.dur}s ease-in-out ${chip.delay}s infinite alternate`,
                      }}
                    >
                      <Image
                        src={chip.src}
                        alt={chip.alt}
                        width={iconSize}
                        height={iconSize}
                        className="object-contain"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="relative z-[1] flex justify-center pt-16">
                <div
                  className={clsx(
                    'inline-flex h-24 items-center justify-center rounded-full bg-[#0668E1] px-16',
                    'shadow-[0_26px_60px_-28px_rgba(6,104,225,0.85)] transition-colors hover:bg-[#0450b0]',
                  )}
                >
                  <span className="font-mkt-mono text-[44px] font-normal leading-none tracking-[-0.02em] text-white">
                    {SITE_NAME}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

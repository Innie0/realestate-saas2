'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import { GradientMesh, type GradientMeshProps } from '@/components/ui/gradient-mesh';
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { SITE_DOMAIN, SITE_NAME } from '@/lib/site-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

type StepMeshConfig = Pick<
  GradientMeshProps,
  | 'colors'
  | 'baseColor'
  | 'distortion'
  | 'swirl'
  | 'scale'
  | 'offsetX'
  | 'offsetY'
  | 'rotation'
  | 'grain'
>;

const STATIC_MESH: Pick<GradientMeshProps, 'animated' | 'speed' | 'waveSpeed' | 'waveAmp'> = {
  animated: false,
  speed: 0,
  waveSpeed: 0,
  waveAmp: 0,
};

const STICKY_TOP = 120;
const SEGMENT = 1 / 3;
const STEP_SLOT = 228;

function getScrollTravel() {
  if (typeof window === 'undefined') return 960;
  return Math.round(window.innerHeight * 1);
}

const STEPS = [
  {
    kicker: 'LISTINGS',
    title: 'Draft listings that sell',
    body: 'Upload the photos, pick a tone, and get MLS-ready copy plus social captions in seconds. Edit inline until it sounds like you.',
    src: '/landing/projects.png',
    url: `${SITE_DOMAIN}/dashboard/projects`,
    label: '01 Listings',
    mesh: {
      baseColor: '#0452AD',
      colors: ['#0452AD', '#0668E1', '#C8DFF8'],
      distortion: 5,
      swirl: 0.42,
      scale: 1.12,
      offsetX: 0.08,
      offsetY: -0.06,
      rotation: 0.55,
      grain: 0.012,
    } satisfies StepMeshConfig,
  },
  {
    kicker: 'LEADS',
    title: 'Know who to call first',
    body: 'Every form fill and open-house sign-in lands in one inbox, scored hot to cold, with the property and timeline attached.',
    src: '/landing/leads-inbox.png',
    url: `${SITE_DOMAIN}/dashboard/leads`,
    label: '02 Leads',
    mesh: {
      baseColor: '#0668E1',
      colors: ['#0668E1', '#0452AD', '#2E86FB'],
      distortion: 5.5,
      swirl: 0.78,
      scale: 1.05,
      offsetX: -0.12,
      offsetY: 0.04,
      rotation: 1.35,
      grain: 0.012,
    } satisfies StepMeshConfig,
  },
  {
    kicker: 'TRANSACTIONS',
    title: 'Nothing slips before closing',
    body: 'Checklists, documents, and deadline reminders on every deal — so the week before closing stops being a scramble.',
    src: '/landing/transactions.png',
    url: `${SITE_DOMAIN}/dashboard/transactions`,
    label: '03 Transactions',
    mesh: {
      baseColor: '#0452AD',
      colors: ['#0452AD', '#2E86FB', '#0668E1'],
      distortion: 6,
      swirl: 1.12,
      scale: 0.98,
      offsetX: 0.04,
      offsetY: 0.1,
      rotation: 2.1,
      grain: 0.01,
    } satisfies StepMeshConfig,
  },
] as const;

function ScreenshotPanel({
  src,
  alt,
  url,
  active,
  mesh,
}: {
  src: string;
  alt: string;
  url: string;
  active: boolean;
  mesh: StepMeshConfig;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="absolute inset-0 motion-reduce:transition-none"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: active ? 'auto' : 'none',
        zIndex: active ? 2 : 1,
        transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[20px]">
        <GradientMesh {...STATIC_MESH} {...mesh} />
        <div className="relative z-[1] h-full p-4">
          <BrowserWindowFrame className="shadow-[var(--mkt-shadow-soft)]">
            <div className="border-b border-mkt-border bg-white px-3 py-1.5">
              <p className="truncate font-mkt-mono text-[11px] text-[#6B6D76]">{url}</p>
            </div>
            <div className="relative h-[196px] w-full bg-white">
              {!failed ? (
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-cover object-top"
                  sizes="(min-width: 1024px) 480px, 100vw"
                  onError={() => setFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
                  <p className="mb-2 font-mkt-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#6B6D76]">
                    Screenshot
                  </p>
                  <p className="max-w-[220px] text-sm font-medium text-[#111111]">{alt}</p>
                </div>
              )}
            </div>
          </BrowserWindowFrame>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  progress,
  isFirst = false,
}: {
  label: string;
  progress: number;
  isFirst?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-6 border-t border-[#EAEAEA] py-3.5 ${isFirst ? 'border-t-0' : ''}`}
    >
      <span className="shrink-0 text-[15px] font-medium text-[#111111]">{label}</span>
      <div className="h-[2px] min-w-[80px] flex-1 overflow-hidden rounded-full bg-[#EAEAEA] sm:min-w-[130px]">
        <div
          className="h-full origin-left rounded-full bg-[#0668E1] motion-reduce:transition-none"
          style={{
            transform: `scaleX(${progress})`,
            transition: 'transform 0.12s linear',
          }}
        />
      </div>
    </div>
  );
}

function StaticStepRow({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="grid gap-8 border-t border-[#EAEAEA] py-12 first:border-t-0 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
          {step.kicker}
        </p>
        <h3 className="font-display mt-4 text-[32px] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111]">
          {step.title}
        </h3>
        <p className="mt-4 text-[18px] leading-[1.55] text-[#6B6D76]">{step.body}</p>
      </div>
      <div className="relative h-[248px]">
        <ScreenshotPanel
          src={step.src}
          alt={step.title}
          url={step.url}
          mesh={step.mesh}
          active
        />
      </div>
    </div>
  );
}

export default function LandingWhySwitcher() {
  const reduced = useMotionReduced();
  const triggerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);

  useGSAP(
    () => {
      if (reduced || !triggerRef.current || !pinRef.current) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: triggerRef.current,
          start: `top top+=${STICKY_TOP}`,
          end: () => `+=${getScrollTravel()}`,
          pin: pinRef.current,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.35,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProg(self.progress);
            if (pinRef.current) pinRef.current.style.zIndex = self.isActive ? '1' : '0';
          },
        });

        return () => st.kill();
      });

      return () => mm.revert();
    },
    { scope: triggerRef, dependencies: [reduced], revertOnUpdate: true },
  );

  const active = prog >= 2 * SEGMENT ? 2 : prog >= SEGMENT ? 1 : 0;
  const segProgress = (index: number) =>
    Math.min(1, Math.max(0, (prog - index * SEGMENT) / SEGMENT));
  const textScrollOffset = prog * (STEPS.length - 1) * STEP_SLOT;

  return (
    <section className="relative isolate bg-white pb-16 text-[#111111] sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-mkt-content px-5 pb-12 pt-20 sm:px-8 sm:pb-16 lg:pb-20 lg:pt-24">
        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
          WHY {SITE_NAME.toUpperCase()}
        </p>
        <h2
          className="font-display mt-4 max-w-[22ch] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#111111]"
          style={{ fontSize: 'clamp(40px, 5vw, 60px)' }}
        >
          {SITE_NAME} is your real estate workspace
        </h2>
        <p className="mt-5 max-w-[46ch] text-[20px] leading-[1.55] text-[#6B6D76]">
          From first inquiry to closing day, {SITE_NAME} is where solo agents run the work that
          usually eats the evening.
        </p>
      </div>

      {reduced ? (
        <div className="mx-auto max-w-mkt-content px-5 pb-16 sm:px-8">
          {STEPS.map((step) => (
            <StaticStepRow key={step.kicker} step={step} />
          ))}
        </div>
      ) : (
        <>
          <div ref={triggerRef} className="relative z-0 mx-auto hidden max-w-mkt-content px-5 pb-12 pt-4 sm:px-8 lg:block lg:pb-20 lg:pt-8">
            <div ref={pinRef} className="w-full bg-white">
              <div className="grid grid-cols-2 items-start gap-14">
                <div className="flex min-w-0 flex-col justify-center">
                <div className="overflow-hidden" style={{ height: STEP_SLOT }}>
                  <div
                    className="will-change-transform"
                    style={{ transform: `translateY(-${textScrollOffset}px)` }}
                  >
                    {STEPS.map((step) => (
                      <div
                        key={step.kicker}
                        className="flex flex-col justify-center"
                        style={{ height: STEP_SLOT }}
                      >
                        <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
                          {step.kicker}
                        </p>
                        <h3 className="font-display mt-3 max-w-[18ch] text-[clamp(26px,3vw,36px)] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111]">
                          {step.title}
                        </h3>
                        <p className="mt-3 max-w-[42ch] text-[17px] leading-[1.55] text-[#6B6D76]">
                          {step.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-[#EAEAEA] pt-1">
                  {STEPS.map((step, index) => (
                    <ProgressRow
                      key={step.kicker}
                      label={step.label}
                      progress={segProgress(index)}
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-start justify-end">
                <div className="relative h-[260px] w-full max-w-[480px]">
                  {STEPS.map((step, index) => (
                    <ScreenshotPanel
                      key={step.kicker}
                      src={step.src}
                      alt={step.title}
                      url={step.url}
                      mesh={step.mesh}
                      active={active === index}
                    />
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="pb-16 pt-4 sm:pb-20 lg:hidden">
            <div className="mx-auto max-w-mkt-content space-y-12 px-5 sm:px-8">
              {STEPS.map((step) => (
                <div key={step.kicker}>
                  <p className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0668E1]">
                    {step.kicker}
                  </p>
                  <h3 className="font-display mt-3 text-[28px] font-bold leading-[1.08] tracking-[-0.035em] text-[#111111]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[17px] leading-[1.55] text-[#6B6D76]">{step.body}</p>
                  <div className="relative mt-6 h-[248px]">
                    <ScreenshotPanel
                      src={step.src}
                      alt={step.title}
                      url={step.url}
                      mesh={step.mesh}
                      active
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

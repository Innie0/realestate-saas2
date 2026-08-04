'use client';

import clsx from 'clsx';
import { useLandingTypingLoop } from '@/lib/use-landing-typing-loop';
import { SITE_NAME } from '@/lib/site-config';
import { useMotionReduced } from '@/lib/motion';

const HERO_GRADIENT =
  'linear-gradient(180deg,#0668E1 0%,#0668E1 38%,#2E86FB 54%,#4B93FC 68%,#7FB4FD 82%,#A8CCFE 91%,#DCEBFE 97%,#FFFFFF 100%)';

const ENTRANCE =
  'motion-safe:animate-[landing-fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none';

export default function LandingHeroFade() {
  const reduced = useMotionReduced();
  const typedText = useLandingTypingLoop();

  return (
    <>
      <style>{`
        @keyframes landing-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes landing-caret-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <section
        className="relative text-center text-[#111111]"
        style={{ background: HERO_GRADIENT }}
      >
        <div className="mx-auto max-w-mkt-content px-5 pb-[280px] pt-[calc(var(--mkt-nav-height)+4.5rem)] sm:px-8 sm:pt-[calc(var(--mkt-nav-height)+5.5rem)]">
          <h1
            id="landing-hero-headline"
            className={clsx(
              'font-display mx-auto max-w-[15ch] font-extrabold leading-[0.9] tracking-[-0.055em] text-white',
              ENTRANCE,
              !reduced && '[animation-delay:0ms]',
            )}
            style={{ fontSize: 'clamp(64px, 8.75vw, 112px)' }}
          >
            Close faster.
            <br />
            Less admin.
          </h1>

          <p
            className={clsx(
              'mx-auto mt-8 max-w-[50ch] text-[20px] leading-[1.5] text-white/[0.82] sm:mt-[32px]',
              ENTRANCE,
              !reduced && '[animation-delay:80ms]',
            )}
          >
            Listings, leads and closings in one workspace. Ask in plain English — {SITE_NAME} does the
            paperwork.
          </p>

          <div
            className={clsx(
              'mx-auto mt-10 max-w-[740px] sm:mt-11',
              ENTRANCE,
              !reduced && '[animation-delay:160ms]',
            )}
          >
            <div
              className="rounded-[18px] bg-white px-[22px] pb-4 pt-5 text-left"
              style={{
                boxShadow:
                  '0 0 0 6px rgba(255,255,255,0.22), 0 30px 60px -30px rgba(0,0,0,0.45)',
              }}
            >
              <div className="min-h-[74px] text-[19px] leading-[1.45] text-[#111111]">
                <span>{typedText}</span>
                <span
                  className="ml-0.5 inline-block w-[2px] align-[-3px]"
                  style={{
                    height: '21px',
                    backgroundColor: '#0668E1',
                    animation: reduced ? undefined : 'landing-caret-blink 1s steps(1) infinite',
                  }}
                  aria-hidden
                />
              </div>

              <div className="mt-0 flex items-center gap-3.5 border-t border-[#EAEAEA] pt-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#EAEAEA] text-[17px] text-[#6B6D76]">
                  +
                </span>
                <span className="font-mkt-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6D76]">
                  PROMPTS
                </span>
                <span className="ml-auto inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#0668E1] px-[18px] text-[14.5px] font-semibold text-white">
                  Generate <span aria-hidden>↑</span>
                </span>
              </div>
            </div>

            <p className="mt-5 text-[14px] text-white/70">
              7 days free · No setup fees · Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

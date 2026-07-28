'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import {
  HERO_INPUT_PLACEHOLDERS,
  HERO_QUICK_ACTIONS,
  HERO_TRUST_BRANDS,
  persistHeroPrompt,
} from '@/lib/landing-hero-prompts';
import LandingGradientPanel from '@/components/home/LandingGradientPanel';
import { useMotionReduced } from '@/lib/motion';

type LandingHeroProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

ensureGsapRegistered();

const TYPE_MS = 48;
const DELETE_MS = 28;
const PAUSE_FULL_MS = 2200;
const PAUSE_EMPTY_MS = 420;

function useTypingPlaceholder(active: boolean) {
  const reduced = useMotionReduced();
  const [text, setText] = useState<string>(HERO_INPUT_PLACEHOLDERS[0]);
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    if (!active || reduced) {
      setText(HERO_INPUT_PLACEHOLDERS[phraseIndex.current]);
      return;
    }

    let timeout = 0;

    const tick = () => {
      const phrase = HERO_INPUT_PLACEHOLDERS[phraseIndex.current];

      if (!deleting.current) {
        charIndex.current = Math.min(charIndex.current + 1, phrase.length);
        setText(phrase.slice(0, charIndex.current));

        if (charIndex.current >= phrase.length) {
          deleting.current = true;
          timeout = window.setTimeout(tick, PAUSE_FULL_MS);
          return;
        }

        timeout = window.setTimeout(tick, TYPE_MS);
        return;
      }

      charIndex.current = Math.max(charIndex.current - 1, 0);
      setText(phrase.slice(0, charIndex.current));

      if (charIndex.current <= 0) {
        deleting.current = false;
        phraseIndex.current = (phraseIndex.current + 1) % HERO_INPUT_PLACEHOLDERS.length;
        timeout = window.setTimeout(tick, PAUSE_EMPTY_MS);
        return;
      }

      timeout = window.setTimeout(tick, DELETE_MS);
    };

    timeout = window.setTimeout(tick, PAUSE_EMPTY_MS);
    return () => window.clearTimeout(timeout);
  }, [active, reduced]);

  return text;
}

export default function LandingHero({ sectionRef }: LandingHeroProps) {
  const router = useRouter();
  const reduced = useMotionReduced();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const showTypingDemo = !focused && !query;
  const typingPlaceholder = useTypingPlaceholder(showTypingDemo);

  const goToSignup = (prompt?: string) => {
    const trimmed = (prompt ?? query).trim();
    if (trimmed) persistHeroPrompt(trimmed);
    router.push('/auth/signup');
  };

  useGSAP(
    () => {
      if (reduced || !rootRef.current) return;

      const headline = rootRef.current.querySelector('[data-hero-headline]');
      const subcopy = rootRef.current.querySelector('[data-hero-subcopy]');
      const inputBox = rootRef.current.querySelector('[data-hero-input]');
      const actions = rootRef.current.querySelector('[data-hero-actions]');
      const trust = rootRef.current.querySelector('[data-hero-trust]');

      gsap.set([headline, subcopy, inputBox, actions, trust], { autoAlpha: 0, y: 20 });

      const tl = gsap.timeline({
        defaults: { ease: landingRevealDefaults.ease, duration: landingRevealDefaults.duration },
      });

      tl.to(headline, { autoAlpha: 1, y: 0, duration: 0.45 })
        .to(subcopy, { autoAlpha: 1, y: 0, duration: 0.38 }, '-=0.22')
        .to(inputBox, { autoAlpha: 1, y: 0, duration: 0.42 }, '-=0.18')
        .to(actions, { autoAlpha: 1, y: 0, duration: 0.35 }, '-=0.2')
        .to(trust, { autoAlpha: 1, y: 0, duration: 0.35 }, '-=0.15');
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative flex min-h-svh flex-col bg-mkt-background pt-16 sm:pt-[4.5rem]"
    >
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 sm:px-3 sm:pb-3">
        <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
          <LandingGradientPanel
            variant="hero"
            mesh="animated"
            elevated="hero"
            fill
            innerClassName="flex flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
          >
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mx-auto w-full max-w-3xl text-center">
              <h1
                data-hero-headline
                className="font-display text-[clamp(2.35rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-white"
              >
                Run Your Business with Oikaro
              </h1>

              <p
                data-hero-subcopy
                className="mx-auto mt-4 max-w-xl text-base leading-[1.6] text-white/80 sm:text-lg"
              >
                Get more done by chatting with AI — listings, leads, CMAs, and follow-ups from one
                workspace built for real estate agents.
              </p>

              <form
                data-hero-input
                className="relative mx-auto mt-8 max-w-2xl sm:mt-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  goToSignup();
                }}
              >
                <div
                  className={clsx(
                    'landing-hero-input-box relative cursor-text rounded-[1.25rem] border border-white p-2 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.35)] transition-all duration-200 sm:rounded-[1.35rem] sm:p-2.5',
                    focused && 'ring-4 ring-white/25',
                  )}
                  onClick={() => inputRef.current?.focus()}
                >
                  <div className="flex items-center gap-2 px-3 pt-2 sm:px-4">
                    <Sparkles className="size-4 shrink-0 text-mkt-accent" strokeWidth={2.2} aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-mkt-accent">
                      AI Assistant
                    </span>
                  </div>
                  <div className="relative mt-1 px-3 pb-14 sm:px-4 sm:pb-[3.75rem]">
                    {showTypingDemo ? (
                      <p
                        className="pointer-events-none absolute inset-x-3 top-0 text-left text-base text-[#78726a] sm:inset-x-4 sm:text-[17px]"
                        aria-hidden
                      >
                        {typingPlaceholder}
                      </p>
                    ) : null}
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder={showTypingDemo ? '' : 'Ask AI anything about listings, leads, or deals...'}
                      aria-label="Ask Oikaro AI"
                      className="relative w-full border-0 bg-transparent text-left text-base text-[#111111] placeholder:text-[#78726a] focus:outline-none focus:ring-0 sm:text-[17px]"
                    />
                  </div>
                  <button
                    type="submit"
                    aria-label="Submit to AI Assistant"
                    className="absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-full bg-mkt-accent text-white transition-colors hover:bg-mkt-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:bottom-3.5 sm:right-3.5"
                  >
                    <ArrowUp className="size-5" strokeWidth={2.5} />
                  </button>
                </div>
              </form>

              <div
                data-hero-actions
                className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5 sm:gap-2.5"
              >
                {HERO_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => goToSignup(action.prompt)}
                    className="landing-hero-action-btn rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              </div>
            </div>

            <div data-hero-trust className="w-full shrink-0 pt-6 sm:pt-8">
              <p className="mb-5 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                Used by agents at leading brokerages
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">
                {HERO_TRUST_BRANDS.map((brand) => (
                  <span
                    key={brand}
                    className="text-sm font-semibold tracking-[-0.02em] text-white/70 sm:text-[15px]"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </LandingGradientPanel>
        </div>
      </div>
    </section>
  );
}

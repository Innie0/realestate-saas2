'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import {
  HERO_INPUT_PLACEHOLDERS,
  HERO_QUICK_ACTIONS,
  persistHeroPrompt,
} from '@/lib/landing-hero-prompts';
import { useMotionReduced } from '@/lib/motion';

type LandingHeroProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

ensureGsapRegistered();

function useCyclingPlaceholder(enabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_INPUT_PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return HERO_INPUT_PLACEHOLDERS[index];
}

export default function LandingHero({ sectionRef }: LandingHeroProps) {
  const router = useRouter();
  const reduced = useMotionReduced();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const cyclingPlaceholder = useCyclingPlaceholder(!focused && !query);
  const placeholder = focused || query ? 'Ask AI anything about listings, leads, or deals...' : cyclingPlaceholder;

  const submitPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    persistHeroPrompt(trimmed);
    router.push('/auth/signup');
  };

  useGSAP(
    () => {
      if (reduced || !rootRef.current) return;

      const headline = rootRef.current.querySelector('[data-hero-headline]');
      const subcopy = rootRef.current.querySelector('[data-hero-subcopy]');
      const inputBox = rootRef.current.querySelector('[data-hero-input]');
      const actions = rootRef.current.querySelector('[data-hero-actions]');

      gsap.set([headline, subcopy, inputBox, actions], { autoAlpha: 0, y: 20 });

      const tl = gsap.timeline({
        defaults: { ease: landingRevealDefaults.ease, duration: landingRevealDefaults.duration },
      });

      tl.to(headline, { autoAlpha: 1, y: 0, duration: 0.45 })
        .to(subcopy, { autoAlpha: 1, y: 0, duration: 0.38 }, '-=0.22')
        .to(inputBox, { autoAlpha: 1, y: 0, duration: 0.42 }, '-=0.18')
        .to(actions, { autoAlpha: 1, y: 0, duration: 0.35 }, '-=0.2');
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative overflow-hidden bg-mkt-background pt-28 sm:pt-32 lg:pt-36"
    >
      <div
        ref={rootRef}
        className="relative mx-auto w-full max-w-mkt-content px-5 pb-10 sm:px-8 sm:pb-14"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1
            data-hero-headline
            className="font-display text-[clamp(2.5rem,6.5vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-mkt-foreground"
          >
            Run Your Business{' '}
            <span className="inline-block text-mkt-accent" aria-hidden>
              ⚡
            </span>{' '}
            with Oikaro
          </h1>

          <p
            data-hero-subcopy
            className="mx-auto mt-5 max-w-2xl text-base leading-[1.65] text-mkt-secondary sm:text-lg sm:leading-[1.6]"
          >
            Get more done by chatting with AI — listings, leads, CMAs, and follow-ups from one
            workspace built for real estate agents.
          </p>

          <form
            data-hero-input
            className="relative mx-auto mt-10 max-w-3xl"
            onSubmit={(e) => {
              e.preventDefault();
              submitPrompt(query);
            }}
          >
            <div
              className={clsx(
                'relative rounded-[1.35rem] border bg-mkt-surface p-2 shadow-[0_20px_60px_-24px_rgba(53,72,199,0.35)] transition-all duration-200 sm:rounded-[1.5rem] sm:p-2.5',
                focused
                  ? 'border-mkt-accent ring-4 ring-[rgba(53,72,199,0.12)]'
                  : 'border-mkt-border hover:border-[rgba(53,72,199,0.35)]',
              )}
            >
              <div className="flex items-center gap-2 px-3 pt-2 sm:px-4">
                <Sparkles className="size-4 shrink-0 text-mkt-accent" strokeWidth={2.2} aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-mkt-accent">
                  AI Assistant
                </span>
              </div>
              <div className="relative mt-1 px-3 pb-14 sm:px-4 sm:pb-[3.75rem]">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={placeholder}
                  aria-label="Ask Oikaro AI"
                  className="w-full border-0 bg-transparent text-left text-base text-mkt-foreground placeholder:text-mkt-muted focus:outline-none focus:ring-0 sm:text-[17px]"
                />
              </div>
              <button
                type="submit"
                aria-label="Submit to AI Assistant"
                className="absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-full bg-mkt-accent text-mkt-accent-foreground transition-colors hover:bg-mkt-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent/40 focus-visible:ring-offset-2 sm:bottom-3.5 sm:right-3.5"
              >
                <ArrowUp className="size-5" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          <div
            data-hero-actions
            className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
          >
            {HERO_QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  setQuery(action.prompt);
                  submitPrompt(action.prompt);
                }}
                className="rounded-full border border-mkt-border bg-mkt-surface px-4 py-2 text-sm font-medium text-mkt-foreground transition-colors hover:border-[rgba(53,72,199,0.35)] hover:bg-[rgba(53,72,199,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent/30"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

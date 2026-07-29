'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import { ArrowRight, Inbox, Sparkles } from 'lucide-react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import HeroAssistantPreview from '@/components/home/HeroAssistantPreview';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';
import { BackgroundPathsLayer } from '@/components/ui/background-paths';
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

const HERO_PREVIEW_SCALE_START = 1.12;
const HERO_PREVIEW_SCALE_END = 1;

const HERO_SIDE_CARDS = [
  {
    id: 'lead',
    side: 'left' as const,
    icon: Inbox,
    label: 'New lead',
    title: 'Sarah Martinez',
    detail: 'Interested in 742 Oak St · Buyer',
    tag: 'Hot',
    tagClass: 'bg-mkt-tag-amber-bg text-mkt-tag-amber-text',
  },
  {
    id: 'listing',
    side: 'right' as const,
    icon: Sparkles,
    label: 'AI listing',
    title: '3-bed in Austin',
    detail: 'Draft ready · 12 comps pulled',
    tag: 'Ready',
    tagClass: 'bg-mkt-tag-green-bg text-mkt-tag-green-text',
  },
] as const;

function HeroSideCard({
  icon: Icon,
  label,
  title,
  detail,
  tag,
  tagClass,
}: (typeof HERO_SIDE_CARDS)[number]) {
  return (
    <div className="rounded-mkt-card border border-mkt-border bg-mkt-surface p-4 shadow-[var(--mkt-shadow-card)] ring-1 ring-black/[0.04] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-mkt-surface-muted">
            <Icon className="size-4 text-mkt-secondary" strokeWidth={1.75} />
          </span>
          <p className="text-mkt-label text-[10px] font-medium uppercase tracking-[0.1em] text-mkt-muted">
            {label}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${tagClass}`}>
          {tag}
        </span>
      </div>
      <p className="mt-3 text-[15px] font-semibold tracking-[-0.02em] text-mkt-foreground">{title}</p>
      <p className="mt-1 text-sm leading-snug text-mkt-secondary">{detail}</p>
    </div>
  );
}

type LandingHeroAttioProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

export default function LandingHeroAttio({ sectionRef }: LandingHeroAttioProps) {
  const reduced = useMotionReduced();
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const pathsWrapRef = useRef<HTMLDivElement>(null);
  const sectionElRef = useRef<HTMLElement | null>(null);

  const mergeSectionRef = (node: HTMLElement | null) => {
    sectionElRef.current = node;
    if (sectionRef) {
      (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  useLayoutEffect(() => {
    if (reduced) return;

    const updatePathsBounds = () => {
      const section = sectionElRef.current;
      const preview = previewRef.current;
      const pathsWrap = pathsWrapRef.current;
      const divider = dividerRef.current;
      if (!section || !preview || !pathsWrap) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const previewRect = preview.getBoundingClientRect();
      const pathsTop = previewRect.top + window.scrollY + previewRect.height / 2 - sectionTop;

      let pathsBottom = section.offsetHeight;
      if (divider) {
        pathsBottom = divider.getBoundingClientRect().top + window.scrollY - sectionTop;
      }

      pathsWrap.style.top = `${Math.max(0, pathsTop)}px`;
      pathsWrap.style.height = `${Math.max(0, pathsBottom - pathsTop)}px`;
    };

    updatePathsBounds();
    window.addEventListener('resize', updatePathsBounds);

    const syncTrigger = ScrollTrigger.create({
      trigger: trackRef.current ?? sectionElRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: updatePathsBounds,
      invalidateOnRefresh: true,
    });

    return () => {
      window.removeEventListener('resize', updatePathsBounds);
      syncTrigger.kill();
    };
  }, [reduced]);

  useGSAP(
    () => {
      const track = trackRef.current;
      const content = contentRef.current;
      const copy = copyRef.current;
      const preview = previewRef.current;
      const stage = stageRef.current;
      if (reduced || !track || !content || !copy || !preview || !stage) return;

      const sideCards = gsap.utils.toArray<HTMLElement>('[data-hero-side]', stage);

      gsap.set(sideCards, { autoAlpha: 0, y: 32, scale: 0.96 });
      gsap.set(preview, {
        scale: HERO_PREVIEW_SCALE_START,
        transformOrigin: '50% 18%',
      });
      gsap.set(content, { y: 0 });
      gsap.set(copy, { autoAlpha: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.95,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        copy,
        {
          autoAlpha: 0,
          y: -16,
          duration: 0.12,
          ease: 'power2.in',
        },
        0,
      )
        .to(
          content,
          {
            y: -88,
            duration: 0.22,
            ease: 'power2.out',
          },
          0.02,
        )
        .to(
          preview,
          {
            scale: HERO_PREVIEW_SCALE_END,
            duration: 0.2,
            ease: 'power2.out',
          },
          0.04,
        )
        .to(
          sideCards,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.18,
            stagger: 0.04,
            ease: 'power2.out',
          },
          0.1,
        );

      ScrollTrigger.refresh();
      if (tl.scrollTrigger) {
        tl.progress(tl.scrollTrigger.progress);
      }

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: trackRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={mergeSectionRef}
      className="relative overflow-hidden bg-mkt-background"
    >
      <div
        ref={pathsWrapRef}
        className="pointer-events-none absolute inset-x-0 z-0"
        aria-hidden
      >
        <BackgroundPathsLayer className="h-full w-full" />
      </div>

      <div ref={trackRef} className="relative z-[1] h-[130vh] xl:h-[140vh]">
        <div className="sticky top-[var(--mkt-nav-height)] flex min-h-[calc(100dvh-var(--mkt-nav-height))] flex-col justify-center">
          <div ref={contentRef} className="mx-auto w-full max-w-mkt-content px-5 pt-8 sm:px-8 lg:pt-10">
          <div ref={copyRef} data-hero-copy className="mx-auto max-w-3xl text-center will-change-transform">
            <MarketingBlurFade delay={0}>
              <h1 className="font-mkt-display text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-[1.06] tracking-[-0.05em] text-mkt-foreground">
                Welcome to Oikaro
              </h1>
            </MarketingBlurFade>

            <MarketingBlurFade delay={0.08}>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-mkt-secondary sm:text-xl sm:leading-[1.5]">
                The all-in-one workflow for real estate agents — listings, leads, clients, and deals in
                one place.
              </p>
            </MarketingBlurFade>

            <MarketingBlurFade delay={0.14}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <MarketingShimmerCta href="/auth/signup" size="lg">
                  Start free trial
                </MarketingShimmerCta>
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-mkt-button border border-mkt-border bg-mkt-surface px-7 text-[15px] font-medium text-mkt-foreground transition-colors duration-200 hover:border-mkt-foreground hover:bg-mkt-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-foreground/30"
                >
                  See demo
                  <ArrowRight className="size-4" strokeWidth={1.75} />
                </Link>
              </div>
              <p className="mt-3 text-sm text-mkt-muted">7 days free · No setup fees · Cancel anytime</p>
            </MarketingBlurFade>
          </div>

          <div
            ref={stageRef}
            className="relative mx-auto mt-12 w-full max-w-[1180px] overflow-visible sm:mt-14 lg:mt-16"
          >
            {reduced ? (
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                {HERO_SIDE_CARDS.map((card) => (
                  <HeroSideCard key={card.id} {...card} />
                ))}
              </div>
            ) : (
              HERO_SIDE_CARDS.map((card) => (
                <div
                  key={card.id}
                  data-hero-side={card.side}
                  className={`pointer-events-none absolute hidden w-[200px] invisible opacity-0 translate-y-8 scale-[0.96] will-change-transform xl:block ${
                    card.side === 'left'
                      ? 'left-[-3rem] top-[24%] z-[3] -translate-y-1/2 translate-x-0'
                      : 'right-[-3rem] top-[70%] z-[1] -translate-y-1/2 translate-x-0'
                  }`}
                >
                  <HeroSideCard {...card} />
                </div>
              ))
            )}

            <MarketingBlurFade delay={0.24} inView className="relative z-[2] mx-auto w-full max-w-[920px]">
              <div
                ref={previewRef}
                data-hero-preview
                className={`origin-[50%_18%] overflow-hidden rounded-mkt-browser bg-mkt-surface shadow-[var(--mkt-shadow-card)] ring-1 ring-black/[0.04] will-change-transform ${
                  reduced ? '' : 'scale-[1.12]'
                }`}
              >
                <BrowserWindowFrame>
                  <HeroAssistantPreview animateWhenVisible compactChrome />
                </BrowserWindowFrame>
              </div>
            </MarketingBlurFade>
          </div>
          </div>
        </div>
      </div>

      <div
        ref={dividerRef}
        className="relative z-[1] mx-auto max-w-mkt-content px-5 pb-[var(--mkt-section-pb)] pt-10 sm:px-8 sm:pt-12"
      >
        <div className="border-t border-mkt-border" aria-hidden />
      </div>
    </section>
  );
}

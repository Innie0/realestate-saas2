'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, Inbox, Sparkles } from 'lucide-react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import HeroAssistantPreview from '@/components/home/HeroAssistantPreview';
import MarketingBlurFade from '@/components/marketing/MarketingBlurFade';
import MarketingShimmerCta from '@/components/marketing/MarketingShimmerCta';
import { Marquee } from '@/components/ui/marquee';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { HERO_TRUST_BRANDS } from '@/lib/landing-hero-prompts';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

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
      gsap.set(preview, { scale: 1 });
      gsap.set(content, { y: 0 });
      gsap.set(copy, { autoAlpha: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.55,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        copy,
        {
          autoAlpha: 0,
          y: -16,
          duration: 0.18,
          ease: 'power2.in',
        },
        0,
      )
        .to(
          content,
          {
            y: -88,
            duration: 0.28,
            ease: 'power2.out',
          },
          0.02,
        )
        .to(
          preview,
          {
            scale: 1.02,
            duration: 0.22,
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
            duration: 0.22,
            stagger: 0.05,
            ease: 'power2.out',
          },
          0.1,
        );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: trackRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative bg-mkt-background"
    >
      <div ref={trackRef} className="relative h-[120vh] xl:h-[130vh]">
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-mkt-button border border-mkt-border bg-mkt-surface px-7 text-[15px] font-medium text-mkt-foreground transition-colors duration-200 hover:bg-mkt-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent/30"
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
            className="relative mx-auto mt-10 w-full max-w-[1120px] sm:mt-12"
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
                  className={`pointer-events-none absolute top-1/2 z-[1] hidden w-[200px] -translate-y-1/2 will-change-transform xl:block ${
                    card.side === 'left' ? 'left-0' : 'right-0'
                  }`}
                >
                  <HeroSideCard {...card} />
                </div>
              ))
            )}

            <MarketingBlurFade delay={0.24} inView className="relative z-[2] mx-auto w-full max-w-[760px]">
              <div
                ref={previewRef}
                data-hero-preview
                className="overflow-hidden rounded-mkt-browser bg-mkt-surface shadow-[var(--mkt-shadow-card)] ring-1 ring-black/[0.04]"
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

      <div className="mx-auto max-w-mkt-content px-5 pb-[var(--mkt-section-pb)] pt-4 sm:px-8">
        <MarketingBlurFade delay={0.3} inView className="mt-12 sm:mt-14">
          <p className="mb-5 text-center text-mkt-label text-[10px] font-medium uppercase tracking-[0.12em] text-mkt-muted">
            Used by agents at leading brokerages
          </p>
          {reduced ? (
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {HERO_TRUST_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="text-sm font-medium tracking-[-0.02em] text-mkt-secondary"
                >
                  {brand}
                </span>
              ))}
            </div>
          ) : (
            <Marquee pauseOnHover className="[--duration:32s] [--gap:2.5rem]">
              {HERO_TRUST_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="text-sm font-medium tracking-[-0.02em] text-mkt-secondary"
                >
                  {brand}
                </span>
              ))}
            </Marquee>
          )}
        </MarketingBlurFade>
      </div>
    </section>
  );
}

'use client';

import type { RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { mktVar } from '@/lib/mkt-css';

export const LANDING_MOTION = {
  ease: 'power2.out',
  duration: 0.4,
  durationSlow: 0.5,
  y: 14,
  stagger: 0.07,
  hover: { scale: 1.015, y: -3, duration: 0.28 },
} as const;

export function prefersFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Attach subtle lift/scale hover motion to a card or button element. */
export function bindHoverMotion(
  el: HTMLElement,
  options: { scale?: number; y?: number; duration?: number } = {},
) {
  if (!prefersFinePointer()) return () => {};

  const scale = options.scale ?? LANDING_MOTION.hover.scale;
  const y = options.y ?? LANDING_MOTION.hover.y;
  const duration = options.duration ?? LANDING_MOTION.hover.duration;

  const onEnter = () => {
    gsap.to(el, { scale, y, duration, ease: LANDING_MOTION.ease });
  };
  const onLeave = () => {
    gsap.to(el, { scale: 1, y: 0, duration, ease: LANDING_MOTION.ease });
  };
  const onDown = () => {
    gsap.to(el, { scale: 0.985, duration: 0.15, ease: LANDING_MOTION.ease });
  };
  const onUp = () => {
    gsap.to(el, { scale, duration: 0.15, ease: LANDING_MOTION.ease });
  };

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mouseleave', onLeave);
  el.addEventListener('mousedown', onDown);
  el.addEventListener('mouseup', onUp);

  return () => {
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
    el.removeEventListener('mousedown', onDown);
    el.removeEventListener('mouseup', onUp);
  };
}

/** Scroll-triggered stagger reveal for `[data-reveal]` children inside scope. */
export function scrollStaggerReveal(
  scope: HTMLElement,
  options: {
    stagger?: number;
    start?: string;
    delay?: number;
    y?: number;
    duration?: number;
  } = {},
) {
  const items = scope.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length) return;

  gsap.set(items, { autoAlpha: 0, y: options.y ?? LANDING_MOTION.y });

  return gsap.timeline({
    scrollTrigger: {
      trigger: scope,
      start: options.start ?? 'top 86%',
      once: true,
    },
    delay: options.delay ?? 0,
  }).to(items, {
    autoAlpha: 1,
    y: 0,
    duration: options.duration ?? LANDING_MOTION.duration,
    stagger: options.stagger ?? LANDING_MOTION.stagger,
    ease: LANDING_MOTION.ease,
  });
}

export type ParsedMetric = {
  prefix: string;
  value: number;
  suffix: string;
  decimals: number;
};

export function parseMetricValue(raw: string): ParsedMetric | null {
  const match = raw.trim().match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, num, suffix] = match;
  const value = Number(num);
  if (Number.isNaN(value)) return null;

  const decimals = num.includes('.') ? num.split('.')[1]?.length ?? 0 : 0;
  return { prefix, value, suffix, decimals };
}

/** Animate a numeric metric counting up when scrolled into view. */
export function animateCountUp(
  el: HTMLElement,
  target: ParsedMetric,
  options: { duration?: number; start?: string } = {},
) {
  const proxy = { val: 0 };

  const render = () => {
    el.textContent = `${target.prefix}${proxy.val.toFixed(target.decimals)}${target.suffix}`;
  };

  render();

  return gsap.to(proxy, {
    val: target.value,
    duration: options.duration ?? LANDING_MOTION.durationSlow,
    ease: LANDING_MOTION.ease,
    onUpdate: render,
    scrollTrigger: {
      trigger: el,
      start: options.start ?? 'top 90%',
      once: true,
    },
  });
}


/** Smooth nav chrome as user scrolls past the hero. */
export function bindNavScrollChrome(
  nav: HTMLElement,
  hero: HTMLElement,
  colors: { bg: string; border: string },
) {
  gsap.set(nav, {
    backgroundColor: mktVar('--mkt-nav-transparent-bg'),
    borderBottomColor: mktVar('--mkt-nav-transparent-border'),
    backdropFilter: 'blur(0px)',
  });

  const st = ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 72px',
    onEnter: () => {
      gsap.to(nav, {
        backgroundColor: colors.bg,
        borderBottomColor: colors.border,
        backdropFilter: 'blur(12px)',
        duration: 0.35,
        ease: LANDING_MOTION.ease,
      });
    },
    onLeaveBack: () => {
      gsap.to(nav, {
        backgroundColor: mktVar('--mkt-nav-transparent-bg'),
        borderBottomColor: mktVar('--mkt-nav-transparent-border'),
        backdropFilter: 'blur(0px)',
        duration: 0.35,
        ease: LANDING_MOTION.ease,
      });
    },
  });

  return () => {
    st.kill();
  };
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

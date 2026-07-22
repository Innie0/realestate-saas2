'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

let registered = false;

export function ensureGsapRegistered() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  registered = true;
}

export { gsap, ScrollTrigger, useGSAP };

export const LANDING_EASE = 'power3.out';

export const landingRevealDefaults = {
  opacity: 0,
  y: 24,
  duration: 0.75,
  ease: LANDING_EASE,
} as const;

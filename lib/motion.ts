'use client';

import { useReducedMotion } from 'framer-motion';

export const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

export const emptyStateIcon = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 22 },
  },
};

export const emptyStateText = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT, delay: 0.08 },
  },
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 6,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};

export const tabPanelTransition = {
  duration: 0.22,
  ease: EASE_OUT,
};

/** Respects prefers-reduced-motion for conditional animation skips. */
export function useMotionReduced(): boolean {
  return useReducedMotion() ?? false;
}

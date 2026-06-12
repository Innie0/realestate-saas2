'use client';

import { useEffect } from 'react';

export interface TourStep {
  element: string;     // CSS selector for the element to highlight
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
}

interface UseTourOptions {
  tourKey: string;       // unique key stored in localStorage e.g. 'tour_dashboard'
  steps: TourStep[];
  delayMs?: number;      // ms to wait before starting (default 800)
}

export function useTour({ tourKey, steps, delayMs = 800 }: UseTourOptions) {
  useEffect(() => {
    // Only run on client, only if not already seen
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(tourKey)) return;

    let driver: any;
    let timeout: ReturnType<typeof setTimeout>;

    const run = async () => {
      const { driver: driverFn } = await import('driver.js');

      driver = driverFn({
        animate: true,
        smoothScroll: true,
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Got it ✓',
        overlayColor: 'rgba(0,0,0,0.65)',
        popoverClass: 'realestic-tour',
        onDestroyed: () => {
          localStorage.setItem(tourKey, '1');
        },
        steps: steps.map(s => ({
          element: s.element,
          popover: {
            title: s.popover.title,
            description: s.popover.description,
            side: s.popover.side ?? 'bottom',
            align: s.popover.align ?? 'start',
          },
        })),
      });

      driver.drive();
    };

    timeout = setTimeout(run, delayMs);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Call this to manually restart the tour (e.g. from a help button) */
  const restartTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(tourKey);
      window.location.reload();
    }
  };

  return { restartTour };
}

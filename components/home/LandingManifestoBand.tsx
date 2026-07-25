'use client';

import { useMemo, useRef } from 'react';
import { ensureGsapRegistered, gsap, useGSAP } from '@/lib/gsap-config';
import { mktVar } from '@/lib/mkt-css';
import { useMotionReduced } from '@/lib/motion';

const MANIFESTO =
  'Agents use Oikaro to win more listings, capture every lead, and close with confidence — all from one workspace built for how they actually work.';

ensureGsapRegistered();

export default function LandingManifestoBand() {
  const reduced = useMotionReduced();
  const sectionRef = useRef<HTMLDivElement>(null);
  const words = useMemo(() => MANIFESTO.split(/\s+/), []);

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const spans = sectionRef.current.querySelectorAll('[data-word]');
      gsap.set(spans, { color: mktVar('--mkt-text-secondary') });

      gsap.to(spans, {
        color: mktVar('--mkt-text-primary'),
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'center 45%',
          scrub: 0.6,
        },
      });
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <div
      ref={sectionRef}
      className="bg-mkt-background py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <p
          className={`font-display max-w-4xl text-xl font-medium leading-[1.35] tracking-[-0.03em] sm:text-2xl lg:text-[2rem] lg:leading-[1.3] ${
            reduced ? 'text-mkt-foreground' : 'text-mkt-secondary'
          }`}
        >
          {words.map((word, index) => (
            <span key={`${word}-${index}`} data-word className="inline">
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

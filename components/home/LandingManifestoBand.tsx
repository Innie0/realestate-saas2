'use client';

import { useMemo, useRef } from 'react';
import { ensureGsapRegistered, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
import { MKT } from '@/lib/marketing-design';
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
      gsap.set(spans, { color: MKT.textSecondary });

      gsap.to(spans, {
        color: MKT.textPrimary,
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
      className="border-t py-28 sm:py-36 lg:py-44"
      style={{ borderColor: MKT.border, backgroundColor: MKT.background }}
    >
      <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <p
          className="font-display max-w-4xl text-2xl font-medium leading-[1.35] tracking-[-0.03em] sm:text-3xl lg:text-[2.35rem] lg:leading-[1.28]"
          style={{ color: reduced ? MKT.textPrimary : MKT.textSecondary }}
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

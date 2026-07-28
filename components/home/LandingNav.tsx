'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import MarketingHeaderNav from '@/components/marketing/MarketingHeaderNav';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

export default function LandingNav() {
  const reduced = useMotionReduced();
  const navRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 120 && y > lastScrollY.current && !menuOpen) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  useGSAP(
    () => {
      if (reduced || !navRef.current) return;
      gsap.from(navRef.current, {
        autoAlpha: 0,
        y: -12,
        duration: 0.4,
        ease: landingRevealDefaults.ease,
        delay: 0.04,
      });
    },
    { scope: navRef, dependencies: [reduced] },
  );

  return (
    <header
      ref={navRef as React.RefObject<HTMLElement>}
      className={clsx(
        'fixed inset-x-0 top-0 z-[60] border-b bg-mkt-background transition-[transform,border-color] duration-300 ease-out',
        menuOpen ? 'border-[rgba(17,17,17,0.14)]' : 'border-mkt-border',
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <div className="flex h-16 items-center sm:h-[4.5rem]">
          <MarketingHeaderNav onProductsMenuChange={setMenuOpen} />
        </div>
      </div>
    </header>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import MarketingHeaderNav from '@/components/marketing/MarketingHeaderNav';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { getLandingNavHeight, isConnectToolsNavDark } from '@/lib/landing-nav-theme';
import { useMotionReduced } from '@/lib/motion';

ensureGsapRegistered();

const NAV_BLUE = '#0668E1';
const NAV_BLUE_HERO = '#0452AD';

export default function LandingNav() {
  const reduced = useMotionReduced();
  const navRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkNav, setDarkNav] = useState(false);
  const [nearHeroText, setNearHeroText] = useState(true);
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

      setDarkNav(isConnectToolsNavDark());

      const headline = document.getElementById('landing-hero-headline');
      if (headline) {
        const navHeight = getLandingNavHeight();
        setNearHeroText(headline.getBoundingClientRect().bottom > navHeight + 12);
      } else {
        setNearHeroText(y < 520);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
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

  const onHeroBlue = !darkNav;
  const navBlue = onHeroBlue && nearHeroText ? NAV_BLUE_HERO : NAV_BLUE;

  return (
    <header
      ref={navRef as React.RefObject<HTMLElement>}
      className={clsx(
        'fixed inset-x-0 top-0 z-[60] border-b transition-[transform,background-color,border-color,color] duration-300 ease-out',
        onHeroBlue
          ? 'border-transparent text-white'
          : darkNav
            ? 'border-white/10 bg-[#0a0a0a] text-white'
            : 'border-mkt-border bg-white text-mkt-foreground',
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
      )}
      style={onHeroBlue ? { backgroundColor: navBlue } : undefined}
    >
      <div className="mx-auto max-w-mkt-content px-5 sm:px-8">
        <div className="flex h-[var(--mkt-nav-height)] items-center">
          <MarketingHeaderNav
            inverted={onHeroBlue || darkNav}
            heroFade={onHeroBlue}
            onProductsMenuChange={setMenuOpen}
          />
        </div>
      </div>
    </header>
  );
}

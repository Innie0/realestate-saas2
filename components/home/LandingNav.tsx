'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import MarketingButton from '@/components/marketing/MarketingButton';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { bindNavScrollChrome } from '@/lib/landing-motion';
import { MKT } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

type LandingNavProps = {
  heroRef: React.RefObject<HTMLElement | null>;
};

ensureGsapRegistered();

export default function LandingNav({ heroRef }: LandingNavProps) {
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

  useGSAP(
    () => {
      const nav = navRef.current;
      const hero = heroRef.current;
      if (reduced || !nav || !hero) return;

      return bindNavScrollChrome(nav, hero, {
        bg: 'rgba(251, 251, 250, 0.92)',
        border: MKT.border,
      });
    },
    { dependencies: [heroRef, reduced] },
  );

  useGSAP(
    () => {
      const nav = navRef.current;
      if (reduced || !nav) return;

      if (menuOpen) {
        gsap.to(nav, {
          backgroundColor: 'rgba(251, 251, 250, 0.96)',
          borderBottomColor: MKT.border,
          backdropFilter: 'blur(14px)',
          duration: 0.3,
          ease: landingRevealDefaults.ease,
        });
      }
    },
    { dependencies: [menuOpen, reduced] },
  );

  return (
    <nav
      ref={navRef}
      className={clsx(
        'fixed inset-x-0 top-0 z-[60] border-b border-transparent transition-transform duration-300 ease-out',
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: MKT.maxContentWidth }}>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          <Link
            href="/"
            className="truncate text-[1.05rem] font-medium tracking-[-0.02em] transition-opacity hover:opacity-70 sm:text-lg"
            style={{ color: MKT.textPrimary }}
          >
            Oikaro
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ProductsMegaMenu onSolidBackground={menuOpen} onOpenChange={setMenuOpen} />
            <Link
              href="/auth/login"
              className="hidden px-3 py-2 text-sm font-medium transition-opacity hover:opacity-70 md:inline-flex"
              style={{ color: MKT.textSecondary }}
            >
              Sign in
            </Link>
            <MarketingButton href="/auth/signup" size="md" className="hidden sm:inline-flex">
              Start free trial
            </MarketingButton>
          </div>
        </div>
      </div>
    </nav>
  );
}

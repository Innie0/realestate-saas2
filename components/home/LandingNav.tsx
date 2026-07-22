'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';
import MarketingButton from '@/components/marketing/MarketingButton';
import { ensureGsapRegistered, gsap, landingRevealDefaults, useGSAP } from '@/lib/gsap-config';
import { MKT } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

type LandingNavProps = {
  heroRef: React.RefObject<HTMLElement | null>;
};

ensureGsapRegistered();

export default function LandingNav({ heroRef }: LandingNavProps) {
  const reduced = useMotionReduced();
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
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
        ...landingRevealDefaults,
        y: -16,
        duration: 0.6,
        delay: 0.05,
      });
    },
    { scope: navRef, dependencies: [reduced] },
  );

  const solid = scrolled || menuOpen;

  return (
    <nav
      ref={navRef}
      className={clsx(
        'fixed inset-x-0 top-0 z-[60] transition-transform duration-300 ease-out',
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
      )}
      style={{
        borderBottom: solid ? `1px solid ${MKT.border}` : '1px solid transparent',
        backgroundColor: solid ? 'rgba(251, 251, 250, 0.88)' : 'transparent',
        backdropFilter: solid ? 'blur(12px)' : 'none',
      }}
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
            <ProductsMegaMenu onSolidBackground={solid} onOpenChange={setMenuOpen} />
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
